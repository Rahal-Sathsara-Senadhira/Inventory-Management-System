import React from "react";

const prettyBytes = (n) => {
  if (!Number.isFinite(+n)) return "—";
  const u = ["B", "KB", "MB", "GB"];
  let i = 0, v = +n;
  while (v >= 1024 && i < u.length - 1) { v /= 1024; i++; }
  return `${v.toFixed(v < 10 && i > 0 ? 1 : 0)} ${u[i]}`;
};
const isImageFile = (f) =>
  (f?.type || "").toLowerCase().startsWith("image/") ||
  /\.(png|jpe?g|webp|gif|bmp|svg)$/i.test(f?.name || "");

export default function Attachments({ onFilesPicked, filePreviews, removePreview }) {
  return (
    <section className="flex flex-col gap-3 lg:flex-row">
      <div className="w-full lg:flex-1">
        <h4 className="mb-2 text-sm font-semibold text-gray-800">
          Attach File(s) to Sales Order
        </h4>
        <div className="flex items-center gap-2">
          <label className="inline-flex cursor-pointer items-center rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium shadow-sm hover:bg-gray-50">
            ⬆️ Upload File
            <input type="file" multiple className="hidden" onChange={onFilesPicked} />
          </label>
          <button type="button" className="rounded-lg border border-gray-300 bg-white px-2 py-2 text-sm">
            ▾
          </button>
        </div>
        <p className="mt-2 text-xs text-gray-500">
          You can upload a maximum of 10 files, 5MB each
        </p>

        {filePreviews.length > 0 && (
          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
            {filePreviews.map((p) => (
              <div key={p.id} className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-2 shadow-sm">
                <div className="h-16 w-20 overflow-hidden rounded border border-gray-200 bg-gray-50">
                  {isImageFile(p) ? (
                    <img src={p.url} alt={p.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-2xl">📎</div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-gray-800">{p.name}</div>
                  <div className="text-xs text-gray-500">{(p.type || "file") + " · " + prettyBytes(p.size)}</div>
                </div>
                <button
                  type="button"
                  onClick={() => removePreview(p.id)}
                  title="Remove"
                  className="rounded border border-red-200 px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
