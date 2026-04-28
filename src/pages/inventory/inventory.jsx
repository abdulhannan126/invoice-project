import { useEffect, useState } from "react";
import axios from "axios";
import { Pagination } from "@mantine/core";
import "./inventory.css"

export function Inventory() {
  const [products, setProducts] = useState([]);
  const [logs, setLogs] = useState([]);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [selectedProductId, setSelectedProductId] = useState("");
  const [qty, setQty] = useState("");
  const [notes, setNotes] = useState("");

  const [mode, setMode] = useState("add"); // add or deduct
  const [msg, setMsg] = useState("");

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    fetchLogs(page);
  }, [page]);

  async function fetchProducts() {
    const res = await axios.get("http://localhost:5001/products");
    setProducts(res.data.data);
  }

  async function fetchLogs(p) {
    const res = await axios.get(`http://localhost:5001/inventory-logs?page=${p}`);
    setLogs(res.data.data);
    setTotalPages(res.data.totalPages);
  }

  async function handleSubmit() {
    if (!selectedProductId || !qty) {
      setMsg("Select product and quantity");
      return;
    }

    const product = products.find(p => p.id == selectedProductId);

    try {
      if (mode === "add") {
        await axios.post("http://localhost:5001/inventory/add", {
          product_id: product.id,
          product_name: product.name,
          quantity: Number(qty),
          notes
        });
      } else {
        await axios.post("http://localhost:5001/inventory/deduct", {
          product_id: product.id,
          product_name: product.name,
          quantity: Number(qty),
          notes
        });
      }

      setMsg("Success");
      setQty("");
      setNotes("");
      setSelectedProductId("");

      fetchProducts();
      fetchLogs(1);
      setPage(1);

    } catch (err) {
      setMsg(err.response?.data?.error || "Error");
    }
  }

  return (
  <div className="inventory-page">

    {/* HEADER */}
    <div className="inventory-header">
      <div>
        <h2>Inventory</h2>
        <p>Manage stock movements (IN / OUT)</p>
      </div>
    </div>

    {/* MODE SWITCH */}
    <div className="mode-switch">
      <button
        className={`mode-btn ${mode === "add" ? "active" : ""}`}
        onClick={() => setMode("add")}
      >
        Add Stock
      </button>

      <button
        className={`mode-btn ${mode === "deduct" ? "active" : ""}`}
        onClick={() => setMode("deduct")}
      >
        Deduct Stock
      </button>
    </div>

    {/* FORM */}
    <div className="inventory-form">
      <select
        value={selectedProductId}
        onChange={(e) => setSelectedProductId(e.target.value)}
      >
        <option value="">Select Product</option>
        {products.map(p => (
          <option key={p.id} value={p.id}>
            {p.name} (Stock: {p.quantity})
          </option>
        ))}
      </select>

      <input
        type="number"
        placeholder="Quantity"
        value={qty}
        onChange={(e) => setQty(e.target.value)}
      />

      <input
        type="text"
        placeholder="Notes"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />

      <button onClick={handleSubmit}>
        {mode === "add" ? "Add Stock" : "Deduct Stock"}
      </button>

      <p className={`msg ${msg === "Success" ? "success" : "error"}`}>
        {msg}
      </p>
    </div>

    {/* TABLE */}
    <div className="log-table-wrapper">
      <table className="log-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Product</th>
            <th>Type</th>
            <th>Qty</th>
            <th>Notes</th>
          </tr>
        </thead>

        <tbody>
          {logs.map(log => (
            <tr key={log.id}>
              <td>{new Date(log.timestamp).toLocaleString()}</td>
              <td>{log.product_name}</td>
              <td className={log.transaction_type === "IN" ? "in-type" : "out-type"}>
                {log.transaction_type}
              </td>
              <td>{log.quantity_changed}</td>
              <td>{log.notes}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    {/* PAGINATION */}
    <div className="pagination-wrapper">
      <Pagination
        value={page}
        onChange={setPage}
        total={totalPages}
      />
    </div>

  </div>
)}