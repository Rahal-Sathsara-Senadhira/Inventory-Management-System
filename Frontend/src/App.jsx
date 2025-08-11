import React from "react";
import { Routes, Route } from "react-router-dom";
import Home from "./pages/website/Home/Home.jsx";
import Login from "./pages/Login";
import DashboardLayout from "./layouts/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import InventoryItemGroups from "./pages/InventoryItemGroups";
import AddItemForm from "./pages/AddItemForm";
import InventorySalesCustomers from "./pages/Sales/InventorySalesCustomers";
import AddCustomerForm from "./pages/Sales/AddCustomerForm";
import ItemDetails from "./pages/Items/ItemDetails";
import InventoryItemsDashboard from "./pages/Items/InventoryItemsDashboard";
import CustomerDetails from "./pages/Sales/CustomerDetails.jsx";
import SalesOrders from "./pages/Sales/SalesOrders.jsx";
import AddSalesOrders from "./pages/Sales/AddSalesOrders.jsx";

const App = () => {
  return (
    <Routes>
      {/* Public Pages */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />

      {/* Protected Area (Layout with Sidebar) */}
      <Route path="/inventory/:type" element={<DashboardLayout />}>
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="items" element={<InventoryItemsDashboard />} />
        <Route path="salesOrders" element={<SalesOrders />} />
        <Route path="salesOrders/add-salesOrders" element={<AddSalesOrders />} />
        <Route path="itemGroups" element={<InventoryItemGroups />} />
        <Route path="items/add-items" element={<AddItemForm />} />
        <Route path="customers" element={<InventorySalesCustomers />} />
        <Route path="customers/add-customers" element={<AddCustomerForm />} />
        <Route path="/inventory/:type/items/:id" element={<ItemDetails />} />
        <Route path="/inventory/:type/customers/:cus_id" element={<CustomerDetails />} />

        {/* Add more child routes here */}
      </Route>
    </Routes>
  );
};

export default App;
