const OverviewTab = ({ item }) => {
  if (!item) {
    return <div>Loading...</div>; // Handle loading state
  }

  return (
    <div className="p-4">
      <div className="item-details-page px-4 py-6">
        <div className="row flex flex-wrap">
          {/* Left Panel */}
          <div className="w-full md:w-8/12">
            <div className="group pb-3">
              <div className="row flex mb-2">
                <label className="w-1/3 font-medium text-gray-700">Item Type</label>
                <label className="w-2/3">{item.type}</label>
              </div>
            </div>

            <div className="group space-y-2">
              <div className="row flex">
                <label className="w-1/3 font-medium text-gray-700">SKU</label>
                <label className="w-2/3 break-words">{item.sku}</label>
              </div>
              <div className="row flex">
                <label className="w-1/3 font-medium text-gray-700">Unit</label>
                <label className="w-2/3">{item.unit}</label>
              </div>
              <div className="row flex">
                <label className="w-1/3 font-medium text-gray-700">Price</label>
                <label className="w-2/3">{`$${item.price}`}</label>
              </div>
              <div className="row flex">
                <label className="w-1/3 font-medium text-gray-700">Stock</label>
                <label className="w-2/3">{item.stock}</label>
              </div>
              <div className="row flex">
                <label className="w-1/3 font-medium text-gray-700">Weight</label>
                <label className="w-2/3">{item.weight} kg</label>
              </div>
              <div className="row flex">
                <label className="w-1/3 font-medium text-gray-700">Manufacturer</label>
                <label className="w-2/3">{item.manufacturer}</label>
              </div>
              <div className="row flex">
                <label className="w-1/3 font-medium text-gray-700">Brand</label>
                <label className="w-2/3">{item.brand}</label>
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
                <label className="w-1/3 font-medium text-gray-700">MPN</label>
                <label className="w-2/3">{item.mpn}</label>
              </div>
              <div className="row flex">
                <label className="w-1/3 font-medium text-gray-700">ISBN</label>
                <label className="w-2/3">{item.isbn}</label>
              </div>
            </div>
          </div>

          {/* Right Panel (Image) */}
          <div className="w-full md:w-4/12 pt-6 md:pt-0">
            <div className="group border rounded-md p-4">
              <img
                src={item.imageUrl}
                alt={item.name}
                className="w-full h-auto rounded-md"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OverviewTab;
