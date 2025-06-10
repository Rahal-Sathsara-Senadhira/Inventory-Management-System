import { FaArrowLeft, FaRegSquare, FaTimes } from "react-icons/fa";
import {
  FaRegEnvelope,
  FaCommentAlt,
  FaFileInvoiceDollar,
  FaListAlt,
} from "react-icons/fa";
import { useNavigate, useParams } from "react-router-dom";
import OverviewTab from "../../components/customers/OverviewTab";
import { useState } from "react";
import CommentsTab from "../../components/customers/CommentsTab";
import StatementsTab from "../../components/customers/StatementsTab";
import TransactionsTab from "../../components/customers/TransactionsTab";
import MailsTab from "../../components/customers/MailsTab";

const CustomerDetails = () => {
  const navigate = useNavigate();
  const { cus_id } = useParams();

  const [activeTab, setActiveTab] = useState("overview");

  const renderTabContent = () => {
    switch (activeTab) {
      case "overview":
        return <OverviewTab />;
      case "Comments":
        return <CommentsTab />;
      case "Statements":
        return <StatementsTab />;
      case "transactions":
        return <TransactionsTab />;
      case "Mails":
        return <MailsTab />;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col w-full bg-white rounded shadow space-y-4">
      {/* Header Actions */}
      <div className="sticky top-0 bg-white pt-3  px-4">
        <div className="">{cus_id}</div>
        <div className="flex items-center justify-between border-b pb-2">
          <div className="flex items-center space-x-2">
            <button
              className="btn btn-secondary p-2"
              onClick={() => navigate(-1)}
            >
              <FaArrowLeft className="w-4 h-4" />
            </button>
            {/* <FaRegSquare className="w-6 h-6 text-gray-600" /> */}
            <h3 className="text-xl font-semibold truncate">Eva Reilly MD</h3>
          </div>

          <div className="flex items-center space-x-2">
            <button className="btn btn-secondary">Mark as Active</button>
            <button className="btn btn-secondary">Delete</button>
            <button className="text-gray-600 hover:text-red-500" onClick={() => navigate(-1)}>
              <FaTimes className="w-5 h-5" />
            </button>
          </div>
        </div>

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
                activeTab === "Comments"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent"
              }`}
              onClick={() => setActiveTab("Comments")}
            >
              Comments
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
                activeTab === "Mails"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent"
              }`}
              onClick={() => setActiveTab("Mails")}
            >
              Mails
            </li>
            <li
              className={`cursor-pointer py-2 border-b-2 ${
                activeTab === "Statements"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent"
              }`}
              onClick={() => setActiveTab("Statements")}
            >
              Statements
            </li>
          </ul>
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-white shadow rounded-lg">{renderTabContent()}</div>

      {/* Details */}
    </div>
  );
};

export default CustomerDetails;
