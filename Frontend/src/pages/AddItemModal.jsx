import React, { useState } from 'react';

export function AddItemModal({ onClose, onAddItem }) {
  const [form, setForm] = useState({
    name: '',
    sku: '',
    type: 'Goods',
    description: '',
    rate: '',
    image: null,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setForm(prev => ({ ...prev, image: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = () => {
    if (form.name && form.sku && form.rate) {
      onAddItem({ ...form, rate: parseFloat(form.rate) });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Add New Item</h2>
        
        <div className="space-y-3">
          <input name="name" type="text" placeholder="Name" className="w-full p-2 border rounded" onChange={handleChange} />
          <input name="sku" type="text" placeholder="SKU" className="w-full p-2 border rounded" onChange={handleChange} />
          <input name="type" type="text" placeholder="Type" className="w-full p-2 border rounded" value={form.type} onChange={handleChange} />
          <textarea name="description" placeholder="Description" className="w-full p-2 border rounded" onChange={handleChange} />
          <input name="rate" type="number" step="0.01" placeholder="Rate" className="w-full p-2 border rounded" onChange={handleChange} />
          <input type="file" accept="image/*" onChange={handleImageChange} />
          {form.image && <img src={form.image} alt="Preview" className="w-24 h-24 object-cover rounded mt-2" />}
        </div>

        <div className="flex justify-end mt-4 space-x-2">
          <button className="bg-gray-300 px-4 py-2 rounded" onClick={onClose}>Cancel</button>
          <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600" onClick={handleSubmit}>
            Add
          </button>
        </div>
      </div>
    </div>
  );
}
