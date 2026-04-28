import { useEffect, useState } from "react";
import axios from "axios";
import { useDisclosure } from "@mantine/hooks";
import { Modal, Pagination } from "@mantine/core";
import "./Products.css";

function Products() {
  const [opened, { open, close }] = useDisclosure(false);
  const [products, setProducts] = useState([]);
  const [sortBy, setSortBy] = useState("default");
  const [searchTerm, setSearchTerm] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    price: "",
    unit: "kg",
  });

  const [editId, setEditId] = useState(null);

  // pagination state
  const [page, setPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    try {
      const response = await axios.get("http://127.0.0.1:5001/products");
      console.log("API products:", response.data);
      setProducts(response.data);
    } catch (error) {
      console.error("Fetch products error:", error);
    }
  }

  function resetForm() {
    setFormData({
      name: "",
      price: "",
      unit: "kg",
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

    if (!formData.name.trim() || !formData.price || !formData.unit) {
      alert("Please fill all required fields");
      return;
    }

    try {
      if (editId) {
        await axios.put(`http://127.0.0.1:5001/products/${editId}`, formData);
      } else {
        await axios.post("http://127.0.0.1:5001/products", formData);
      }

      await fetchProducts();
      resetForm();
      close();
    } catch (error) {
      console.error("Submit product error:", error);
      alert(error.response?.data?.error || "Product save failed");
    }
  }

  function handleEdit(product) {
    setFormData({
      name: product.name,
      price: product.price,
      unit: product.unit,
    });

    setEditId(product.id);
    open();
  }

  async function handleDelete(id) {
    try {
      await axios.delete(`http://127.0.0.1:5001/products/${id}`);
      await fetchProducts();
    } catch (error) {
      console.error("Delete product error:", error);
      alert(error.response?.data?.error || "Product delete failed");
    }
  }

  //filteredProducts variable
  const filteredProducts = products.filter((item) => {
    const value = searchTerm.toLowerCase().trim();

    if (!value) return true;

    return (
      String(item.name || "").toLowerCase().includes(value) ||
      String(item.price || "").toLowerCase().includes(value) ||
      String(item.unit || "").toLowerCase().includes(value)
    );
  });
  ////////////

  //sortedProducts variable
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === "name-asc") {
      return a.name.localeCompare(b.name);
    }

    if (sortBy === "name-desc") {
      return b.name.localeCompare(a.name);
    }

    if (sortBy === "price-asc") {
      return Number(a.price) - Number(b.price);
    }

    if (sortBy === "price-desc") {
      return Number(b.price) - Number(a.price);
    }

    if (sortBy === "unit-asc") {
      return String(a.unit).localeCompare(String(b.unit));
    }

    if (sortBy === "unit-desc") {
      return String(b.unit).localeCompare(String(a.unit));
    }

    return 0;
  });
  ////////////

  // pagination working on sortedProducts
  const totalPages = Math.ceil(sortedProducts.length / itemsPerPage);

  const paginatedProducts = sortedProducts.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );
  /////////////

  useEffect(() => {
    if (totalPages > 0 && page > totalPages) {
      setPage(totalPages);
    }
    if (sortedProducts.length === 0) {
      setPage(1);
    }
  }, [sortedProducts.length, totalPages, page]);

  return (
    <div className="products-page">
      <div className="products-header">
        <div className="step-badge">1</div>

        <div>
          <h2>Products</h2>
          <p>Add products that can be added to invoices</p>
        </div>
      </div>

      {/* /// search and sort by  */}
      <div className="products-top">
        <h3 className="form-title">PRODUCTS LIST</h3>

        <div className="products-controls">
          <button
            type="button"
            className="add-btn"
            onClick={handleOpenAddModal}
          >
            + Add Product
          </button>

          <input
            type="text"
            className="search-input"
            placeholder="Search by name, price or unit"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <select
            className="sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="default">Default</option>
            <option value="name-asc">Name A-Z</option>
            <option value="name-desc">Name Z-A</option>
            <option value="price-asc">Price Low to High</option>
            <option value="price-desc">Price High to Low</option>
            <option value="unit-asc">Unit A-Z</option>
            <option value="unit-desc">Unit Z-A</option>
          </select>
        </div>
      </div>
      {/* /// */}

      <div className="table-wrapper">
        <table className="products-table">
          <thead>
  <tr>
    <th>#</th>
    <th>Product Name</th>
    <th>Price</th>
    <th>Remaining Quantity</th>
    <th>Actions</th>
  </tr>
</thead>
          <tbody>
            {products.length > 0 ? (
              paginatedProducts.length > 0 ? (
                paginatedProducts.map((item, index) => (
                  <tr key={item.id}>
  <td>{(page - 1) * itemsPerPage + index + 1}</td>
  <td>{item.name}</td>
  <td>Rs. {item.price}</td>
  <td>
    <span className={Number(item.quantity) <= 5 ? "low-stock" : "in-stock"}>
      {item.quantity} {item.unit}
    </span>
  </td>
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
                    No matching products found
                  </td>
                </tr>
              )
            ) : (
              <tr>
                <td colSpan="5" className="no-data">
                  No products added
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {sortedProducts.length > 0 && (
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
            size="md"
          />
        </div>
      )}

      <Modal
        opened={opened}
        onClose={() => {
          resetForm();
          close();
        }}
        title={editId ? "Edit Product" : "Add Product"}
        centered
        size="lg"
        radius="md"
      >
        <form className="product-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Product Name *</label>
            <p>e.g. Rice, Sugar, Cooking Oil</p>
            <input
              type="text"
              name="name"
              placeholder="Enter product name"
              value={formData.name}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>Price (per unit) *</label>
            <p>Price in Rupees</p>
            <input
              type="number"
              name="price"
              placeholder="e.g. 60"
              value={formData.price}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>Unit *</label>
            <p>How is this product measured?</p>
            <select name="unit" value={formData.unit} onChange={handleChange}>
              <option value="kg">kg</option>
              <option value="piece">piece</option>
              <option value="litre">litre</option>
              <option value="dozen">dozen</option>
              <option value="packet">packet</option>
              <option value="box">box</option>
            </select>
          </div>

          <div className="button-group">
            <button type="submit" className="add-btn">
              {editId ? "Update Product" : "+ Add Product"}
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

export default Products;

