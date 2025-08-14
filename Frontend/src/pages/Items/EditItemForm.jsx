import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";

const API_BASE = import.meta.env?.VITE_API_BASE || "";

const debounce = (fn, ms = 350) => {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
};

const EditItemForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [itemData, setItemData] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [skuStatus, setSkuStatus] = useState(null); // null | "checking" | "ok" | "taken"

  // Load item
  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/items/${id}`);
        if (!res.ok) throw new Error(`Failed to load item (${res.status})`);
        const data = await res.json();
        if (!ignore) {
          // Ensure dims object exists for controlled inputs
          const dims = data.dimensions || { length: "", width: "", height: "" };
          setItemData({ ...data, dimensions: dims });
        }
      } catch (e) {
        if (!ignore) setError(e.message || "Failed to load item");
      }
    })();
    return () => {
      ignore = true;
    };
  }, [id]);

  // Debounced SKU check with excludeId (so current SKU is allowed)
  const debouncedCheckRef = useRef(
    debounce(async (sku, excludeId) => {
      if (!sku) {
        setSkuStatus(null);
        return;
      }
      setSkuStatus("checking");
      try {
        const res = await fetch(
          `${API_BASE}/api/items/check-sku?sku=${encodeURIComponent(
            sku
          )}&excludeId=${encodeURIComponent(excludeId)}`
        );
        if (!res.ok) throw new Error("check failed");
        const data = await res.json(); // {exists:boolean}
        setSkuStatus(data.exists ? "taken" : "ok");
      } catch {
        setSkuStatus(null);
      }
    }, 400)
  );

  useEffect(() => {
    if (!itemData) return;
    const sku = (itemData.sku || "").trim();
    debouncedCheckRef.current(sku, id);
  }, [itemData?.sku, id, debouncedCheckRef]);

  // Handle changes (flat & nested dimensions)
  const handleChange = (e) => {
    const { name, value } = e.target;
    setItemData((prev) => {
      if (!prev) return prev;
      if (name === "length" || name === "width" || name === "height") {
        return { ...prev, dimensions: { ...prev.dimensions, [name]: value } };
      }
      return { ...prev, [name]: value };
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0] || null;
    setImageFile(file);
  };

  // Cloudinary upload (unsigned)
  const uploadToCloudinary = async (file) => {
    const preset = import.meta.env.VITE_CLOUDINARY_PRESET;
    const cloud = import.meta.env.VITE_CLOUDINARY_CLOUD;
    if (!preset || !cloud) {
      throw new Error("Missing Cloudinary env: VITE_CLOUDINARY_PRESET/CLOUD");
    }
    const url = `https://api.cloudinary.com/v1_1/${cloud}/image/upload`;
    const fd = new FormData();
    fd.append("file", file);
    fd.append("upload_preset", preset);
    const res = await fetch(url, { method: "POST", body: fd });
    const data = await res.json();
    if (!res.ok) {
      const msg = data?.error?.message || "Cloudinary upload failed";
      throw new Error(msg);
    }
    return data.secure_url;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!itemData) return;
    setSaving(true);
    setError("");

    try {
      // If SKU is taken, block save
      if (skuStatus === "taken") {
        throw new Error("SKU already in use");
      }

      // Upload new image if provided
      let imageUrl = itemData.imageUrl || "";
      if (imageFile) {
        imageUrl = await uploadToCloudinary(imageFile);
      }

      // Build JSON patch
      const patch = {
        type: itemData.type,
        name: itemData.name,
        sku: (itemData.sku || "").trim(),
        unit: itemData.unit,
        returnable:
          itemData.returnable === true || itemData.returnable === "true",
        price:
          itemData.price !== "" && itemData.price !== undefined
            ? Number(itemData.price)
            : 0,
        stock:
          itemData.stock !== "" && itemData.stock !== undefined
            ? Number(itemData.stock)
            : 0,
        weight:
          itemData.weight !== "" && itemData.weight !== undefined
            ? Number(itemData.weight)
            : 0,
        manufacturer: itemData.manufacturer || "",
        brand: itemData.brand || "",
        upc: itemData.upc || "",
        ean: itemData.ean || "",
        mpn: itemData.mpn || "",
        isbn: itemData.isbn || "",
        // keep existing prices structure as-is if present
        prices:
          itemData.prices && typeof itemData.prices === "object"
            ? itemData.prices
            : {},
        dimensions: {
          length: itemData.dimensions?.length || "",
          width: itemData.dimensions?.width || "",
          height: itemData.dimensions?.height || "",
        },
        imageUrl,
      };

      const res = await fetch(`${API_BASE}/api/items/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });

      if (!res.ok) {
        const msg = await res.text().catch(() => "");
        throw new Error(msg || "Failed to update item");
      }

      alert("Item updated successfully");
      navigate(`/inventory/${itemData.type}/items/${id}`);
    } catch (e2) {
      console.error("Error updating item:", e2);
      setError(e2.message || "Error updating item");
    } finally {
      setSaving(false);
    }
  };

  if (error)
    return <div className="p-6 text-red-600">{error}</div>;
  if (!itemData) return <div>Loading...</div>;

  return (
    <div className="p-6 space-y-4 bg-white">
      <h3 className="text-2xl font-semibold text-gray-800">Edit Item</h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Item Name */}
        <div>
          <label className="block font-medium text-gray-700">Name</label>
          <input
            type="text"
            name="name"
            value={itemData.name || ""}
            onChange={handleChange}
            className="border p-2 rounded w-full"
            required
          />
        </div>

        {/* SKU (with availability hint) */}
        <div>
          <label className="block font-medium text-gray-700">SKU</label>
          <input
            type="text"
            name="sku"
            value={itemData.sku || ""}
            onChange={handleChange}
            className="border p-2 rounded w-full"
            required
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

        {/* Price */}
        <div>
          <label className="block font-medium text-gray-700">Price</label>
          <input
            type="number"
            name="price"
            value={itemData.price ?? 0}
            onChange={handleChange}
            className="border p-2 rounded w-full"
            required
          />
        </div>

        {/* Dimensions */}
        <div className="flex space-x-4">
          <div>
            <label className="block font-medium text-gray-700">Length</label>
            <input
              type="text"
              name="length"
              value={itemData.dimensions?.length || ""}
              onChange={handleChange}
              className="border p-2 rounded w-full"
            />
          </div>
          <div>
            <label className="block font-medium text-gray-700">Width</label>
            <input
              type="text"
              name="width"
              value={itemData.dimensions?.width || ""}
              onChange={handleChange}
              className="border p-2 rounded w-full"
            />
          </div>
          <div>
            <label className="block font-medium text-gray-700">Height</label>
            <input
              type="text"
              name="height"
              value={itemData.dimensions?.height || ""}
              onChange={handleChange}
              className="border p-2 rounded w-full"
            />
          </div>
        </div>

        {/* Weight */}
        <div>
          <label className="block font-medium text-gray-700">Weight</label>
          <input
            type="number"
            name="weight"
            value={itemData.weight ?? 0}
            onChange={handleChange}
            className="border p-2 rounded w-full"
          />
        </div>

        {/* Image Upload */}
        <div>
          <label className="block font-medium text-gray-700">Image</label>
          <input
            type="file"
            onChange={handleImageChange}
            className="border p-2 rounded w-full"
            accept="image/*"
          />
        </div>

        {/* Submit */}
        <div>
          <button
            type="submit"
            disabled={saving || skuStatus === "taken"}
            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditItemForm;
