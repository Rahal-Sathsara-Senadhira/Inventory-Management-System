import React, { useEffect, useState } from "react";
import OverviewTab from "../../components/items/OverviewTab";
import TransactionsTab from "../../components/items/TransactionsTab";
import HistoryTab from "../../components/items/HistoryTab";
import ActionsDropdown from "../../components/items/ActionsDropdown";
import { useNavigate, useParams } from "react-router-dom";

const ItemDetails = () => {
  // Extracting `type` and `id` from URL using useParams
  const { type, id } = useParams();
  const [activeTab, setActiveTab] = useState("overview");
  const [itemData, setItemData] = useState(null); // State to store item data
  const navigate = useNavigate();

  useEffect(() => {
    if (!id) return; // Check if id exists before fetching data

    // Fetch item details based on the id
    const fetchItemDetails = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/items/${id}`);
        const data = await response.json();
        setItemData(data); // Update state with the fetched item data
      } catch (error) {
        console.error("Error fetching item details:", error);
      }
    };

    fetchItemDetails(); // Fetch item details when the component mounts
  }, [id]); // Dependency on `id` so the effect runs when the id changes

  // Function to render content for active tabs
  const renderTabContent = () => {
    switch (activeTab) {
      case "overview":
        return <OverviewTab item={itemData} />;
      case "transactions":
        return <TransactionsTab />;
      case "history":
        return <HistoryTab />;
      default:
        return null;
    }
  };

  if (!itemData) {
    return <div>Loading...</div>; // Loading state when item data is not yet fetched
  }

  // Function to handle "Edit" button click
  const handleEditClick = () => {
    // Redirect to the edit page for this item
    navigate(`/inventory/${type}/items/${id}/edit`);
  };

  return (
    <div className="p-6 space-y-4 bg-white -z-10">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between border-b pb-4">
        <h3 className="text-2xl font-semibold text-gray-800">
          {itemData.name}
        </h3>
        <div className="flex flex-wrap items-center gap-2">
          <button
            className="btn btn-sm bg-gray-100 hover:bg-gray-200 text-sm px-4 py-1.5 rounded"
            onClick={handleEditClick}
          >
            ✏️ Edit
          </button>
          <ActionsDropdown
            itemId={id}
            onDeleted={() => {
              // After delete, go back to the items list for this type
              navigate(`/inventory/${type}/items`);
            }}
          />
        </div>
      </div>

      {/* Subheader */}
      <div className="text-gray-600 font-medium text-sm">{itemData.sku}</div>

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
