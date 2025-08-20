import { FaArrowLeft, FaTimes } from "react-icons/fa";
import { useNavigate, useParams } from "react-router-dom";
import { useState } from "react";
import OverviewTab from "../../components/customers/OverviewTab";
import CommentsTab from "../../components/customers/CommentsTab";
import StatementsTab from "../../components/customers/StatementsTab";
import TransactionsTab from "../../components/customers/TransactionsTab";
import MailsTab from "../../components/customers/MailsTab";
import useCustomerData from "../../hooks/useCustomerData";

const CustomerDetails = () => {
  const navigate = useNavigate();
  const { cus_id } = useParams();
  const [activeTab, setActiveTab] = useState("overview");

  const { loading, error, customer, finance, orders } = useCustomerData(cus_id);

  const displayName =
    customer?.name ||
    [customer?.salutation, customer?.firstName, customer?.lastName]
      .filter(Boolean)
      .join(" ") ||
    customer?.company_name ||
    "—";

  const renderTabContent = () => {
    switch (activeTab) {
      case "overview":
        return (
          <OverviewTab
            customer={customer}
            finance={finance}
            loading={loading}
            error={error}
          />
        );
      case "Comments":
        return <CommentsTab customerId={customer?._id} />;
      case "Statements":
        return <StatementsTab customerId={customer?._id} />;
      case "transactions":
        // 🔽 pass orders so "Bills" can render rows
        return <TransactionsTab customerId={customer?._id} orders={orders} />;
      case "Mails":
        return <MailsTab customerId={customer?._id} />;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col w-full bg-white rounded shadow space-y-4">
      {/* Header */}
      <div className="sticky top-0 bg-white pt-3 px-4">
        <div className="text-xs text-gray-500">Customer ID: {cus_id}</div>

        <div className="flex items-center justify-between border-b pb-2">
          <div className="flex items-center space-x-2">
            <button className="btn btn-secondary p-2" onClick={() => navigate(-1)}>
              <FaArrowLeft className="w-4 h-4" />
            </button>
            <h3 className="text-xl font-semibold truncate">
              {loading ? "Loading..." : error ? "Error loading customer" : displayName}
            </h3>
          </div>

          <div className="flex items-center space-x-2">
            <button className="btn btn-secondary">Mark as Active</button>
            <button className="btn btn-secondary">Delete</button>
            <button
              className="text-gray-600 hover:text-red-500"
              onClick={() => navigate(-1)}
              title="Close"
            >
              <FaTimes className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <ul className="flex space-x-6 text-sm font-medium text-gray-600">
            {["overview", "Comments", "transactions", "Mails", "Statements"].map((tab) => (
              <li
                key={tab}
                className={`cursor-pointer py-2 border-b-2 ${
                  activeTab === tab ? "border-blue-500 text-blue-600" : "border-transparent"
                }`}
                onClick={() => setActiveTab(tab)}
              >
                {tab[0].toUpperCase() + tab.slice(1)}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-white shadow rounded-lg">{renderTabContent()}</div>
    </div>
  );
};

export default CustomerDetails;
