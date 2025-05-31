import React from "react";
import { Button } from "../components/ui/button";
import { assets } from "../assets/assets";

const InventoryItemGroups = () => {
  const cardData = [
    {
      title: "Item groups",
      description:
        "Create multiple variants of the same item using Item Groups",
      buttonText: "New Item Group",
      icon: (
        <svg
          className="w-20 h-20 text-blue-500"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path d="M3 7h18M3 12h18M3 17h18M7 3v18" />
        </svg>
      ),
    },
    {
      title: "Items",
      description: "Create standalone items and services that you buy and sell",
      buttonText: "New Item",
      icon: (
        <svg
          className="w-20 h-20 text-green-500"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <rect x="4" y="4" width="16" height="16" rx="2" />
          <path d="M4 9h16" />
        </svg>
      ),
    },
    {
      title: "Composite Items",
      description: "Bundle different items together and sell them as kits",
      buttonText: "New Composite Item",
      icon: (
        <svg
          className="w-20 h-20 text-purple-500"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <circle cx="12" cy="12" r="4" />
          <path d="M4 4l4 4M20 4l-4 4M4 20l4-4M20 20l-4-4" />
        </svg>
      ),
    },
    {
      title: "Price Lists",
      description:
        "Tweak your item prices for specific contacts or transactions",
      buttonText: "New Price List",
      icon: (
        <svg
          className="w-20 h-20 text-yellow-500"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path d="M3 6h18M3 12h18M3 18h18" />
          <path d="M8 6v12" />
        </svg>
      ),
    },
  ];

  return (
    <div className="">
      <div
        className="flex items-center justify-between bg-cover bg-center mb-6"
        style={{ backgroundImage: `url(${assets.ItemGroupBanner})` }}
      >
        <h1 className="text-xl font-bold p-6  text-white rounded-md ">
          Item Groups
        </h1>
        <Button className="flex items-center gap-2 mx-6">
          <span className="text-xl">+</span>
          New
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 px-6">
        {cardData.map((card, idx) => (
          <div
            key={idx}
            className="border rounded-lg p-6 flex flex-col items-center shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="mb-4">{card.icon}</div>
            <h2 className="text-lg font-semibold mb-2">{card.title}</h2>
            <p className="text-center text-sm text-gray-600 mb-4">
              {card.description}
            </p>
            <Button>{card.buttonText}</Button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default InventoryItemGroups;
