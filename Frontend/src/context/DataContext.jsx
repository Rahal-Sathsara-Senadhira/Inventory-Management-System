// src/context/DataContext.jsx
import React, { createContext, useEffect, useState } from "react";

export const DataContext = createContext();

export const DataProvider = ({ children }) => {
  const [customers, setCustomers] = useState([]);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("customers") || "[]");
    setCustomers(stored);
  }, []);

  const addCustomer = (newCustomer) => {
    const updated = [newCustomer, ...customers];
    setCustomers(updated);
    localStorage.setItem("customers", JSON.stringify(updated));
  };

  return (
    <DataContext.Provider value={{ customers, addCustomer }}>
      {children}
    </DataContext.Provider>
  );
};
