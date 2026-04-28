import { NavLink, Outlet } from "react-router-dom";
import "./layout.css";

function Layout() {
  return (
    <div className="app-layout">
      <nav className="top-nav">
        <div className="brand-block">
          <div className="brand-logo">IG</div>

          <div className="brand-text">
            <h1>Invoice Studio</h1>
            <p>Harbor Haze billing app</p>
          </div>
        </div>

        <div className="nav-links">
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

           <NavLink
          to="/Total-sales"
          className={({isActive})=>
          isActive ? "nav-link active" : "nav-link"}>
            <span className="nav-icon">logo</span>
            <span className="nav-text">Total Sales</span>
            </NavLink>

            <NavLink
  to="/inventory"
  className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
>
  Inventory
</NavLink>

        </div>
      </nav>

      <div className="page-wrapper">
        <Outlet />
      </div>
    </div>

  );
}

export default Layout;






