import { createContext, useMemo, useState, useEffect, useCallback } from "react";
import { apiGet, apiPost } from "../services/api";
// fallback seed for first load (only used if API empty/offline)
import { customers as seedCustomers, items as seedItems, orders as seedOrders } from "../assets/assets";

export const AppContext = createContext(null);

const AppContextProvider = ({ children }) => {
  const [customers, setCustomers] = useState(seedCustomers);
  const [items, setItems] = useState(seedItems);
  const [orders, setOrders] = useState(seedOrders);
  const [loading, setLoading] = useState(true);

  // initial sync from API
  useEffect(() => {
    (async () => {
      try {
        const list = await apiGet("/api/customers");
        if (Array.isArray(list) && list.length) setCustomers(list);
      } catch (e) {
        console.warn("API offline? Using seed data.", e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // create via API (server validates, dedupes, assigns ids)
  const addCustomer = useCallback(async (payload) => {
    const created = await apiPost("/api/customers", payload);
    setCustomers(prev => [...prev, created]); // table updates instantly
    return created;
  }, []);

  const value = useMemo(() => ({
    customers, items, orders, addCustomer, loading
  }), [customers, items, orders, addCustomer, loading]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export default AppContextProvider;
