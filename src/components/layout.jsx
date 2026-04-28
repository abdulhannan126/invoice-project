import { NavLink, Outlet } from "react-router-dom";
import "./layout.css";

function Layout() {
  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-icon">⚡</div>
          <div className="brand-text">
            <span className="brand-name">InvoiceFlow</span>
            <span className="brand-tagline">Business Suite</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <span className="nav-section-label">WORKSPACE</span>

          <NavLink
            to="/products"
            className={({ isActive }) =>
              isActive ? "nav-link active" : "nav-link"
            }
          >
            <span className="nav-icon">📦</span>
            <span className="nav-text">Products</span>
          </NavLink>

          <NavLink
            to="/inventory"
            className={({ isActive }) =>
              isActive ? "nav-link active" : "nav-link"
            }
          >
            📈 Inventory
          </NavLink>

          <NavLink
            to="/customers"
            className={({ isActive }) =>
              isActive ? "nav-link active" : "nav-link"
            }
          >
            <span className="nav-icon">👥</span>
            <span className="nav-text">Customers</span>
          </NavLink>

          <span className="nav-section-label">BILLING</span>

          <NavLink
            to="/create-invoice"
            className={({ isActive }) =>
              isActive ? "nav-link active" : "nav-link"
            }
          >
            <span className="nav-icon">✏️</span>
            <span className="nav-text">Create Invoice</span>
          </NavLink>

          <NavLink
            to="/invoice-history"
            className={({ isActive }) =>
              isActive ? "nav-link active" : "nav-link"
            }
          >
            <span className="nav-icon">📋</span>
            <span className="nav-text">History</span>
          </NavLink>

          <span className="nav-section-label">Features</span>

          <NavLink
            to="/total-sales"
            className={({ isActive }) =>
              isActive ? "nav-link active" : "nav-link"
            }
          >
            <span className="nav-icon">📊</span>
            <span className="nav-text">Total Sales</span>
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-footer-badge">v1.0</div>
        </div>
      </aside>

      <main className="page-wrapper">
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;
