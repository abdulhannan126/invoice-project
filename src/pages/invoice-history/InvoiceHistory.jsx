import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "./InvoiceHistory.css";

function InvoiceHistory() {
  const [invoices, setInvoices] = useState([]);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState("");
  const [viewInvoice, setViewInvoice] = useState(null);

  useEffect(() => {
    fetchInvoices();
  }, []);

  async function fetchInvoices() {
    try {
      const response = await axios.get("http://localhost:5001/invoices");

      setInvoices(response.data);

      if (response.data.length > 0) {
        setSelectedInvoiceId(String(response.data[0].id));
        setViewInvoice(response.data[0]);
      } else {
        setSelectedInvoiceId("");
        setViewInvoice(null);
      }
    } catch (error) {
      console.error("Fetch invoices error:", error);
    }
  }

  const selectedInvoice = useMemo(() => {
    return (
      invoices.find(
        (invoice) => String(invoice.id) === String(selectedInvoiceId)
      ) || null
    );
  }, [invoices, selectedInvoiceId]);

  function handleViewInvoice() {
    if (!selectedInvoice) {
      alert("Please select an invoice");
      return;
    }

    setViewInvoice(selectedInvoice);
  }

  function handlePrintInvoice() {
    if (!viewInvoice) {
      alert("Please view an invoice first");
      return;
    }

    window.print();
  }

  async function handleDeleteInvoice() {
    if (!selectedInvoiceId) {
      alert("Please select an invoice");
      return;
    }

    const confirmDelete = window.confirm(
      "Are you sure you want to delete this invoice?"
    );

    if (!confirmDelete) return;

    try {
      await axios.delete(`http://localhost:5001/invoices/${selectedInvoiceId}`);

      alert("Invoice deleted successfully");

      await fetchInvoices();
    } catch (error) {
      console.error("Delete invoice error:", error);
      alert("Invoice delete failed");
    }
  }

  function formatDate(dateString) {
    if (!dateString) return "-";

    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  function getInvoiceNumber(invoice, index) {
    return `INV-${String(index + 1).padStart(3, "0")}`;
  }

  const currentInvoiceIndex = invoices.findIndex(
    (invoice) => String(invoice.id) === String(viewInvoice?.id)
  );

  return (
    <div className="history-page">
      <div className="history-header">
        <div className="step-badge">4</div>

        <div>
          <h2>Invoice History & Print</h2>
          <p>View saved invoices and print them</p>
        </div>
      </div>

      <div className="history-top-controls no-print">
        <div className="select-delete-row">
          <div className="select-group">
            <label>Select Invoice</label>
            <select
              value={selectedInvoiceId}
              onChange={(e) => setSelectedInvoiceId(e.target.value)}
            >
              {invoices.length === 0 ? (
                <option value="">No invoices available</option>
              ) : (
                invoices.map((invoice, index) => (
                  <option key={invoice.id} value={invoice.id}>
                    {getInvoiceNumber(invoice, index)} |{" "}
                    {invoice.customer_name} | {formatDate(invoice.invoice_date)}
                  </option>
                ))
              )}
            </select>
          </div>

          <button
            type="button"
            className="delete-invoice-btn"
            onClick={handleDeleteInvoice}
          >
            Delete
          </button>
        </div>

        <div className="history-buttons">
          <button type="button" className="view-btn" onClick={handleViewInvoice}>
            View
          </button>

          <button
            type="button"
            className="print-btn"
            onClick={handlePrintInvoice}
          >
            Print
          </button>
        </div>
      </div>

      {viewInvoice ? (
        <div className="invoice-preview print-area">
          <div className="preview-top">
            <div>
              <h3>Imatix General Store</h3>
              <p>Nagpada, Mumbai  | Phone: 011-23456789</p>
            </div>

            <div className="invoice-meta">
              <h4>INVOICE</h4>
              <p>{getInvoiceNumber(viewInvoice, currentInvoiceIndex)}</p>
              <p>{formatDate(viewInvoice.invoice_date)}</p>
            </div>
          </div>

          <div className="bill-box">
            <div>
              <p className="muted">Bill To:</p>
              <p>
                <strong>{viewInvoice.customer_name || "-"}</strong>
              </p>
              <p>{viewInvoice.address || "-"}</p>
            </div>

            <div>
              <p className="muted">Phone:</p>
              <p>
                <strong>{viewInvoice.phone || "-"}</strong>
              </p>
            </div>
          </div>

          <table className="preview-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Product</th>
                <th>Qty</th>
                <th>Unit</th>
                <th>Price</th>
                <th>Total</th>
              </tr>
            </thead>

            <tbody>
              {viewInvoice.items?.map((item, index) => (
                <tr key={item.id || index}>
                  <td>{index + 1}</td>
                  <td>{item.product_name}</td>
                  <td>{item.qty}</td>
                  <td>{item.unit}</td>
                  <td>Rs. {Number(item.price).toFixed(2)}</td>
                  <td>
                    <strong>Rs. {Number(item.total).toFixed(2)}</strong>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="totals-box">
            <div className="total-row">
              <span>Subtotal</span>
              <span>Rs. {Number(viewInvoice.subtotal || 0).toFixed(2)}</span>
            </div>

            <div className="total-row">
              <span>GST (18%)</span>
              <span>Rs. {Number(viewInvoice.gst || 0).toFixed(2)}</span>
            </div>

            <div className="total-row grand-row">
              <span>Grand Total</span>
              <span>Rs. {Number(viewInvoice.grand_total || 0).toFixed(2)}</span>
            </div>
          </div>

          <div className="invoice-footer">
            Thank you for your purchase! | Computer generated invoice
          </div>
        </div>
      ) : (
        <div className="empty-state">No invoice selected</div>
      )}
    </div>
  );
}

export default InvoiceHistory;





