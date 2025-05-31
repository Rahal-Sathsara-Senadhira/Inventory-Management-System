import React, { useState } from 'react';

const AddItemForm = () => {
  const [formData, setFormData] = useState({
    type: 'Goods',
    name: '',
    sku: '',
    unit: '',
    returnable: true,
    dimensions: { length: '', width: '', height: '' },
    weight: '',
    manufacturer: '',
    brand: '',
    upc: '',
    ean: '',
    mpn: '',
    isbn: '',
    image: null
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name.startsWith('dim_')) {
      const dimension = name.split('_')[1];
      setFormData((prev) => ({
        ...prev,
        dimensions: { ...prev.dimensions, [dimension]: value }
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file && file.size <= 5 * 1024 * 1024) {
      setFormData({ ...formData, image: file });
    } else {
      alert('Image must be less than 5MB');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Submitted:', formData);
    // TODO: Send formData to backend (e.g., via Axios)
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-5xl mx-auto p-4 space-y-6">
      <h2 className="text-2xl font-bold">New Item</h2>

      <div className="flex items-center gap-6">
        <label className="flex items-center gap-2">
          <input type="radio" name="type" value="Goods" checked={formData.type === 'Goods'} onChange={handleChange} />
          Goods
        </label>
        <label className="flex items-center gap-2">
          <input type="radio" name="type" value="Service" checked={formData.type === 'Service'} onChange={handleChange} />
          Service
        </label>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <input name="name" value={formData.name} onChange={handleChange} required className="border p-2 rounded" placeholder="Name*" />
        <input name="sku" value={formData.sku} onChange={handleChange} className="border p-2 rounded" placeholder="SKU" />

        <input name="unit" value={formData.unit} onChange={handleChange} required className="border p-2 rounded" placeholder="Unit*" />
        <label className="flex items-center gap-2">
          <input type="checkbox" name="returnable" checked={formData.returnable} onChange={handleChange} />
          Returnable Item
        </label>

        <div className="flex items-center gap-2">
          <input name="dim_length" value={formData.dimensions.length} onChange={handleChange} className="w-full border p-2 rounded" placeholder="Length" />
          <input name="dim_width" value={formData.dimensions.width} onChange={handleChange} className="w-full border p-2 rounded" placeholder="Width" />
          <input name="dim_height" value={formData.dimensions.height} onChange={handleChange} className="w-full border p-2 rounded" placeholder="Height" />
        </div>

        <input name="weight" value={formData.weight} onChange={handleChange} className="border p-2 rounded" placeholder="Weight" />
        <input name="manufacturer" value={formData.manufacturer} onChange={handleChange} className="border p-2 rounded" placeholder="Manufacturer" />
        <input name="brand" value={formData.brand} onChange={handleChange} className="border p-2 rounded" placeholder="Brand" />
        <input name="upc" value={formData.upc} onChange={handleChange} className="border p-2 rounded" placeholder="UPC" />
        <input name="ean" value={formData.ean} onChange={handleChange} className="border p-2 rounded" placeholder="EAN" />
        <input name="mpn" value={formData.mpn} onChange={handleChange} className="border p-2 rounded" placeholder="MPN" />
        <input name="isbn" value={formData.isbn} onChange={handleChange} className="border p-2 rounded" placeholder="ISBN" />
      </div>

      <div className="mt-4">
        <label className="block mb-2 font-medium">Upload Image (Max 5MB):</label>
        <input type="file" accept="image/*" onChange={handleImageUpload} />
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

      <div className="flex gap-4 mt-6">
        <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Save</button>
        <button type="button" onClick={() => console.log('Cancelled')} className="px-6 py-2 bg-gray-300 rounded">Cancel</button>
      </div>
    </form>
  );
};

export default AddItemForm;
