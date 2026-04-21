import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "./CreateInvoice.css";

function CreateInvoice() {
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");

  const [invoiceDate, setInvoiceDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });

  const [invoiceItems, setInvoiceItems] = useState([
    {
      id: Date.now(),
      productId: "",
      qty: 1,
    },
  ]);

  useEffect(() => {
    fetchCustomers();
    fetchProducts();
  }, []);

  async function fetchCustomers() {
    try {
      const response = await axios.get("http://127.0.0.1:5000/customers");
      console.log("Create Invoice Customers API:", response.data);
      setCustomers(response.data);

      if (response.data.length > 0) {
        setSelectedCustomerId(String(response.data[0].id));
      }
    } catch (error) {
      console.error("Fetch customers error:", error);
    }
  }

  async function fetchProducts() {
    try {
      const response = await axios.get("http://127.0.0.1:5000/products");
      console.log("Create Invoice Products API:", response.data);
      setProducts(response.data);
    } catch (error) {
      console.error("Fetch products error:", error);
    }
  }

  const selectedCustomer =
    customers.find(
      (customer) => String(customer.id) === String(selectedCustomerId)
    ) || null;

  function handleItemChange(id, field, value) {
    setInvoiceItems((prevItems) =>
      prevItems.map((item) =>
        item.id === id
          ? {
              ...item,
              [field]: field === "qty" ? Number(value) || 1 : value,
            }
          : item
      )
    );
  }

  function addAnotherItem() {
    setInvoiceItems((prev) => [
      ...prev,
      {
        id: Date.now() + Math.random(),
        productId: "",
        qty: 1,
      },
    ]);
  }

  function removeItem(id) {
    if (invoiceItems.length === 1) {
      alert("At least one item is required");
      return;
    }

    setInvoiceItems((prev) => prev.filter((item) => item.id !== id));
  }

  function clearAll() {
    setSelectedCustomerId(customers.length > 0 ? String(customers[0].id) : "");
    setInvoiceDate(new Date().toISOString().split("T")[0]);
    setInvoiceItems([
      {
        id: Date.now(),
        productId: "",
        qty: 1,
      },
    ]);
  }

  const calculatedItems = useMemo(() => {
    return invoiceItems.map((item) => {
      const product = products.find(
        (productItem) => String(productItem.id) === String(item.productId)
      );

      const price = product ? Number(product.price) : 0;
      const unit = product ? product.unit : "";
      const total = price * Number(item.qty || 0);

      return {
        ...item,
        product,
        price,
        unit,
        total,
      };
    });
  }, [invoiceItems, products]);

  const subtotal = calculatedItems.reduce((sum, item) => sum + item.total, 0);
  const gst = subtotal * 0.18;
  const grandTotal = subtotal + gst;

  async function handleSaveInvoice() {
    if (!selectedCustomerId) {
      alert("Please select a customer");
      return;
    }

    const validItems = calculatedItems.filter((item) => item.product);

    if (validItems.length === 0) {
      alert("Please select at least one product");
      return;
    }

    const hasInvalidQty = validItems.some((item) => !item.qty || item.qty < 1);

    if (hasInvalidQty) {
      alert("Quantity must be at least 1");
      return;
    }

    try {
      await axios.post("http://127.0.0.1:5000/invoices", {
        customer_id: Number(selectedCustomerId),
        invoice_date: invoiceDate,
        subtotal,
        gst,
        grand_total: grandTotal,
        items: validItems.map((item) => ({
          product_id: item.product.id,
          product_name: item.product.name,
          price: item.price,
          qty: item.qty,
          unit: item.unit,
          total: item.total,
        })),
      });

      alert("Invoice saved successfully");
      clearAll();
    } catch (error) {
      console.error("Save invoice error:", error);
      alert("Invoice save failed");
    }
  }

  return (
    <div className="invoice-page">
      <div className="invoice-header">
        <div className="step-badge">3</div>

        <div>
          <h2>Create Invoice</h2>
          <p>
            Select a customer, add products with quantities, and generate the
            invoice
          </p>
        </div>
      </div>

      <div className="invoice-top-row">
        <div className="customer-field">
          <label>Select Customer *</label>
          <select
            value={selectedCustomerId}
            onChange={(e) => setSelectedCustomerId(e.target.value)}
          >
            {customers.length === 0 ? (
              <option value="">No customers available</option>
            ) : (
              customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name} - {customer.phone}
                </option>
              ))
            )}
          </select>
        </div>

        <div className="date-field">
          <label>Invoice Date</label>
          <input
            type="date"
            value={invoiceDate}
            onChange={(e) => setInvoiceDate(e.target.value)}
          />
        </div>
      </div>

      <hr className="divider" />

      <div className="items-section">
        <h3>INVOICE ITEMS</h3>

        <div className="invoice-table-wrapper">
          <table className="invoice-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Product</th>
                <th>Price</th>
                <th>Qty</th>
                <th>Unit</th>
                <th>Total</th>
                <th></th>
              </tr>
            </thead>

            <tbody>
              {calculatedItems.map((item, index) => (
                <tr key={item.id}>
                  <td>{index + 1}</td>

                  <td>
                    <select
                      className="product-select"
                      value={item.productId}
                      onChange={(e) =>
                        handleItemChange(item.id, "productId", e.target.value)
                      }
                    >
                      <option value="">Select product</option>
                      {products.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.name}
                        </option>
                      ))}
                    </select>
                  </td>

                  <td>Rs. {item.price}</td>

                  <td>
                    <input
                      className="qty-input"
                      type="number"
                      min="1"
                      value={item.qty}
                      onChange={(e) =>
                        handleItemChange(item.id, "qty", e.target.value)
                      }
                    />
                  </td>

                  <td>{item.unit || "-"}</td>

                  <td>Rs. {item.total}</td>

                  <td>
                    <button
                      type="button"
                      className="remove-btn"
                      onClick={() => removeItem(item.id)}
                    >
                      X
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <button
          type="button"
          className="add-item-btn"
          onClick={addAnotherItem}
        >
          + Add Another Item
        </button>
      </div>

      <div className="invoice-bottom">
        <div className="invoice-actions">
          <button
            type="button"
            className="save-btn"
            onClick={handleSaveInvoice}
          >
            Save Invoice
          </button>

          <button type="button" className="clear-btn" onClick={clearAll}>
            Clear All
          </button>
        </div>

        <div className="summary-box">
          <div className="summary-row">
            <span>Subtotal</span>
            <span>Rs. {subtotal.toFixed(2)}</span>
          </div>

          <div className="summary-row">
            <span>GST (18%)</span>
            <span>Rs. {gst.toFixed(2)}</span>
          </div>

          <div className="summary-row grand-total">
            <span>Grand Total</span>
            <span>Rs. {grandTotal.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CreateInvoice;

