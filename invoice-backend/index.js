const express = require("express");
const cors = require("cors");
const pool = require("./db");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Backend running");
});

/* PRODUCTS */

// Get all products
app.get("/products", async (req, res) => {
  const page = parseInt(req.query.page) || 1
  const limit = 10
  const offset = (page - 1) * limit
  const search = req.query.search || ""

  const data = await pool.query(
    `SELECT * FROM products
    WHERE name ILIKE $1
    ORDER BY id DESC
    LIMIT $2 OFFSET $3`,
    [`%${search}%`, limit, offset]
  )

  const count = await pool.query(
    `SELECT COUNT(*) FROM products WHERE name ILIKE $1`,
    [`%${search}%`]
  )
  res.json({
    data: data.rows,
    totalPages: Math.ceil(count.rows[0].count / limit)
  })
})

// Add product
app.post("/products", async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const { name, price, unit, quantity } = req.body;

    const result = await client.query(
      "INSERT INTO products (name, price, unit, quantity) VALUES ($1,$2,$3,$4) RETURNING *",
      [name, price, unit, quantity]
    );

    const newProduct = result.rows[0];

    if (quantity > 0) {
      await client.query(
        `INSERT INTO inventory_logs 
        (product_id, product_name, transaction_type, quantity_changed, notes)
        VALUES ($1,$2,'IN',$3,'Initial Stock Added')`,
        [newProduct.id, newProduct.name, quantity]
      );
    }

    await client.query("COMMIT");
    res.json(newProduct);

  } catch (err) {
    await client.query("ROLLBACK");
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// Update product
app.put("/products/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, unit, quantity } = req.body;

    const result = await pool.query(
      "UPDATE products SET name = $1, price = $2, unit = $3, quantity = $4 WHERE id = $5 RETURNING *",
      [name, price, unit, quantity, id],
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Update product error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Delete product
app.delete("/products/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM products WHERE id = $1", [req.params.id]);
    res.json({ message: "Product deleted" });
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

/* CUSTOMERS */

// Get all customers
app.get("/customers", async (req, res) => {
  try {
    const { search } = req.query;
    let result;
    if (search) {
      result = await pool.query(
        "SELECT * FROM customers WHERE name ILIKE $1 OR address ILIKE $1 ORDER BY 1",
        [`%${search}%`],
      );
    } else {
      result = await pool.query("SELECT * FROM customers ORDER BY 1");
    }
    res.json(result.rows);
  } catch (error) {
    console.error("products error", error);
    res.status(500).json({ error: error.messagw });
  }
});

// Add customer
app.post("/customers", async (req, res) => {
  try {
    const { name, phone, address } = req.body;

    const result = await pool.query(
      "INSERT INTO customers (name, phone, address) VALUES ($1, $2, $3) RETURNING *",
      [name, phone, address],
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

    const result = await pool.query(
      "UPDATE customers SET name = $1, phone = $2, address = $3 WHERE id = $4 RETURNING *",
      [name, phone, address, id],
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Update customer error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Delete customer
app.delete("/customers/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM customers WHERE id = $1", [req.params.id]);
    res.json({ message: "Customer deleted" });
  } catch (error) {
    console.error("Delete customer error:", error);

    if (error.code === "23503") {
      return res.status(400).json({
        error:
          "This customer is used in invoices, so it cannot be deleted unless relationship allows it.",
      });
    }

    res.status(500).json({ error: error.message });
  }
});

/* INVOICES */

// Save invoice
app.post("/invoices", async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const { customer_id, invoice_date, subtotal, gst, grand_total, items } = req.body;

    const invoiceResult = await client.query(
      `INSERT INTO invoices 
      (customer_id, invoice_date, subtotal, gst, grand_total)
      VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [customer_id, invoice_date, subtotal, gst, grand_total]
    );

    const invoice = invoiceResult.rows[0];

    for (const item of items) {

      // 1. INSERT ITEM
      await client.query(
        `INSERT INTO invoice_items 
        (invoice_id, product_id, product_name, price, qty, unit, total)
        VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [
          invoice.id,
          item.product_id,
          item.product_name,
          item.price,
          item.qty,
          item.unit,
          item.total
        ]
      );

      // 2. DEDUCT STOCK
      await client.query(
        "UPDATE products SET quantity = quantity - $1 WHERE id = $2",
        [item.qty, item.product_id]
      );

      // 3. LOG OUT 🔥
      await client.query(
        `INSERT INTO inventory_logs 
        (product_id, product_name, transaction_type, quantity_changed, notes)
        VALUES ($1,$2,'OUT',$3,'Sold via Invoice')`,
        [item.product_id, item.product_name, item.qty]
      );
    }

    await client.query("COMMIT");

    res.json(invoice);

  } catch (err) {
    await client.query("ROLLBACK");
    res.status(500).json({ error: err.message });
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
         WHERE invoice_id = $1`,
        [invoices[i].id],
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
  try {
    const { id } = req.params;

    await pool.query("DELETE FROM invoice_items WHERE invoice_id = $1", [id])

    await pool.query("DELETE FROM invoices WHERE id = $1", [id]);

    res.json({ message: "Invoice deleted successfully" });
  } catch (error) {
    console.error("Delete invoice error:", error);
    res.status(500).json({ error: error.message });
  }
});

// get weekly sales tool
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
    console.error("weekly sales error: ", error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/inventory/deduct", async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const { product_id, product_name, quantity, notes } = req.body;

    const stockCheck = await client.query(
      "SELECT quantity FROM products WHERE id = $1",
      [product_id]
    );

    const current = stockCheck.rows[0]?.quantity || 0;

    if (quantity > current) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        error: `Not enough stock. Available: ${current}`
      });
    }

    await client.query(
      "UPDATE products SET quantity = quantity - $1 WHERE id = $2",
      [quantity, product_id]
    );

    await client.query(
      `INSERT INTO inventory_logs 
      (product_id, product_name, transaction_type, quantity_changed, notes)
      VALUES ($1,$2,'OUT',$3,$4)`,
      [product_id, product_name, quantity, notes || "Manual Deduction"]
    );

    await client.query("COMMIT");

    res.json({ success: true });

  } catch (err) {
    await client.query("ROLLBACK");
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

app.get("/inventory-logs", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const offset = (page - 1) * limit;

    const logs = await pool.query(
      "SELECT * FROM inventory_logs ORDER BY timestamp DESC LIMIT $1 OFFSET $2",
      [limit, offset]
    );

    const count = await pool.query("SELECT COUNT(*) FROM inventory_logs");

    const totalItems = parseInt(count.rows[0].count);
    const totalPages = Math.ceil(totalItems / limit);

    res.json({
      data: logs.rows,
      totalPages
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/inventory/add", async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const { product_id, product_name, quantity, notes } = req.body;

    await client.query(
      "UPDATE products SET quantity = quantity + $1 WHERE id = $2",
      [quantity, product_id]
    );

    await client.query(
      `INSERT INTO inventory_logs 
      (product_id, product_name, transaction_type, quantity_changed, notes)
      VALUES ($1,$2,'IN',$3,$4)`,
      [product_id, product_name, quantity, notes || "Stock Added"]
    );

    await client.query("COMMIT");

    res.json({ success: true });

  } catch (err) {
    await client.query("ROLLBACK");
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

app.listen(5001, () => {
  console.log("Server running on port 5000");
});
