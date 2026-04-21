import { useEffect, useState } from "react";
import axios from "axios";
import { Modal } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import "./customers.css";

function Customers() {
  const [opened, { open, close }] = useDisclosure(false);
  const [customers, setCustomers] = useState([]);

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: "",
  });

  const [editId, setEditId] = useState(null);

  useEffect(() => {
    fetchCustomers();
  }, []);

  async function fetchCustomers() {
    try {
      const response = await axios.get("http://127.0.0.1:5000/customers");
      console.log("Customers API:", response.data);
      setCustomers(response.data);
    } catch (error) {
      console.error("Fetch customers error:", error);
    }
  }

  function resetForm() {
    setFormData({
      name: "",
      phone: "",
      address: "",
    });
    setEditId(null);
  }

  function handleOpenAddModal() {
    resetForm();
    open();
  }

  function handleChange(e) {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!formData.name.trim()) {
      alert("Customer name required");
      return;
    }

    try {
      if (editId) {
        await axios.put(`http://127.0.0.1:5000/customers/${editId}`, formData);
      } else {
        await axios.post("http://127.0.0.1:5000/customers", formData);
      }

      await fetchCustomers();
      resetForm();
      close();
    } catch (error) {
      console.error("Submit customer error:", error);
      alert(error.response?.data?.error || "Customer save failed");
    }
  }

  function handleEdit(customer) {
    setFormData({
      name: customer.name || "",
      phone: customer.phone || "",
      address: customer.address || "",
    });

    setEditId(customer.id);
    open();
  }

  async function handleDelete(id) {
    try {
      await axios.delete(`http://127.0.0.1:5000/customers/${id}`);
      await fetchCustomers();
    } catch (error) {
      console.error("Delete customer error:", error);
      alert(error.response?.data?.error || "Customer delete failed");
    }
  }

  return (
    <div className="customers-page">
      <div className="customers-header">
        <div className="step-badge">2</div>

        <div>
          <h2>Customers</h2>
          <p>Manage your customer details</p>
        </div>
      </div>

      <div className="customers-top">
        <h3 className="form-title">CUSTOMERS LIST</h3>

        <button
          type="button"
          className="add-btn"
          onClick={handleOpenAddModal}
        >
          + Add Customer
        </button>
      </div>

      <div className="table-wrapper">
        <table className="customers-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Name</th>
              <th>Phone</th>
              <th>Address</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {customers.length > 0 ? (
              customers.map((item, index) => (
                <tr key={item.id}>
                  <td>{index + 1}</td>
                  <td>{item.name}</td>
                  <td>{item.phone}</td>
                  <td>{item.address || "-"}</td>
                  <td>
                    <div className="action-buttons">
                      <button
                        type="button"
                        className="edit-btn"
                        onClick={() => handleEdit(item)}
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        className="delete-btn"
                        onClick={() => handleDelete(item.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="no-data">
                  No customers added
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal
        opened={opened}
        onClose={() => {
          resetForm();
          close();
        }}
        title={editId ? "Edit Customer" : "Add Customer"}
        centered
        size="lg"
        radius="md"
      >
        <form className="customer-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Customer Name *</label>
            <p>Enter full customer name</p>
            <input
              type="text"
              name="name"
              placeholder="Enter customer name"
              value={formData.name}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>Phone Number</label>
            <p>Enter mobile number</p>
            <input
              type="text"
              name="phone"
              placeholder="e.g. 9876543210"
              value={formData.phone}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>Address</label>
            <p>Optional address field</p>
            <textarea
              name="address"
              rows="4"
              placeholder="Enter address"
              value={formData.address}
              onChange={handleChange}
            ></textarea>
          </div>

          <div className="button-group">
            <button type="submit" className="add-btn">
              {editId ? "Update Customer" : "+ Add Customer"}
            </button>

            <button
              type="button"
              className="clear-btn"
              onClick={() => {
                resetForm();
                close();
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default Customers;