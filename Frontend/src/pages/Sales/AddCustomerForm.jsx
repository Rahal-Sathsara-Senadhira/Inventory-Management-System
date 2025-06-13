import React from 'react'
import { useState } from 'react';
import { FaArrowLeft, FaTimes } from 'react-icons/fa';
import { useNavigate, useParams } from 'react-router-dom';
import OverviewTab from '../../components/customers/OverviewTab';
import CommentsTab from '../../components/customers/CommentsTab';
import TransactionsTab from '../../components/items/TransactionsTab';
import StatementsTab from "../../components/customers/StatementsTab";
import CustomSelect from '../../components/ui/CustomSelect';
import { useEffect } from 'react';
import HoverInfo from '../../components/ui/HoverInfo';


const AddCustomerForm = () => {

  const navigate = useNavigate();
  const { cus_id } = useParams();
  const [displayNameOptions, setDisplayNameOptions] = useState([]);
  const [activeTab, setActiveTab] = useState("overview");

  const renderTabContent = () => {
    switch (activeTab) {
      case "overview":
        return <OverviewTab />;
      case "Comments":
        return <CommentsTab />;
      case "Statements":
        return <StatementsTab />;
      case "transactions":
        return <TransactionsTab />;
      case "Mails":
        return <MailsTab />;
      default:
        return null;
    }
  };

  const [formData, setFormData] = useState({
      type: 'Individual',
      salutation: "",
      firstName: "",
      lastName: "",
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

    const options = [
    { value: "Mr", label: "Mr" },
    { value: "Mrs", label: "Mrs" },
    { value: "Miss", label: "Miss" },
    { value: "Ms", label: "Ms" },
    { value: "Dr", label: "Dr" },
  ];
  
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
  
useEffect(() => {
    const { salutation, firstName, lastName } = formData;
    const options = [];

    if (firstName && lastName) {
      if (salutation) options.push({ label: `${salutation} ${firstName} ${lastName}`, value: `1` });
      options.push({ label: `${firstName} ${lastName}`, value: `2` });
      options.push({ label: `${lastName}, ${firstName}`, value: `3` });
    }

    setDisplayNameOptions(options);
  }, [formData]);

    return (
      <form onSubmit={handleSubmit} className="max-w-5xl mx-auto p-4 space-y-6">
        <h2 className="text-2xl font-bold">New Customer</h2>
  
        <div className='w-full lg:w-2/3 flex flex-col lg:flex-row '>
          <label className='lg:w-1/4 flex'>Customer Type <HoverInfo text="The contacts which are associated to any Account in CRM is of type Business and the other contacts will be of type Individual." /></label>
          <div className='flex gap-2'>
            <label className="flex items-center gap-2">
              <input type="radio" name="type" value="Business" checked={formData.type === 'Business'} onChange={handleChange} />
              Business
            </label>
            <label className="flex items-center gap-2">
              <input type="radio" name="type" value="Individual" checked={formData.type === 'Individual'} onChange={handleChange} />
               Individual
            </label>
          </div>
        </div>

        <div className='w-full lg:w-2/3 flex flex-col lg:flex-row lg:items-center'>
          <label className='lg:w-1/4 mb-3 lg:mb-0 flex'>Primary Contact <HoverInfo text="The contacts which are associated to any Account in CRM is of type Business and the other contacts will be of type Individual." /></label>
          <div className='flex gap-2 lg:w-3/4 flex-col lg:flex-row'>
              <CustomSelect
                options={options}
                placeholder="Salutation"
                onChange={(value) => handleChange({ target: { name: "salutation", value } })}
              />
            <input name="firstName" value={formData.firstName} onChange={handleChange} required className="border p-1 px-2 rounded " placeholder="First Name*" />
            <input name="lastName" value={formData.lastName} onChange={handleChange} required className="border p-1 px-2 rounded " placeholder="Last Name*" />
          </div>
        </div>

        <div className='w-full lg:w-2/3 flex flex-col lg:flex-row lg:items-center'>
          <label className='lg:w-1/4 mb-3 lg:mb-0'>Company Name</label>
          <div className='flex gap-2 w-full lg:w-3/4'>
            <div className='w-full lg:w-3/4'>
              <input name="companyName" value={formData.companyName} onChange={handleChange} required className="border p-1 px-2 rounded w-full " />
            </div>
          </div>
        </div>

        <div className='w-full lg:w-2/3 flex flex-col lg:flex-row lg:items-center'>
          <label className='lg:w-1/4 mb-3 lg:mb-0'>Customer Display Name</label>
          <div className='flex gap-2 w-full lg:w-3/4'>
            <div className='w-full lg:w-3/4'>
              <CustomSelect
                options={displayNameOptions}
                onChange={(value) => console.log("Selected:", value)}
              />
            </div>
            
          </div>
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

        <div className="flex flex-col w-full bg-white rounded shadow space-y-4">
              {/* Header Actions */}
              <div className="sticky top-0 bg-white pt-3  px-4">
                <div className="">{cus_id}</div>
                <div className="flex items-center justify-between border-b pb-2">
                  <div className="flex items-center space-x-2">
                    <button
                      className="btn btn-secondary p-2"
                      onClick={() => navigate(-1)}
                    >
                      <FaArrowLeft className="w-4 h-4" />
                    </button>
                    {/* <FaRegSquare className="w-6 h-6 text-gray-600" /> */}
                    <h3 className="text-xl font-semibold truncate">Eva Reilly MD</h3>
                  </div>
        
                  <div className="flex items-center space-x-2">
                    <button className="btn btn-secondary">Mark as Active</button>
                    <button className="btn btn-secondary">Delete</button>
                    <button className="text-gray-600 hover:text-red-500" onClick={() => navigate(-1)}>
                      <FaTimes className="w-5 h-5" />
                    </button>
                  </div>
                </div>
        
                {/* Tabs */}
                <div className="border-b border-gray-200">
                  <ul className="flex space-x-6 text-sm font-medium text-gray-600">
                    <li
                      className={`cursor-pointer py-2 border-b-2 ${
                        activeTab === "overview"
                          ? "border-blue-500 text-blue-600"
                          : "border-transparent"
                      }`}
                      onClick={() => setActiveTab("overview")}
                    >
                      Overview
                    </li>
                    <li
                      className={`cursor-pointer py-2 border-b-2 ${
                        activeTab === "Comments"
                          ? "border-blue-500 text-blue-600"
                          : "border-transparent"
                      }`}
                      onClick={() => setActiveTab("Comments")}
                    >
                      Comments
                    </li>
                    <li
                      className={`cursor-pointer py-2 border-b-2 ${
                        activeTab === "transactions"
                          ? "border-blue-500 text-blue-600"
                          : "border-transparent"
                      }`}
                      onClick={() => setActiveTab("transactions")}
                    >
                      Transactions
                    </li>
                    <li
                      className={`cursor-pointer py-2 border-b-2 ${
                        activeTab === "Mails"
                          ? "border-blue-500 text-blue-600"
                          : "border-transparent"
                      }`}
                      onClick={() => setActiveTab("Mails")}
                    >
                      Mails
                    </li>
                    <li
                      className={`cursor-pointer py-2 border-b-2 ${
                        activeTab === "Statements"
                          ? "border-blue-500 text-blue-600"
                          : "border-transparent"
                      }`}
                      onClick={() => setActiveTab("Statements")}
                    >
                      Statements
                    </li>
                  </ul>
                </div>
              </div>
        
              {/* Tab Content */}
              <div className="bg-white shadow rounded-lg">{renderTabContent()}</div>
        
              {/* Details */}
            </div>
      </form>
    );
}

export default AddCustomerForm