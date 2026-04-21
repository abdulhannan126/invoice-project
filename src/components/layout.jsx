import { NavLink, Outlet } from "react-router-dom";
import "./layout.css";

function Layout() {
  return (
    <div className="app-layout">
      <nav className="top-nav">
        <NavLink
          to="/products"
          className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
        >
          Products
        </NavLink>

        <NavLink
          to="/customers"
          className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
        >
          Customers
        </NavLink>

        <NavLink
          to="/create-invoice"
          className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
        >
          Create Invoice
        </NavLink>

        <NavLink
          to="/invoice-history"
          className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
        >
          Invoice History
        </NavLink>
      </nav>

      <div className="page-wrapper">
        <Outlet />
      </div>
    </div>
  );
}

export default Layout;