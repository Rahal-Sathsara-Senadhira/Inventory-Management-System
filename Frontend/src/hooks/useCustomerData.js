import { useEffect, useMemo, useState } from "react";

const API_BASE = import.meta.env?.VITE_API_BASE || "";

export default function useCustomerData(cus_id) {
  const [loading, setLoading] = useState(true);
  const [customer, setCustomer] = useState(null);
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;

    async function run() {
      try {
        setLoading(true);
        setError("");

        const tenantId = localStorage.getItem("tenantId") || "default";

        // 1) customer by business cus_id
        const cRes = await fetch(
          `${API_BASE}/api/customer-lookup/${encodeURIComponent(cus_id)}`,
          {
            headers: {
              "Content-Type": "application/json",
              "x-tenant-id": tenantId,
            },
            credentials: "include",
          }
        );
        if (!cRes.ok) throw new Error(`Customer fetch failed (${cRes.status})`);
        const cJson = await cRes.json();
        if (!alive) return;
        setCustomer(cJson);

        // 2) related sales orders by _id
        if (cJson?._id) {
          const soRes = await fetch(
            `${API_BASE}/api/sales-orders?customerId=${encodeURIComponent(cJson._id)}`,
            {
              headers: { "x-tenant-id": tenantId },
              credentials: "include",
            }
          );
          if (soRes.ok) {
            const soJson = await soRes.json();
            if (alive) setOrders(Array.isArray(soJson) ? soJson : (soJson?.data ?? []));
          } else if (soRes.status !== 404) {
            throw new Error(`Sales orders fetch failed (${soRes.status})`);
          }
        }
      } catch (e) {
        if (alive) setError(e.message || "Failed to load");
      } finally {
        if (alive) setLoading(false);
      }
    }

    run();
    return () => { alive = false; };
  }, [cus_id]);

  const finance = useMemo(() => {
    const totals = orders.reduce((acc, o) => {
      const cur = o?.totals?.currency || "USD";
      const grand = Number(o?.totals?.grandTotal || 0);
      const paid = Number(o?.amountPaid || 0);
      const due = Math.max(grand - paid, 0);
      if (!acc[cur]) acc[cur] = { receivables: 0 };
      acc[cur].receivables += due;
      return acc;
    }, {});
    return { byCurrency: totals };
  }, [orders]);

  return { loading, error, customer, orders, finance };
}
