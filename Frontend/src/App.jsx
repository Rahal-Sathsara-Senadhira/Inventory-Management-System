import React from "react";
import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import DashboardLayout from "./layouts/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import InventoryItemGroups from "./pages/InventoryItemGroups";
import AddItemForm from "./pages/AddItemForm";
import InventorySalesCustomers from "./pages/Sales/InventorySalesCustomers";
import AddCustomerForm from "./pages/Sales/AddCustomerForm";
import ItemDetails from "./pages/Items/ItemDetails";
import InventoryItemsDashboard from "./pages/Items/InventoryItemsDashboard";

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
        <Route path="itemGroups" element={<InventoryItemGroups />} />
        <Route path="items/add-items" element={<AddItemForm />} />
        <Route path="customers" element={<InventorySalesCustomers />} />
        <Route path="customers/add-customers" element={<AddCustomerForm />} />
        <Route path="/inventory/:type/items/:id" element={<ItemDetails />} />

        {/* Add more child routes here */}
      </Route>
    </Routes>
  );
};

export default App;
