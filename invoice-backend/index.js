const express = require("express");
const cors = require("cors");
const pool = require("./db");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Backend running");
});

/*PRODUCTS*/

// Get all products
app.get("/products", async (req, res) => {
  try {
    const { search } = req.query;
    let result;

    if (search) {
      result = await pool.query(
        "SELECT * FROM products WHERE name ILIKE $1 ORDER BY id ASC",
        [`%${search}%`]
      );
    } else {
      result = await pool.query("SELECT * FROM products ORDER BY id ASC");
    }

    res.json(result.rows);
  } catch (error) {
    console.error("Products error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Add product

app.post("/products", async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const { name, price, unit, quantity } = req.body;

    if (!name || !String(name).trim()) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Product name is required" });
    }

    if (price === undefined || price === null || Number(price) <= 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Valid product price is required" });
    }

    if (!unit || !String(unit).trim()) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Product unit is required" });
    }

    if (quantity === undefined || quantity === null || Number(quantity) < 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        error: "Valid product quantity is required",
      });
    }

    const result = await client.query(
      `INSERT INTO products (name, price, unit, quantity)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [
        String(name).trim(),
        Number(price),
        String(unit).trim(),
        Number(quantity),
      ]
    );

    const newProduct = result.rows[0];

   
    if (Number(quantity) > 0) {
      await client.query(
        `INSERT INTO inventory_logs
         (product_id, product_name, transaction_type, quantity_changed, notes)
         VALUES ($1, $2, 'IN', $3, 'Initial Stock Added')`,
        [newProduct.id, newProduct.name, Number(quantity)]
      );
    }

    await client.query("COMMIT");

    res.json(newProduct);
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Add product error:", error);
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
});

// Update product

app.put("/products/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, unit, quantity } = req.body;

    if (!name || !String(name).trim()) {
      return res.status(400).json({ error: "Product name is required" });
    }

    if (price === undefined || price === null || Number(price) <= 0) {
      return res.status(400).json({ error: "Valid product price is required" });
    }

    if (!unit || !String(unit).trim()) {
      return res.status(400).json({ error: "Product unit is required" });
    }

    if (quantity === undefined || quantity === null || Number(quantity) < 0) {
      return res.status(400).json({
        error: "Valid product quantity is required",
      });
    }

    const result = await pool.query(
      `UPDATE products
       SET name = $1, price = $2, unit = $3, quantity = $4
       WHERE id = $5
       RETURNING *`,
      [
        String(name).trim(),
        Number(price),
        String(unit).trim(),
        Number(quantity),
        id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Update product error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Delete product
app.delete("/products/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "DELETE FROM products WHERE id = $1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error("Delete product error:", error);

    if (error.code === "23503") {
      return res.status(400).json({
        error: "This product is used in invoices, so it cannot be deleted.",
      });
    }

    res.status(500).json({ error: error.message });
  }
});

/*CUSTOMERS*/

// Get all customers
app.get("/customers", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM customers ORDER BY id ASC");
    res.json(result.rows);
  } catch (error) {
    console.error("Customers error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Add customer
app.post("/customers", async (req, res) => {
  try {
    const { name, phone, address } = req.body;

    if (!name || !String(name).trim()) {
      return res.status(400).json({ error: "Customer name is required" });
    }

    const result = await pool.query(
      "INSERT INTO customers (name, phone, address) VALUES ($1, $2, $3) RETURNING *",
      [
        String(name).trim(),
        phone ? String(phone).trim() : "",
        address ? String(address).trim() : "",
      ]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Add customer error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Update customer
app.put("/customers/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, address } = req.body;

    if (!name || !String(name).trim()) {
      return res.status(400).json({ error: "Customer name is required" });
    }

    const result = await pool.query(
      "UPDATE customers SET name = $1, phone = $2, address = $3 WHERE id = $4 RETURNING *",
      [
        String(name).trim(),
        phone ? String(phone).trim() : "",
        address ? String(address).trim() : "",
        id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Customer not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Update customer error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Delete customer
app.delete("/customers/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "DELETE FROM customers WHERE id = $1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Customer not found" });
    }

    res.json({ message: "Customer deleted successfully" });
  } catch (error) {
    console.error("Delete customer error:", error);

    if (error.code === "23503") {
      return res.status(400).json({
        error:
          "This customer is used in invoices, so it cannot be deleted unless related invoices are removed first.",
      });
    }

    res.status(500).json({ error: error.message });
  }
});

/*INVOICES*/

// Save invoice
// Yaha invoice save hoga + stock check hoga + stock deduct hoga + inventory OUT log banega
app.post("/invoices", async (req, res) => {
  const client = await pool.connect();

  try {
    const {
      customer_id,
      invoice_date,
      subtotal,
      gst,
      grand_total,
      items,
    } = req.body;

    if (!customer_id) {
      return res.status(400).json({ error: "Customer is required" });
    }

    if (!invoice_date) {
      return res.status(400).json({ error: "Invoice date is required" });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        error: "At least one invoice item is required",
      });
    }

    await client.query("BEGIN");

    // Pehle stock validate kar rahe hain, taaki negative stock na ho
    for (const item of items) {
      if (!item.product_id || !item.product_name || Number(item.qty) < 1) {
        await client.query("ROLLBACK");
        return res.status(400).json({
          error: "Invalid invoice item data",
        });
      }

      const stockResult = await client.query(
        "SELECT id, name, quantity FROM products WHERE id = $1",
        [Number(item.product_id)]
      );

      const product = stockResult.rows[0];

      if (!product) {
        await client.query("ROLLBACK");
        return res.status(400).json({
          error: `Product not found: ${item.product_name}`,
        });
      }

      if (Number(product.quantity) < Number(item.qty)) {
        await client.query("ROLLBACK");
        return res.status(400).json({
          error: `Insufficient stock for "${product.name}". Available: ${product.quantity}, Requested: ${item.qty}`,
        });
      }
    }

    // Invoice main table me save ho raha hai
    const invoiceResult = await client.query(
      `INSERT INTO invoices (customer_id, invoice_date, subtotal, gst, grand_total)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        Number(customer_id),
        invoice_date,
        Number(subtotal || 0),
        Number(gst || 0),
        Number(grand_total || 0),
      ]
    );

    const invoice = invoiceResult.rows[0];

    // Har invoice item save hoga + product stock minus hoga + inventory log me OUT entry banegi
    for (const item of items) {
      await client.query(
        `INSERT INTO invoice_items
         (invoice_id, product_id, product_name, price, qty, unit, total)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          invoice.id,
          Number(item.product_id),
          String(item.product_name).trim(),
          Number(item.price || 0),
          Number(item.qty || 0),
          item.unit ? String(item.unit).trim() : "",
          Number(item.total || 0),
        ]
      );

      await client.query(
        `UPDATE products
         SET quantity = quantity - $1
         WHERE id = $2`,
        [Number(item.qty), Number(item.product_id)]
      );

      await client.query(
        `INSERT INTO inventory_logs
         (product_id, product_name, transaction_type, quantity_changed, notes)
         VALUES ($1, $2, 'OUT', $3, 'Sold via Invoice')`,
        [
          Number(item.product_id),
          String(item.product_name).trim(),
          Number(item.qty),
        ]
      );
    }

    await client.query("COMMIT");
    res.json(invoice);
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Save invoice error:", error);
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
});

// Get all invoices with customer + items
app.get("/invoices", async (req, res) => {
  try {
    const invoicesResult = await pool.query(`
      SELECT 
        invoices.id,
        invoices.customer_id,
        invoices.invoice_date,
        invoices.subtotal,
        invoices.gst,
        invoices.grand_total,
        customers.name AS customer_name,
        customers.phone,
        customers.address
      FROM invoices
      LEFT JOIN customers
      ON invoices.customer_id = customers.id
      ORDER BY invoices.id DESC
    `);

    const invoices = invoicesResult.rows;

    for (let i = 0; i < invoices.length; i++) {
      const itemsResult = await pool.query(
        `SELECT
           id,
           invoice_id,
           product_id,
           product_name,
           price,
           qty,
           unit,
           total
         FROM invoice_items
         WHERE invoice_id = $1
         ORDER BY id ASC`,
        [invoices[i].id]
      );

      invoices[i].items = itemsResult.rows || [];
    }

    res.json(invoices);
  } catch (error) {
    console.error("Invoices error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Delete invoice
app.delete("/invoices/:id", async (req, res) => {
  const client = await pool.connect();

  try {
    const { id } = req.params;

    await client.query("BEGIN");

    await client.query("DELETE FROM invoice_items WHERE invoice_id = $1", [id]);

    const deleteInvoiceResult = await client.query(
      "DELETE FROM invoices WHERE id = $1 RETURNING *",
      [id]
    );

    if (deleteInvoiceResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Invoice not found" });
    }

    await client.query("COMMIT");

    res.json({ message: "Invoice deleted successfully" });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Delete invoice error:", error);
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
});

/*INVENTORY*/

// Manual stock addition
// Inventory page se stock manually add karne ke liye route
app.post("/inventory/add", async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const { product_id, product_name, quantity, notes } = req.body;

    // validation check kar rahe hain
    if (!product_id || !product_name || Number(quantity) < 1) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        error: "Product and valid quantity are required",
      });
    }

    // Product exist karta hai ya nahi ye check kar rahe hain
    const productCheck = await client.query(
      "SELECT id, name FROM products WHERE id = $1",
      [Number(product_id)]
    );

    if (productCheck.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({
        error: "Product not found",
      });
    }

    // Product table me quantity add ho rahi hai
    await client.query(
      "UPDATE products SET quantity = quantity + $1 WHERE id = $2",
      [Number(quantity), Number(product_id)]
    );

    // Inventory history me IN log save hoga
    await client.query(
      `INSERT INTO inventory_logs
       (product_id, product_name, transaction_type, quantity_changed, notes)
       VALUES ($1, $2, 'IN', $3, $4)`,
      [
        Number(product_id),
        String(product_name).trim(),
        Number(quantity),
        notes || "Manual Stock Added",
      ]
    );

    await client.query("COMMIT");

    res.json({
      success: true,
      message: "Stock added and logged.",
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Inventory add error:", error);

    res.status(500).json({
      error: error.message,
    });
  } finally {
    client.release();
  }
});

// Manual stock deduction
// Inventory page se stock manually minus karne ke liye route
app.post("/inventory/deduct", async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const { product_id, product_name, quantity, notes } = req.body;

    if (!product_id || !product_name || Number(quantity) < 1) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        error: "Product and valid quantity are required",
      });
    }

    // Current stock check kar rahe hain
    const stockCheck = await client.query(
      "SELECT quantity FROM products WHERE id = $1",
      [Number(product_id)]
    );

    const current = Number(stockCheck.rows[0]?.quantity ?? 0);

    // Available stock se zyada deduct nahi hone dena
    if (Number(quantity) > current) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        error: `Not enough stock. Available: ${current}, Requested: ${quantity}`,
      });
    }

    // Product table se quantity minus hogi
    await client.query(
      "UPDATE products SET quantity = quantity - $1 WHERE id = $2",
      [Number(quantity), Number(product_id)]
    );

    // Inventory history me OUT log save hoga
    await client.query(
      `INSERT INTO inventory_logs
       (product_id, product_name, transaction_type, quantity_changed, notes)
       VALUES ($1, $2, 'OUT', $3, $4)`,
      [
        Number(product_id),
        String(product_name).trim(),
        Number(quantity),
        notes || "Manual Deduction",
      ]
    );

    await client.query("COMMIT");

    res.json({
      success: true,
      message: "Stock deducted and logged.",
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Inventory deduct error:", error);
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
});

// Inventory logs with server-side pagination
// Isme ek baar me sirf current page ke logs fetch honge
app.get("/inventory-logs", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const logsResult = await pool.query(
      "SELECT * FROM inventory_logs ORDER BY timestamp DESC LIMIT $1 OFFSET $2",
      [limit, offset]
    );

    const countResult = await pool.query("SELECT COUNT(*) FROM inventory_logs");

    const totalItems = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(totalItems / limit);

    res.json({
      data: logsResult.rows,
      currentPage: page,
      totalPages,
      totalItems,
    });
  } catch (error) {
    console.error("Inventory logs error:", error);
    res.status(500).json({ error: error.message });
  }
});

/*SALES*/

// Weekly sales
app.get("/sales/weekly", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        TO_CHAR(DATE_TRUNC('week', invoice_date::date), 'DD Mon') AS week,
        SUM(grand_total)::numeric AS total
      FROM invoices
      GROUP BY DATE_TRUNC('week', invoice_date::date)
      ORDER BY DATE_TRUNC('week', invoice_date::date) ASC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error("Weekly sales error:", error);
    res.status(500).json({ error: error.message });
  }
});

/*SERVER*/

const PORT = 5001;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});


