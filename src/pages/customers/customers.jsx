import { useEffect, useState } from "react";
import axios from "axios";
import { Modal, Pagination } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import "./customers.css";

function Customers() {
  const [opened, { open, close }] = useDisclosure(false);
  const [customers, setCustomers] = useState([]);
  const [sortBy, setSortBy] = useState("default");

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: "",
  });

  const [editId, setEditId] = useState(null);

  // pagination state
  const [page, setPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    fetchCustomers();
  }, []);
//////
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

  //sortedCustomers variable
  const sortedCustomers = [...customers].sort((a, b) => {
    if (sortBy === "name-asc") {
      return a.name.localeCompare(b.name);
    }

    if (sortBy === "name-desc") {
      return b.name.localeCompare(a.name);
    }

    if (sortBy === "phone-asc") {
      return Number(a.phone) - Number(b.phone);
    }

    if (sortBy === "phone-desc") {
      return Number(b.phone) - Number(a.phone);
    }

    return 0;
  });
  ////////////

  // pagination working on sortedCustomers
  const totalPages = Math.ceil(sortedCustomers.length / itemsPerPage);

  const paginatedCustomers = sortedCustomers.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );
  /////////////

  useEffect(() => {
    if (totalPages > 0 && page > totalPages) {
      setPage(totalPages);
    }

    if (customers.length === 0) {
      setPage(1);
    }
  }, [customers, totalPages, page]);

  return (
    <div className="customers-page">
      <div className="customers-header">
        <div className="step-badge">2</div>

        <div>
          <h2>Customers</h2>
          <p>Manage your customer details</p>
        </div>
      </div>

{/* /// sort by  */}
      <div className="customers-top">
        <h3 className="form-title">CUSTOMERS LIST</h3>

        <div className="customers-controls">
          <button
            type="button"
            className="add-btn"
            onClick={handleOpenAddModal}
          >
            + Add Customer
          </button>

          <select
            className="sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="default">Default</option>
            <option value="name-asc">Name A-Z</option>
            <option value="name-desc">Name Z-A</option>
            <option value="phone-asc">Phone Low to High</option>
            <option value="phone-desc">Phone High to Low</option>
          </select>
        </div>
      </div>
{/* /// */}

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
              paginatedCustomers.map((item, index) => (
                <tr key={item.id}>
                  <td>{(page - 1) * itemsPerPage + index + 1}</td>
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

      {customers.length > 0 && (
        <div
          style={{
            marginTop: "20px",
            display: "flex",
            justifyContent: "center",
          }}
        >
          <Pagination
            total={totalPages}
            value={page}
            onChange={setPage}
            withEdges
            color="orange"
            radius="md"
          />
        </div>
      )}
    </div>
  );
}

export default Customers;