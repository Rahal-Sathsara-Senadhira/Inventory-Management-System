import React from "react";
import { assets } from "../assets/assets";
import {
  FaBoxOpen,
  FaShoppingCart,
  FaUsers,
  FaWarehouse,
  FaChartLine,
  FaDollarSign,
  FaTruckMoving,
  FaExclamationTriangle,
  FaUserPlus,

  FaBoxes,             // Packed Items
  FaShippingFast,      // To Be Shipped
  FaTruckLoading,      // To Be Delivered
  FaFileInvoiceDollar, // To Be Invoiced
  FaChartBar,          // Inventory Summary
  FaTags,              // Product Details
  FaStar,              // Top Selling Items
  FaChartPie,          // Sales Report
  FaHandshake,         // Sales
} from "react-icons/fa";

const Dashboard = () => {
  return (
    <div>
      {/* Dashboard Header */}
      <div>
        <h1
          className="text-xl font-bold p-6 bg-cover bg-center text-white rounded-md mb-6"
          style={{ backgroundImage: `url(${assets.DashboardBanner})` }}
        >
          Dashboard Overview
        </h1>
      </div>

      {/* Cards Layout */}
      <div className="flex gap-4 flex-wrap content-start px-6 pb-6">
        {/* Card 1 */}
        <div className="bg-white p-4 rounded-xl shadow-md border min-w-52 grow w-auto xl:min-w-32">
          <FaBoxOpen className="text-3xl text-blue-600 mb-2" />
          <h2 className="font-semibold text-lg">To Be Packed</h2>
          <p className="text-sm text-gray-600">1,250 items in inventory</p>
        </div>

        {/* Card 2 */}
        <div className="bg-white p-4 rounded-xl shadow-md border min-w-52 grow w-auto xl:min-w-32">
          <FaShippingFast className="text-3xl text-green-500 mb-2" />
          <h2 className="font-semibold text-lg">To Be Shipped</h2>
          <p className="text-sm text-gray-600">74 new orders</p>
        </div>

        {/* Card 3 */}
        <div className="bg-white p-4 rounded-xl shadow-md border min-w-52 grow w-auto xl:min-w-32">
          <FaTruckLoading className="text-3xl text-purple-500 mb-2" />
          <h2 className="font-semibold text-lg">To Be Delivered</h2>
          <p className="text-sm text-gray-600">980 active users</p>
        </div>

        {/* Card 4 */}
        <div className="bg-white p-4 rounded-xl shadow-md border min-w-52 grow w-auto xl:min-w-32">
          <FaFileInvoiceDollar className="text-3xl text-yellow-600 mb-2" />
          <h2 className="font-semibold text-lg">To Be Invoiced</h2>
          <p className="text-sm text-gray-600">4 storage locations</p>
        </div>

        {/* Card 5 */}
        <div className="bg-white p-4 rounded-xl shadow-md border grow min-w-[20rem]">
          <FaChartBar className="text-3xl text-indigo-500 mb-2" />
          <h2 className="font-semibold text-lg">Inventory Summary</h2>
          <p className="text-sm text-gray-600">📈 Up 12% this week</p>
        </div>

        {/* Card 6 */}
        <div className="bg-white p-4 rounded-xl shadow-md border w-[48%]">
          <FaTags className="text-3xl text-emerald-600 mb-2" />
          <h2 className="font-semibold text-lg">Product Details</h2>
          <p className="text-sm text-gray-600">$32,450 generated</p>
        </div>

        {/* Card 7 */}
        <div className="bg-white p-4 rounded-xl shadow-md border w-[49%] grow">
          <FaStar className="text-3xl text-red-500 mb-2" />
          <h2 className="font-semibold text-lg">Top Selling Items</h2>
          <p className="text-sm text-gray-600">36 orders in queue</p>
        </div>

        {/* Card 8 */}
        <div className="bg-white p-4 rounded-xl shadow-md border w-[30%] min-w-[180px]">
          <FaChartPie className="text-3xl text-orange-500 mb-2" />
          <h2 className="font-semibold text-lg">Sales Report</h2>
          <p className="text-sm text-gray-600">19 critical items</p>
        </div>

        {/* Card 9 */}
        <div className="bg-white p-4 rounded-xl shadow-md border grow min-w-[200px]">
          <FaHandshake className="text-3xl text-cyan-600 mb-2" />
          <h2 className="font-semibold text-lg">Sales</h2>
          <p className="text-sm text-gray-600">25 users joined this week</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
