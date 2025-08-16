// src/pages/Customers/AddCustomerForm.jsx
import React, { useState, useEffect, useContext } from "react";
import { useNavigate, useParams } from "react-router-dom";
import CustomSelect from "../../components/ui/CustomSelect";
import HoverInfo from "../../components/ui/HoverInfo";
import { AppContext } from "../../context/AppContext";

const emailRegex = /^\S+@\S+\.\S+$/;
const phoneAllowRegex = /^[0-9+\-()\s]+$/;
const allowedSalutations = new Set(["Mr", "Mrs", "Miss", "Ms", "Dr", ""]);

const normEmail = (s) => (s || "").trim().toLowerCase();
const trim = (s) => (s || "").trim();
const digitsOnly = (s) => (s.match(/\d/g) || []).join("");

// 👇 add a tenant constant (fallback to "default" for dev)
const TENANT_ID = import.meta.env?.VITE_TENANT_ID || "default";

const AddCustomerForm = () => {
  const { addCustomer, customers } = useContext(AppContext);
  const navigate = useNavigate();
  const { type } = useParams(); // /inventory/:type/customers/add-customers

  const [displayNameOptions, setDisplayNameOptions] = useState([]);

  const [formData, setFormData] = useState({
    type: "Individual",
    salutation: "",
    firstName: "",
    lastName: "",
    workPhone: "",
    mobile: "",
    customerEmail: "",
    companyName: "",
    billingAddress: {
      country: "",
      addressNo: "",
      street1: "",
      street2: "",
      city: "",
      district: "",
      zipCode: "",
      phone: "",
      fax: "",
    },
    shippingAddress: {
      country: "",
      addressNo: "",
      street1: "",
      street2: "",
      city: "",
      district: "",
      zipCode: "",
      phone: "",
      fax: "",
    },
  });

  const options = [
    { value: "Mr", label: "Mr" },
    { value: "Mrs", label: "Mrs" },
    { value: "Miss", label: "Miss" },
    { value: "Ms", label: "Ms" },
    { value: "Dr", label: "Dr" },
  ];

  // -------- validation --------
  const validateForm = () => {
    const errors = [];

    const firstName = trim(formData.firstName);
    const lastName = trim(formData.lastName);
    const email = normEmail(formData.customerEmail);
    const mobile = trim(formData.mobile);
    const workPhone = trim(formData.workPhone);
    const company = trim(formData.companyName);
    const sal = trim(formData.salutation);

    if (!firstName) errors.push("First Name is required.");
    if (!email) errors.push("Customer Email is required.");
    if (email && !emailRegex.test(email)) errors.push("Email format is invalid.");
    if (!mobile) errors.push("Mobile number is required.");

    if (firstName.length > 50) errors.push("First Name is too long (max 50).");
    if (lastName.length > 50) errors.push("Last Name is too long (max 50).");

    if (formData.type === "Business" && !company) {
      errors.push("Company Name is required for Business customers.");
    }

    if (!allowedSalutations.has(sal)) errors.push("Invalid salutation.");

    const checkPhone = (label, val) => {
      if (!val) return;
      if (!phoneAllowRegex.test(val)) errors.push(`${label} has invalid characters.`);
      if (digitsOnly(val).length < 7) errors.push(`${label} seems too short (min 7 digits).`);
    };
    checkPhone("Mobile", mobile);
    checkPhone("Work Phone", workPhone);

    if (email && customers.some((c) => normEmail(c.customerEmail) === email)) {
      errors.push("This email is already registered.");
    }
    if (mobile && customers.some((c) => digitsOnly(c.mobile || "") === digitsOnly(mobile))) {
      errors.push("This mobile number is already registered.");
    }

    return errors;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name.includes(".")) {
      const [section, key] = name.split(".");
      setFormData((prev) => ({
        ...prev,
        [section]: {
          ...prev[section],
          [key]: type === "checkbox" ? checked : value,
        },
      }));
    } else if (name.startsWith("dim_")) {
      const dimension = name.split("_")[1];
      setFormData((prev) => ({
        ...prev,
        dimensions: { ...prev.dimensions, [dimension]: value },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const errors = validateForm();
    if (errors.length > 0) {
      alert(errors.join("\n"));
      return;
    }

    const displayName =
      trim(formData.salutation) && trim(formData.firstName) && trim(formData.lastName)
        ? `${trim(formData.salutation)} ${trim(formData.firstName)} ${trim(formData.lastName)}`
        : trim(formData.firstName) && trim(formData.lastName)
        ? `${trim(formData.firstName)} ${trim(formData.lastName)}`
        : trim(formData.companyName) || "Unnamed Customer";

    // IMPORTANT: include tenantId so backend validation passes
    const payload = {
      tenantId: TENANT_ID, // 👈 add this line
      type: formData.type,
      salutation: trim(formData.salutation),
      firstName: trim(formData.firstName),
      lastName: trim(formData.lastName),
      name: displayName.trim(),
      company_name: trim(formData.companyName),
      customerEmail: normEmail(formData.customerEmail),
      workPhone: trim(formData.workPhone),
      mobile: trim(formData.mobile),
      receivables: 0,
      unused_credits: 0,
      billingAddress: { ...formData.billingAddress },
      shippingAddress: { ...formData.shippingAddress },
    };

    try {
      const saved = await Promise.resolve(addCustomer(payload));
      alert(saved && saved.cus_id ? `Customer saved with ID: ${saved.cus_id}` : "Customer saved.");
      navigate(`/inventory/${type}/customers`);
    } catch (err) {
      alert(err?.message || "Failed to save customer");
    }
  };

  useEffect(() => {
    const { salutation, firstName, lastName } = formData;
    const s = trim(salutation);
    const f = trim(firstName);
    const l = trim(lastName);

    const opts = [];
    if (f && l) {
      if (s) opts.push({ label: `${s} ${f} ${l}`, value: "1" });
      opts.push({ label: `${f} ${l}`, value: "2" });
      opts.push({ label: `${l}, ${f}`, value: "3" });
    }
    setDisplayNameOptions(opts);
  }, [formData]);

  return (
    <form onSubmit={handleSubmit} className="max-w-5xl mx-auto p-4 space-y-6">
      <h2 className="text-2xl font-bold mt-7">New Customer</h2>

      {/* Customer Type */}
      <div className="w-full lg:w-2/3 flex flex-col lg:flex-row">
        <label className="lg:w-1/4 flex items-center">
          <div className="flex">Customer Type</div>
          <span className="text-gray-500">
            <HoverInfo text="Choose 'Business' if the customer represents a company, or 'Individual' for personal customers." />
          </span>
        </label>
        <div className="flex gap-2">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="type"
              value="Business"
              checked={formData.type === "Business"}
              onChange={handleChange}
            />
            Business
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="type"
              value="Individual"
              checked={formData.type === "Individual"}
              onChange={handleChange}
            />
            Individual
          </label>
        </div>
      </div>

      {/* Primary Contact */}
      <div className="w-full lg:w-2/3 flex flex-col lg:flex-row lg:items-center">
        <label className="lg:w-1/4 mb-3 lg:mb-0 flex items-center">
          Primary Contact
          <span className="ml-2 text-gray-500">
            <HoverInfo text="Enter the main contact person’s details, including name and optional salutation." />
          </span>
        </label>
        <div className="flex gap-2 lg:w-3/4 flex-col lg:flex-row">
          <CustomSelect
            options={options}
            placeholder="Salutation"
            onChange={(value) =>
              handleChange({ target: { name: "salutation", value } })
            }
          />
          <input
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            required
            placeholder="First Name*"
            className="border p-1 px-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400"
          />
          <input
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            required
            placeholder="Last Name*"
            className="border p-1 px-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400"
          />
        </div>
      </div>

      {/* Display Name */}
      <div className="w-full lg:w-2/3 flex flex-col lg:flex-row lg:items-center">
        <label className="lg:w-1/4 mb-3 lg:mb-0 flex flex-wrap items-stretch">
          <label>Customer &nbsp;</label>
          <label>Display&nbsp;</label>
          <label>Name</label>
          <span className="ml-2 text-gray-500">
            <HoverInfo text="Select how the customer's name should appear in records and documents." />
          </span>
        </label>
        <div className="flex gap-2 w-full lg:w-3/4">
          <CustomSelect
            options={displayNameOptions}
            onChange={(value) => console.log("Selected:", value)}
          />
        </div>
      </div>

      {/* Company Name */}
      <div className="w-full lg:w-2/3 flex flex-col lg:flex-row lg:items-center">
        <label className="lg:w-1/4 mb-3 lg:mb-0 flex flex-wrap items-stretch">
          <label>Company &nbsp;</label>
          <label>Name</label>
          <span className="ml-2 text-gray-500">
            <HoverInfo text="If applicable, enter the name of the company the customer is associated with." />
          </span>
        </label>
        <div className="w-full lg:w-3/4">
          <input
            name="companyName"
            value={formData.companyName}
            onChange={handleChange}
            className="w-full border p-1 px-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400"
          />
        </div>
      </div>

      {/* Customer Email */}
      <div className="w-full lg:w-2/3 flex flex-col lg:flex-row lg:items-center">
        <label className="lg:w-1/4 mb-3 lg:mb-0 flex flex-wrap items-stretch">
          <label>Customer &nbsp;</label>
          <label>Email</label>
          <span className="ml-2 text-gray-500">
            <HoverInfo text="Enter the customer's email address for communication and records." />
          </span>
        </label>
        <div className="w-full lg:w-3/4">
          <input
            name="customerEmail"
            value={formData.customerEmail}
            onChange={handleChange}
            className="w-full border p-1 px-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400"
          />
        </div>
      </div>

      {/* Customer Phone */}
      <div className="w-full lg:w-2/3 flex flex-col lg:flex-row lg:items-center">
        <label className="lg:w-1/4 mb-3 lg:mb-0 flex flex-wrap items-stretch">
          <label>Customer &nbsp;</label>
          <label>Phone</label>
          <span className="ml-2 text-gray-500">
            <HoverInfo text="Provide both work and mobile phone numbers for easier contact." />
          </span>
        </label>
        <div className="flex gap-2 lg:w-3/4 flex-col lg:flex-row">
          <input
            name="workPhone"
            value={formData.workPhone}
            onChange={handleChange}
            placeholder="Work Phone*"
            className="border p-1 px-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400"
          />
          <input
            name="mobile"
            value={formData.mobile}
            onChange={handleChange}
            placeholder="Mobile*"
            className="border p-1 px-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-10"></div>

      {/* Billing Address */}
      <AddressSection
        title="Billing Address"
        namePrefix="billingAddress"
        formData={formData.billingAddress}
        onChange={handleChange}
      />

      {/* Shipping Address */}
      <AddressSection
        title="Shipping Address"
        namePrefix="shippingAddress"
        formData={formData.shippingAddress}
        onChange={handleChange}
      />

      {/* Actions */}
      <div className="flex gap-4 py-12">
        <button
          type="submit"
          className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Save
        </button>
        <button
          type="button"
          onClick={() => console.log("Cancelled")}
          className="px-6 py-2 bg-gray-300 rounded"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() =>
            console.log(JSON.parse(localStorage.getItem("pendingCustomers") || "[]"))
          }
          className="px-6 py-2 bg-gray-300 rounded"
        >
          View Unsynced Customers
        </button>
      </div>
    </form>
  );
};

const AddressSection = ({ title, namePrefix, formData, onChange }) => {
  const fields = [
    { label: "Country", name: "country" },
    { label: "Address No.", name: "addressNo" },
    { label: "Street 1", name: "street1" },
    { label: "Street 2", name: "street2" },
    { label: "City", name: "city" },
    { label: "District", name: "district" },
    { label: "Zip Code", name: "zipCode" },
    { label: "Phone", name: "phone" },
    { label: "Fax Number", name: "fax" },
  ];

  return (
    <div className="space-y-6">
      <label className="font-semibold text-2xl">{title}</label>
      {fields.map((f) => (
        <div key={f.name} className="w-full flex flex-col lg:flex-row lg:items-center">
          <label className="lg:w-1/4 mb-3 lg:mb-0 flex items-stretch">
            {f.label}
          </label>
          <div className="w-full lg:w-3/4">
            <input
              name={`${namePrefix}.${f.name}`}
              value={formData[f.name]}
              onChange={onChange}
              placeholder={f.label}
              className="w-full border p-1 px-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400"
            />
          </div>
        </div>
      ))}
    </div>
  );
};

export default AddCustomerForm;
