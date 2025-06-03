import React, { useState } from "react";
import OverviewTab from "../../components/items/OverviewTab";
import TransactionsTab from "../../components/items/TransactionsTab";
import HistoryTab from "../../components/items/HistoryTab";
import ActionsDropdown from "../../components/items/ActionsDropdown";

const ItemDetails = () => {
  const [activeTab, setActiveTab] = useState("overview");

  const renderTabContent = () => {
    switch (activeTab) {
      case "overview":
        return <OverviewTab />;
      case "transactions":
        return <TransactionsTab/>;
      case "history":
        return <HistoryTab/>;
      default:
        return null;
    }
  };

  return (
    <div className="p-6 space-y-4 bg-white -z-10">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between border-b pb-4">
        <h3 className="text-2xl font-semibold text-gray-800">Coffee Table</h3>
        <div className="flex flex-wrap items-center gap-2">
          <button className="btn btn-sm bg-gray-100 hover:bg-gray-200 text-sm px-4 py-1.5 rounded">
            ✏️ Edit
          </button>
            <ActionsDropdown />
          
        </div>
      </div>

      {/* Subheader */}
      <div className="text-gray-600 font-medium text-sm">Item 1 SKU</div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <ul className="flex space-x-6 text-sm font-medium text-gray-600">
          <li
            className={`cursor-pointer py-2 border-b-2 ${
              activeTab === "overview"
                ? "border-blue-500 text-blue-600"
                : "border-transparent"
            }`}
            onClick={() => setActiveTab("overview")}
          >
            Overview
          </li>
          <li
            className={`cursor-pointer py-2 border-b-2 ${
              activeTab === "transactions"
                ? "border-blue-500 text-blue-600"
                : "border-transparent"
            }`}
            onClick={() => setActiveTab("transactions")}
          >
            Transactions
          </li>
          <li
            className={`cursor-pointer py-2 border-b-2 ${
              activeTab === "history"
                ? "border-blue-500 text-blue-600"
                : "border-transparent"
            }`}
            onClick={() => setActiveTab("history")}
          >
            History
          </li>
        </ul>
      </div>

      {/* Tab Content */}
      <div className="bg-white shadow rounded-lg">{renderTabContent()}</div>
    </div>
  );
};

export default ItemDetails;
