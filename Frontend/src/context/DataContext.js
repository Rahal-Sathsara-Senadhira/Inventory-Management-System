// src/context/DataContext.js
import React, { createContext, useState, useEffect } from "react";

export const DataContext = createContext();

export const DataProvider = ({ children }) => {
  const [customers, setCustomers] = useState([]);

  // Load from localStorage initially
  useEffect(() => {
    const storedCustomers = JSON.parse(localStorage.getItem("customers")) || [];
    setCustomers(storedCustomers);
  }, []);

  // Add a customer and save to localStorage
  const addCustomer = (newCustomer) => {
    const updatedCustomers = [newCustomer, ...customers];
    setCustomers(updatedCustomers);
    localStorage.setItem("customers", JSON.stringify(updatedCustomers));
  };

  return (
    <DataContext.Provider value={{ customers, addCustomer }}>
      {children}
    </DataContext.Provider>
  );
};
