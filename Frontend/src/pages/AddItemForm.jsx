import React, { useEffect, useMemo, useRef, useState } from "react";

const API_BASE = import.meta.env?.VITE_API_BASE || "";
const MAX_IMG_MB = 5;

const numberOrEmpty = (v) =>
  v === "" || v === null || Number.isNaN(Number(v)) ? "" : String(Number(v));

const debounce = (fn, ms = 300) => {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
};

const initialForm = {
  type: "Goods",
  name: "",
  sku: "",
  unit: "",
  returnable: true,
  dimensions: { length: "", width: "", height: "" },
  weight: "",
  manufacturer: "",
  brand: "",
  upc: "",
  ean: "",
  mpn: "",
  isbn: "",
  image: null,

  // + inventory / pricing bits used by your sales screen
  price: "",
  stock: "",
  taxId: "",
  prices: {}, // priceListId -> number (override)
};

export default function AddItemForm() {
  const [formData, setFormData] = useState(initialForm);
  const [priceLists, setPriceLists] = useState([]); // [{_id, name}]
  const [taxes, setTaxes] = useState([]); // [{_id, name, rate}]
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [skuStatus, setSkuStatus] = useState(null); // null | "checking" | "ok" | "taken"

  // Load dropdown data
  useEffect(() => {
    (async () => {
      try {
        const [plRes, txRes] = await Promise.all([
          fetch(`${API_BASE}/api/price-lists`).catch(() => null),
          fetch(`${API_BASE}/api/taxes`).catch(() => null),
        ]);
        if (plRes?.ok) setPriceLists(await plRes.json());
        if (txRes?.ok) setTaxes(await txRes.json());
      } catch (e) {
        // non-blocking
        console.warn("Aux data load failed", e);
      }
    })();
  }, []);

  // Debounced SKU check
  const checkSkuRef = useRef(
    debounce(async (sku) => {
      if (!sku) {
        setSkuStatus(null);
        return;
      }
      setSkuStatus("checking");
      try {
        const res = await fetch(
          `${API_BASE}/api/items/check-sku?sku=${encodeURIComponent(sku)}`
        );
        if (!res.ok) throw new Error("check failed");
        const data = await res.json(); // {exists: boolean}
        setSkuStatus(data.exists ? "taken" : "ok");
      } catch {
        setSkuStatus(null);
      }
    }, 400)
  );

  useEffect(() => {
    checkSkuRef.current(formData.sku.trim());
  }, [formData.sku]);

  const onBasicChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name.startsWith("dim_")) {
      const key = name.split("_")[1];
      setFormData((p) => ({
        ...p,
        dimensions: { ...p.dimensions, [key]: value },
      }));
      return;
    }
    if (name === "price" || name === "stock" || name === "weight") {
      setFormData((p) => ({ ...p, [name]: value }));
      return;
    }
    if (name === "type") { // Added check for type change
      setFormData((p) => ({
        ...p,
        type: value,
      }));
    } else {
      setFormData((p) => ({
        ...p,
        [name]: type === "checkbox" ? checked : value,
      }));
    }
};


  const onUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_IMG_MB * 1024 * 1024) {
      alert(`Image must be less than ${MAX_IMG_MB}MB`);
      return;
    }
    setFormData((p) => ({ ...p, image: file }));
  };

  const setPriceOverride = (priceListId, val) => {
    setFormData((p) => ({
      ...p,
      prices: {
        ...p.prices,
        [priceListId]: val,
      },
    }));
  };

  const clearPriceOverride = (priceListId) => {
    setFormData((p) => {
      const next = { ...p.prices };
      delete next[priceListId];
      return { ...p, prices: next };
    });
  };

  const visibleIsGoods = formData.type === "Goods";

  const isValid = useMemo(() => {
    if (!formData.name.trim()) return false;
    if (!formData.unit.trim()) return false;
    if (skuStatus === "taken") return false;
    return true;
  }, [formData.name, formData.unit, skuStatus]);

  const uploadToCloudinary = async (file) => {
    const preset = import.meta.env.VITE_CLOUDINARY_PRESET;
    const cloud = import.meta.env.VITE_CLOUDINARY_CLOUD;
    const url = `https://api.cloudinary.com/v1_1/${cloud}/image/upload`;
    const fd = new FormData();
    fd.append("file", file);
    fd.append("upload_preset", preset);

    console.log("Uploading to Cloudinary...");

    const res = await fetch(url, { method: "POST", body: fd });
    const data = await res.json();

    console.log("Cloudinary response:", data);

    if (!res.ok) {
      throw new Error(data?.error?.message || "Cloudinary upload failed");
    }

    return data.secure_url;
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  setError("");
  if (!isValid) {
    setError("Please fix the highlighted fields.");
    return;
  }
  setSaving(true);

  try {
    // Handle image upload if present
    let imageUrl = formData.image ? await uploadToCloudinary(formData.image) : "";

    // Build multipart payload
    const fd = new FormData();

    // Base fields
    fd.append("type", formData.type);
    fd.append("name", formData.name.trim());
    fd.append("sku", formData.sku.trim());
    fd.append("unit", formData.unit.trim());
    fd.append("returnable", String(formData.returnable));
    fd.append("manufacturer", formData.manufacturer.trim());
    fd.append("brand", formData.brand.trim());
    fd.append("upc", formData.upc.trim());
    fd.append("ean", formData.ean.trim());
    fd.append("mpn", formData.mpn.trim());
    fd.append("isbn", formData.isbn.trim());
    if (imageUrl) fd.append("imageUrl", imageUrl); // <-- Ensure imageUrl is passed

    // Numeric-ish fields
    fd.append("price", String(Number(formData.price)));
    fd.append("stock", String(Number(formData.stock)));
    fd.append("weight", String(Number(formData.weight)));

    // Send dimensions as an object, not a string
    fd.append("dimensions", JSON.stringify(formData.dimensions));

    // Tax
    if (formData.taxId) fd.append("taxId", formData.taxId);

    // Price list overrides
    if (formData.prices && Object.keys(formData.prices).length > 0) {
      const cleaned = {};
      for (const [k, v] of Object.entries(formData.prices)) {
        if (v !== "" && !Number.isNaN(Number(v))) cleaned[k] = Number(v);
      }
      fd.append("prices", JSON.stringify(cleaned));
    }

    const res = await fetch(`${API_BASE}/api/items`, {
      method: "POST",
      body: fd,
    });

    if (!res.ok) {
      const msg = await res.text().catch(() => "");
      throw new Error(msg || "Failed to save item");
    }

    alert("Item saved!");
    setFormData(initialForm);
    setSkuStatus(null);
  } catch (e2) {
    console.error(e2);
    setError(e2.message || "Something went wrong");
  } finally {
    setSaving(false);
  }
};



  return (
    <form onSubmit={handleSubmit} className="max-w-5xl mx-auto p-4 space-y-6">
      <h2 className="text-2xl font-bold">New Item</h2>

      {/* Type */}
      <div className="flex items-center gap-6">
        <label className="flex items-center gap-2">
          <input
            type="radio"
            name="type"
            value="Goods"
            checked={formData.type === "Goods"}
            onChange={onBasicChange}
          />
          Goods
        </label>
        <label className="flex items-center gap-2">
          <input
            type="radio"
            name="type"
            value="Service"
            checked={formData.type === "Service"}
            onChange={onBasicChange}
          />
          Service
        </label>
      </div>

      {/* Required core fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <input
            name="name"
            value={formData.name}
            onChange={onBasicChange}
            required
            className="border p-2 rounded w-full"
            placeholder="Name*"
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            name="sku"
            value={formData.sku}
            onChange={onBasicChange}
            className={`border p-2 rounded w-full ${
              skuStatus === "taken" ? "border-red-400" : ""
            }`}
            placeholder="SKU"
          />
          {skuStatus === "checking" && (
            <span className="text-xs text-gray-500">Checking…</span>
          )}
          {skuStatus === "ok" && (
            <span className="text-xs text-green-600">✓ Available</span>
          )}
          {skuStatus === "taken" && (
            <span className="text-xs text-red-600">✕ In use</span>
          )}
        </div>

        <input
          name="unit"
          value={formData.unit}
          onChange={onBasicChange}
          required
          className="border p-2 rounded"
          placeholder="Unit* (e.g. pcs, kg)"
        />
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            name="returnable"
            checked={formData.returnable}
            onChange={onBasicChange}
          />
          Returnable Item
        </label>
      </div>

      {/* Pricing & inventory */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <input
          name="price"
          value={formData.price}
          onChange={onBasicChange}
          className="border p-2 rounded"
          placeholder="Base Price"
          inputMode="decimal"
        />
        <select
          name="taxId"
          value={formData.taxId}
          onChange={onBasicChange}
          className="border p-2 rounded"
        >
          <option value="">Tax (optional)</option>
          {taxes.map((t) => (
            <option key={t._id} value={t._id}>
              {t.name} ({t.rate}%)
            </option>
          ))}
        </select>
        <input
          name="stock"
          value={formData.stock}
          onChange={onBasicChange}
          className="border p-2 rounded"
          placeholder="Opening Stock (optional)"
          inputMode="numeric"
        />
      </div>

      {/* Per‑price‑list overrides */}
      {priceLists.length > 0 && (
        <div className="border rounded p-3">
          <div className="font-medium mb-2">Price List Overrides (optional)</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {priceLists.map((pl) => {
              const val = formData.prices?.[pl._id] ?? "";
              return (
                <div key={pl._id} className="flex items-center gap-2">
                  <label className="min-w-[7rem] text-sm text-gray-700">
                    {pl.name}
                  </label>
                  <input
                    value={val}
                    onChange={(e) => setPriceOverride(pl._id, e.target.value)}
                    placeholder="Override price"
                    className="border p-2 rounded w-full"
                    inputMode="decimal"
                  />
                  {!!val && (
                    <button
                      type="button"
                      onClick={() => clearPriceOverride(pl._id)}
                      className="px-2 py-1 text-xs border rounded"
                      title="Clear"
                    >
                      ✕
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Physical details (hidden for Service) */}
      {visibleIsGoods && (
        <>
          <div className="flex items-center gap-2">
            <input
              name="dim_length"
              value={formData.dimensions.length}
              onChange={onBasicChange}
              className="w-full border p-2 rounded"
              placeholder="Length"
              inputMode="decimal"
            />
            <input
              name="dim_width"
              value={formData.dimensions.width}
              onChange={onBasicChange}
              className="w-full border p-2 rounded"
              placeholder="Width"
              inputMode="decimal"
            />
            <input
              name="dim_height"
              value={formData.dimensions.height}
              onChange={onBasicChange}
              className="w-full border p-2 rounded"
              placeholder="Height"
              inputMode="decimal"
            />
          </div>

          <input
            name="weight"
            value={formData.weight}
            onChange={onBasicChange}
            className="border p-2 rounded w-full"
            placeholder="Weight"
            inputMode="decimal"
          />
        </>
      )}

      {/* Meta */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <input
          name="manufacturer"
          value={formData.manufacturer}
          onChange={onBasicChange}
          className="border p-2 rounded"
          placeholder="Manufacturer"
        />
        <input
          name="brand"
          value={formData.brand}
          onChange={onBasicChange}
          className="border p-2 rounded"
          placeholder="Brand"
        />
        <input
          name="upc"
          value={formData.upc}
          onChange={onBasicChange}
          className="border p-2 rounded"
          placeholder="UPC"
        />
        <input
          name="ean"
          value={formData.ean}
          onChange={onBasicChange}
          className="border p-2 rounded"
          placeholder="EAN"
        />
        <input
          name="mpn"
          value={formData.mpn}
          onChange={onBasicChange}
          className="border p-2 rounded"
          placeholder="MPN"
        />
        <input
          name="isbn"
          value={formData.isbn}
          onChange={onBasicChange}
          className="border p-2 rounded"
          placeholder="ISBN"
        />
      </div>

      {/* Image */}
      <div className="mt-2">
        <label className="block mb-2 font-medium">Upload Image (Max 5MB):</label>
        <input type="file" accept="image/*" onChange={onUpload} />
        {formData.image && (
          <div className="mt-2">
            <img
              src={URL.createObjectURL(formData.image)}
              alt="Preview"
              className="max-h-32 rounded border"
            />
          </div>
        )}
      </div>

      {/* Errors */}
      {error && (
        <div className="text-sm text-red-600 border border-red-200 bg-red-50 px-3 py-2 rounded">
          {error}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-4 mt-4">
        <button
          type="submit"
          disabled={saving || !isValid}
          className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save"}
        </button>
        <button
          type="button"
          onClick={() => {
            setFormData(initialForm);
            setSkuStatus(null);
            setError("");
          }}
          className="px-6 py-2 bg-gray-300 rounded"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
