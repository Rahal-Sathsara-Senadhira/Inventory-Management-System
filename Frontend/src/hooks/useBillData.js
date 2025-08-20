import { useEffect, useState } from "react";

const API_BASE = import.meta.env?.VITE_API_BASE || "";

export default function useBillData(billId) {
  const [loading, setLoading] = useState(true);
  const [bill, setBill] = useState(null);
  const [vendor, setVendor] = useState(null);
  const [org, setOrg] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let kill = false;
    (async () => {
      try {
        setLoading(true);
        // 1) Bill (with populated items/taxes if your API supports it)
        const res = await fetch(`${API_BASE}/api/bills/${billId}`);
        if (!res.ok) throw new Error("Failed to load bill");
        const b = await res.json();
        if (kill) return;
        setBill(b);

        // 2) Vendor (AP “Bill From”)
        if (b?.vendorId) {
          const vr = await fetch(`${API_BASE}/api/vendors/${b.vendorId}`);
          setVendor(vr.ok ? await vr.json() : null);
        }

        // 3) Your org profile (address/logo/currency)
        const or = await fetch(`${API_BASE}/api/org/profile`);
        setOrg(or.ok ? await or.json() : null);

        setError("");
      } catch (e) {
        if (!kill) setError(e.message || "Error");
      } finally {
        if (!kill) setLoading(false);
      }
    })();
    return () => { kill = true; };
  }, [billId]);

  return { loading, error, bill, vendor, org };
}
