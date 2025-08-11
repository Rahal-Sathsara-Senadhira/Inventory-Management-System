import React from "react";
import { Link, useParams } from "react-router-dom";

const SalesOrders = () => {
  const { type } = useParams();           // expects a route like /inventory/:type/salesOrders
  const base = type ?? "sales";           // fallback if missing

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Sales Orders</h1>
        <Link to={`/inventory/${base}/salesOrders/add-salesOrders`}>
          <button className="rounded-md bg-blue-600 px-4 py-2 font-medium text-white shadow hover:bg-blue-700">
            + New
          </button>
        </Link>
      </div>
    </div>
  );
};

export default SalesOrders;
