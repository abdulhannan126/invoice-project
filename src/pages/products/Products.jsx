import { useEffect, useState } from "react";
import axios from "axios";
import { useDisclosure } from "@mantine/hooks";
import { Modal } from "@mantine/core";
import "./Products.css";

function Products() {
  const [opened, { open, close }] = useDisclosure(false);
  const [products, setProducts] = useState([]);

  const [formData, setFormData] = useState({
    name: "",
    price: "",
    unit: "kg",
  });

  const [editId, setEditId] = useState(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    try {
      const response = await axios.get("http://127.0.0.1:5000/products");
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
        await axios.put(`http://127.0.0.1:5000/products/${editId}`, formData);
      } else {
        await axios.post("http://127.0.0.1:5000/products", formData);
      }

      fetchProducts();
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
      await axios.delete(`http://127.0.0.1:5000/products/${id}`);
      fetchProducts();
    } catch (error) {
      console.error("Delete product error:", error);
      alert(error.response?.data?.error || "Product delete failed");
    }
  }

  return (
    <div className="products-page">
      <div className="products-header">
        <div className="step-badge">1</div>

        <div>
          <h2>Products</h2>
          <p>Add products that can be added to invoices</p>
        </div>
      </div>

      <div className="products-top">
        <h3 className="form-title">PRODUCTS LIST</h3>

        <button
          type="button"
          className="add-btn"
          onClick={handleOpenAddModal}
        >
          + Add Product
        </button>
      </div>

      <div className="table-wrapper">
        <table className="products-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Product</th>
              <th>Price</th>
              <th>Unit</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {products.length > 0 ? (
              products.map((item, index) => (
                <tr key={item.id}>
                  <td>{index + 1}</td>
                  <td>{item.name}</td>
                  <td>Rs. {item.price}</td>
                  <td>{item.unit}</td>
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
                  No products added
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