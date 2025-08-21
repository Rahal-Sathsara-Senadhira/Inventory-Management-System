// src/App.jsx
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
import EditItemForm from "./pages/Items/EditItemForm.jsx";
import ViewSalesOrder from "./pages/Sales/ViewSalesOrder.jsx";
import Packages from "./pages/Orders/Packages.jsx";
import DeliveredPackages from "./pages/Orders/DeliveredPackages.jsx";
import BillDetails from "./pages/bills/BillDetails.jsx";

import AuthProvider from "./context/AuthContext.jsx";
import PrivateRoute from "./components/PrivateRoute.jsx";
import Employees from "./pages/Users&Roles/Employees.jsx";
import TimeKeeping from "./pages/Users&Roles/TimeKeeping.jsx";
import WorkedHours from "./pages/Users&Roles/WorkedHours.jsx";
import Roles from "./pages/Users&Roles/Roles.jsx";

const App = () => {
  return (
    <AuthProvider>
      <Routes>
        {/* Public Pages */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />

        {/* Protected Area (guard + your layout) */}
        <Route element={<PrivateRoute />}>
          <Route path="/inventory/:type" element={<DashboardLayout />}>
            {/* 👇 all child paths are RELATIVE now */}
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="items" element={<InventoryItemsDashboard />} />
            <Route path="items/add-items" element={<AddItemForm />} />
            <Route path="items/:id" element={<ItemDetails />} />
            <Route path="items/:id/edit" element={<EditItemForm />} />

            <Route path="salesOrders" element={<SalesOrders />} />
            <Route path="salesOrders/add-salesOrders" element={<AddSalesOrders />} />
            <Route path="salesOrders/:id" element={<ViewSalesOrder />} />

            <Route path="customers" element={<InventorySalesCustomers />} />
            <Route path="customers/add-customers" element={<AddCustomerForm />} />
            <Route path="customers/:cus_id" element={<CustomerDetails />} />

            <Route path="itemGroups" element={<InventoryItemGroups />} />
            <Route path="packages" element={<Packages />} />
            <Route path="delivered-packages" element={<DeliveredPackages />} />

            <Route path="employees" element={<Employees />} />
            <Route path="time-keeping" element={<TimeKeeping />} />
            <Route path="worked-hours" element={<WorkedHours />} />
            <Route path="roles" element={<Roles />} />

            {/* Bills nested under /inventory/:type */}
            <Route path="bills/:billId" element={<BillDetails />} />
          </Route>
        </Route>

        {/* If you want bills at root instead, move it out and use absolute path: */}
        {/* <Route path="/bills/:billId" element={<BillDetails />} /> */}
      </Routes>
    </AuthProvider>
  );
};

export default App;
