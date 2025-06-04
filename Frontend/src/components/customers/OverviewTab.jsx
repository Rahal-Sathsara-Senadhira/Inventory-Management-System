import React, { useEffect, useRef, useState } from "react";

const ToggleSection = ({ title, children }) => {
  const [isOpen, setIsOpen] = useState(true);
  const contentRef = useRef(null);
  const [maxHeight, setMaxHeight] = useState("0px");

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;

    if (isOpen) {
      // Opening: Set scrollHeight as maxHeight
      setMaxHeight(`${el.scrollHeight}px`);
    } else {
      // Closing: First set the current scrollHeight, then next tick set to 0
      setMaxHeight(`${el.scrollHeight}px`);
      requestAnimationFrame(() => {
        setMaxHeight("0px");
      });
    }
  }, [isOpen]);

  return (
    <div className="">
      {/* Toggle Header */}
      <div
        className="flex items-center justify-between cursor-pointer py-2 uppercase text-sm text-gray-600 border-b"
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <span>{title}</span>
        <svg
          className={`w-3 h-3 transform transition-transform duration-200 text-gray-500 ${
            isOpen ? "rotate-180" : ""
          }`}
          viewBox="0 0 374.98 227.51"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M187.46 227.51c-10.23 0-20.46-3.9-28.27-11.71L11.73 68.45C-3.9 52.83-3.91 27.51 11.71 11.88c15.62-15.63 40.94-15.64 56.57-.02l119.18 119.09L306.69 11.72c15.62-15.62 40.95-15.62 56.57 0 15.62 15.62 15.62 40.95 0 56.57L215.75 215.8c-7.81 7.81-18.05 11.72-28.28 11.72z" />
        </svg>
      </div>

      {/* Toggle Content */}
      <div
        ref={contentRef}
        className="transition-all duration-500 ease-in-out overflow-hidden"
        style={{
          maxHeight,
          opacity: isOpen ? 1 : 0.5,
        }}
      >
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
};

const OverviewTab = () => {
  const [showMore, setShowMore] = useState(false);

  return (
    <div className="flex flex-col lg:flex-row lg:h-[calc(100vh-100px)] gap-6 overflow-hidden">
      {/* Left side: Org Info + Address */}
      <div className=" lg:overflow-y-auto pr-2 w-full lg:w-[300px] xl:w-[400px] bg-slate-100 px-4 py-6">
        {/* Organization Info */}
        {/* Section: Primary Contact */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Primary Contact</h2>
          <hr className="mb-2" />
          <p className="text-gray-600 text-sm">
            There is no primary contact information.{" "}
            <a href="#" className="text-blue-500 hover:underline text-xs">
              Add New
            </a>
          </p>
        </div>

        {/* Section: Remarks */}
        <ToggleSection title="Remarks">
          <p className="text-gray-700 text-sm">
            Totam qui quasi perspiciatis ab iusto illo dolore enim non.
          </p>
        </ToggleSection>

        {/* Section: Address */}
        <ToggleSection title="Address">
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold">Billing Address</h3>
              <address className="text-sm text-gray-700 not-italic">
                <strong>Kory</strong>
                <br />
                44687 Jeramie Place Suite 795
                <br />
                736 Hahn Harbors Suite 829
                <br />
                Suzannecester, Iowa, 792-930
                <br />
                Algeria
                <br />
                Phone: (672)-239-367
                <br />
                Fax: (803) 835-8705 x65440
              </address>
            </div>

            <div>
              <h3 className="font-semibold">Shipping Address</h3>
              <address className="text-sm text-gray-700 not-italic">
                <strong>Darian</strong>
                <br />
                401 Boyer Springs Apt. 289
                <br />
                1665 Bosco Wall Apt. 607
                <br />
                Port Nikkiton, Minnesota, 057-311
                <br />
                Canada
                <br />
                Phone: (737)-218-640
                <br />
                Fax: 245.325.8753 x4305
              </address>
            </div>
          </div>
        </ToggleSection>

        {/* Section: Other Details */}
        <ToggleSection title="Other Details">
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center">
              <label className="sm:w-1/3 text-gray-500 text-sm">
                Customer Type
              </label>
              <div className="sm:w-2/3 flex items-center gap-2 bg-gray-100 px-3 py-1 rounded text-sm">
                <span className="flex-1">individual</span>
                <button className="text-gray-500 hover:text-gray-700">
                  ✏️
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row">
              <label className="sm:w-1/3 text-gray-500 text-sm">
                Default Currency
              </label>
              <div className="sm:w-2/3 text-sm text-gray-700">USD</div>
            </div>
          </div>
        </ToggleSection>
      </div>

      {/* Right side: Financial Summary */}
      <div className="flex-1 lg:overflow-y-auto pl-2 px-4 py-6">
        <ToggleSection title="Financial Summary">
          {/* Payment due period */}
          <div className="flex flex-col sm:flex-row mb-4">
            <div className="sm:w-1/3 text-gray-500">Payment Due Period</div>
            <div className="sm:w-2/3">Net 60</div>
          </div>

          {/* Receivables */}
          <p className="mt-6 text-base font-medium mb-2">Receivables</p>
          <div className="overflow-auto">
            <table className="min-w-full text-sm border-t">
              <thead className="bg-gray-100 uppercase text-gray-500 text-xs">
                <tr>
                  <th className="text-left py-2 px-3">Currency</th>
                  <th className="text-right py-2 px-3">
                    Outstanding Receivables
                  </th>
                  <th className="text-right py-2 px-3">Unused Credits</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t">
                  <td className="py-2 px-3">INR - Indian Rupee</td>
                  <td className="py-2 px-3 text-right text-blue-600 cursor-pointer">
                    ₹10.00
                  </td>
                  <td className="py-2 px-3 text-right text-blue-600 cursor-pointer">
                    ₹10.00
                  </td>
                </tr>
                <tr className="border-t border-b font-medium">
                  <td className="py-2 px-3">TOTAL (USD)</td>
                  <td className="py-2 px-3 text-right">$374</td>
                  <td className="py-2 px-3 text-right">$30</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Items to be packed/shipped */}
          <ul className="flex flex-wrap gap-6 mt-6 text-sm text-gray-700">
            <li>
              <a href="#" className="hover:underline">
                Items to be packed:&nbsp;
                <span className="text-red-600 font-medium">1</span>
              </a>
            </li>
            <li>
              <a href="#" className="hover:underline">
                Items to be shipped:&nbsp;
                <span className="text-red-600 font-medium">0</span>
              </a>
            </li>
          </ul>

          {/* Empty message */}
          <div className="mt-6 text-center text-sm text-gray-400">
            No data found.
          </div>
        </ToggleSection>
      </div>
    </div>
  );
};

export default OverviewTab;
