const OverviewTab = () => {
  const item = {
    itemType: "Sales Items",
    sku: "Item 1 sku",
    hsnCode: "942173",
    unit: "Pcs",
    upc: "Item 1 upc",
    ean: "Item 1 ean",
    isbn: "Item 1 isbn",
    createdSource: "User",
    salesTax: "",
    sellingPrice: "$6304.00",
    salesAccount: "General Income",
    description: "A sleek, modern coffee table with a glass top.",
  };
  return (
    <div className="p-4">
      <div className="item-details-page px-4 py-6">
        <div className="row flex flex-wrap">
          {/* Left Panel */}
          <div className="w-full md:w-8/12">
            <div className="group pb-3">
              <div className="row flex mb-2">
                <label className="w-1/3 font-medium text-gray-700">
                  Item Type
                </label>
                <label className="w-2/3">{item.itemType}</label>
              </div>
            </div>

            <div className="group space-y-2">
              <div className="row flex">
                <label className="w-1/3 font-medium text-gray-700">SKU</label>
                <label className="w-2/3 break-words">{item.sku}</label>
              </div>
              <div className="row flex">
                <label className="w-1/3 font-medium text-gray-700">
                  HSN Code
                </label>
                <label className="w-2/3">{item.hsnCode}</label>
              </div>
              <div className="row flex">
                <label className="w-1/3 font-medium text-gray-700">Unit</label>
                <label className="w-2/3">{item.unit}</label>
              </div>
              <div className="row flex">
                <label className="w-1/3 font-medium text-gray-700">UPC</label>
                <label className="w-2/3">{item.upc}</label>
              </div>
              <div className="row flex">
                <label className="w-1/3 font-medium text-gray-700">EAN</label>
                <label className="w-2/3">{item.ean}</label>
              </div>
              <div className="row flex">
                <label className="w-1/3 font-medium text-gray-700">ISBN</label>
                <label className="w-2/3">{item.isbn}</label>
              </div>
              <div className="row flex">
                <label className="w-1/3 font-medium text-gray-700">
                  Created Source
                </label>
                <label className="w-2/3">{item.createdSource}</label>
              </div>
              <div className="row flex">
                <label className="w-1/3 font-medium text-gray-700">
                  Sales Tax
                </label>
                <label className="w-2/3">{item.salesTax || "-"}</label>
              </div>
            </div>

            <label className="block py-4 font-medium text-lg">
              Sales Information
            </label>

            <div className="group space-y-2">
              <div className="row flex">
                <label className="w-1/3 font-medium text-gray-700">
                  Selling Price
                </label>
                <label className="w-2/3">{item.sellingPrice}</label>
              </div>
              <div className="row flex">
                <label className="w-1/3 font-medium text-gray-700">
                  Sales Account
                </label>
                <label className="w-2/3">{item.salesAccount}</label>
              </div>
              <div className="row flex">
                <label className="w-1/3 font-medium text-gray-700">
                  Description
                </label>
                <span className="w-2/3 break-words">
                  <span id="full-text">{item.description}</span>
                </span>
              </div>
            </div>

            {/* Collapsible section title */}
            <div className="group pt-6">
              <div className="flex items-center space-x-2 cursor-pointer text-blue-600">
                <label className="font-medium">Associated Price Lists</label>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 512 512"
                  className="w-4 h-4 inline-block"
                >
                  <path d="M481.6 74.4H30.4c-9.6 0-15.3 10.6-10 18.6l223.3 339.2c4.7 7.2 15.2 7.2 20 .1 39.5-58.8 184.2-274.2 227.8-339.2 5.4-7.9-.3-18.7-9.9-18.7z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Right Panel (Image Upload) */}
          <div className="w-full md:w-4/12 pt-6 md:pt-0">
            <div className="group border rounded-md p-4">
              <div className="text-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 472.7 386.4"
                  className="w-14 h-14 mx-auto text-gray-400"
                >
                  <path d="M392 0H81C36 0 0 36 0 81v224a81 81 0 0081 81h311c44 0 81-36 81-81V81c0-45-37-81-81-81zM42 81c0-21 18-39 39-39h311c21 0 39 18 39 39v101l-112 76c-10 7-23 7-33-1l-94-66a72 72 0 00-82 1l-68 48V81zm389 224c0 22-18 39-39 39H81c-21 0-39-17-39-39v-14l92-65c10-7 24-7 34 0l94 66a71 71 0 0081 1l88-60v72z" />
                  <path d="M301 83a56 56 0 100 113 56 56 0 000-113zm0 78a21 21 0 110-43 21 21 0 010 43z" />
                </svg>
                <div className="text-sm text-muted mt-2">
                  <label className="text-gray-500">Drag image(s) here or</label>
                  <br />
                  <span className="text-blue-600 cursor-pointer">
                    Browse images
                  </span>
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept="image/png,image/jpeg"
                  multiple
                />
                <div className="text-xs text-gray-400 mt-2">
                  You can add up to 15 images, each not exceeding 5 MB.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OverviewTab;
