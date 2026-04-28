import { useEffect, useState } from "react";
import axios from "axios";
import { Pagination } from "@mantine/core";
import "./Inventory.css";

function Inventory() {
  //products data store 
  const [products, setProducts] = useState([]);

  //inventory history logs  
  const [logs, setLogs] = useState([]);

  // pagination page
  const [page, setPage] = useState(1);
///////

  const [totalPages, setTotalPages] = useState(1);

  
  const [mode, setMode] = useState("IN");

  const [selectedProductId, setSelectedProductId] = useState("");


  const [quantity, setQuantity] = useState("");


  const [notes, setNotes] = useState("");

  const [msg, setMsg] = useState({ text: "", type: "" });

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    fetchLogs(page);
  }, [page]);

  // backend se products 
  async function fetchProducts() {
    try {
      const res = await axios.get("http://localhost:5001/products");
      setProducts(res.data);
    } catch (err) {
      console.error("Fetch products error:", err);
    }
  }

  // backend se inventory 
  async function fetchLogs(currentPage) {
    try {
      const res = await axios.get(
        `http://localhost:5001/inventory-logs?page=${currentPage}&limit=10`
      );

      setLogs(res.data.data);
      setTotalPages(res.data.totalPages);
    } catch (err) {
      console.error("Fetch logs error:", err);
    }
  }

  // stock add ya deduct 
  async function handleStockSubmit() {
    // product select and quantity 
    if (!selectedProductId || !quantity || Number(quantity) < 1) {
      setMsg({
        text: "Please select a product and enter valid quantity",
        type: "error",
      });
      return;
    }

    const product = products.find(
      (p) => String(p.id) === String(selectedProductId)
    );

    if (!product) {
      setMsg({
        text: "Selected product not found",
        type: "error",
      });
      return;
    }

    try {
      //  IN toh stock add , OUT toh stock deduct 
      const apiUrl =
        mode === "IN"
          ? "http://localhost:5001/inventory/add"
          : "http://localhost:5001/inventory/deduct";

       
      await axios.post(apiUrl, {
        product_id: product.id,
        product_name: product.name,
        quantity: Number(quantity),
        notes: notes || (mode === "IN" ? "Manual Stock Added" : "Manual Deduction"),
      });

      setMsg({
        text:
          mode === "IN"
            ? `Stock added to ${product.name} successfully`
            : `Stock deducted from ${product.name} successfully`,
        type: "success",
      });

      setSelectedProductId("");
      setQuantity("");
      setNotes("");

      fetchProducts();
      setPage(1);
      fetchLogs(1);
    } catch (err) {
      setMsg({
        text:
          err.response?.data?.error ||
          (mode === "IN" ? "Stock add failed" : "Deduction failed"),
        type: "error",
      });
    }
  }

  // selected product data 
  const selectedProduct = products.find(
    (p) => String(p.id) === String(selectedProductId)
  );

  return (
    <div className="inventory-page">
      <div className="inventory-header">
        <div className="step-badge">5</div>

        <div>
          <h2>Inventory</h2>
          <p>Manage stock movements and view inventory history</p>
        </div>
      </div>

      {/* Add Stock / Deduct Stock Button*/}
      <div className="inventory-mode-tabs">
        <button
          type="button"
          className={mode === "IN" ? "mode-tab active" : "mode-tab"}
          onClick={() => {
            setMode("IN");
            setMsg({ text: "", type: "" });
          }}
        >
          Add Stock
        </button>

        <button
          type="button"
          className={mode === "OUT" ? "mode-tab active" : "mode-tab"}
          onClick={() => {
            setMode("OUT");
            setMsg({ text: "", type: "" });
          }}
        >
          Deduct Stock
        </button>
      </div>

      <div className="deduct-section">
        <h3>{mode === "IN" ? "Add Stock" : "Deduct Stock"}</h3>

        <div className="deduct-form">
          <div className="form-group">
            <label>Select Product *</label>

            <select
              value={selectedProductId}
              onChange={(e) => {
                setSelectedProductId(e.target.value);
                setMsg({ text: "", type: "" });
              }}
            >
              <option value="">-- Choose product --</option>

              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name} | Available: {product.quantity} {product.unit}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Quantity *</label>

            <input
              type="number"
              min="1"
              placeholder="e.g. 5"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />

            {selectedProduct && (
              <small>
                Currently in stock: {selectedProduct.quantity}{" "}
                {selectedProduct.unit}
              </small>
            )}
          </div>

          <div className="form-group">
            <label>Notes</label>

            <input
              type="text"
              placeholder={
                mode === "IN"
                  ? "e.g. New stock purchase, Supplier entry"
                  : "e.g. Damaged, Expired, Used internally"
              }
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <button
            type="button"
            className="deduct-btn"
            onClick={handleStockSubmit}
          >
            {mode === "IN" ? "Add Stock" : "Deduct Stock"}
          </button>

          {msg.text && (
            <p className={msg.type === "error" ? "msg-error" : "msg-success"}>
              {msg.text}
            </p>
          )}
        </div>
      </div>

      <div className="log-section">
        <h3>Stock History Log</h3>

        <div className="log-table-wrapper">
          <table className="log-table">
            <thead>
              <tr>
                <th>Date & Time</th>
                <th>Product</th>
                <th>Type</th>
                <th>Quantity</th>
                <th>Notes</th>
              </tr>
            </thead>

            <tbody>
              {logs.length > 0 ? (
                logs.map((log) => (
                  <tr key={log.id}>
                    <td>{new Date(log.timestamp).toLocaleString("en-IN")}</td>
                    <td>{log.product_name}</td>
                    <td>
                      <span
                        className={
                          log.transaction_type === "IN" ? "log-in" : "log-out"
                        }
                      >
                        {log.transaction_type}
                      </span>
                    </td>
                    <td>{log.quantity_changed}</td>
                    <td>{log.notes || "-"}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="no-data">
                    No inventory movements yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="pagination-box">
            <Pagination
              value={page}
              onChange={setPage}
              total={totalPages}
              withEdges
              color="blue"
              radius="md"
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default Inventory;




