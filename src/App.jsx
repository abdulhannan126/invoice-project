import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/layout.jsx";
import Products from "./pages/products/Products.jsx";
import Customers from "./pages/customers/customers.jsx";
import CreateInvoice from "./pages/create-invoice/CreateInvoice.jsx";
import InvoiceHistory from "./pages/invoice-history/InvoiceHistory.jsx";
import TotalSales from "./pages/total-sales/TotalSales.jsx";
import { Inventory } from "./pages/inventory/inventory.jsx";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/products" />} />
        <Route path="products" element={<Products />} />
        <Route path="customers" element={<Customers />} />
        <Route path="create-invoice" element={<CreateInvoice />} />
        <Route path="invoice-history" element={<InvoiceHistory />} />
        <Route path="total-sales" element={<TotalSales />}/>
        <Route path="inventory" element={<Inventory />}/>
      </Route>
    </Routes>
  );
}

export default App;