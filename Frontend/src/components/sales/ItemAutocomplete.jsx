function ItemAutocomplete({ value, onChange, priceListId, disabled }) {
  // value: itemId (string) or null
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const inputRef = useRef(null);
  const listRef = useRef(null);
  const acRef = useRef(null); // AbortController

  // When value (itemId) changes, fetch the item to show its name in the input
  useEffect(() => {
    let alive = true;
    (async () => {
      if (!value) {
        setQuery("");
        return;
      }
      try {
        const res = await fetch(`${API_BASE}/api/items/${value}`);
        if (alive && res.ok) {
          const it = await res.json();
          setQuery(it?.name || "");
        }
      } catch { /* ignore */ }
    })();
    return () => { alive = false; };
  }, [value]);

  // Debounced server search
  useEffect(() => {
    const q = query.trim();
    if (!open || q.length === 0) {
      setItems([]);
      return;
    }
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        acRef.current?.abort();
        const ac = new AbortController();
        acRef.current = ac;

        const url = new URL(`${API_BASE}/api/items/search`);
        url.searchParams.set("q", q);
        if (priceListId) url.searchParams.set("priceListId", priceListId);

        const res = await fetch(url, { signal: ac.signal });
        if (!res.ok) throw new Error("Search failed");
        const data = await res.json();
        setItems(Array.isArray(data) ? data : []);
        setActive(0);
      } catch (e) {
        if (e.name !== "AbortError") {
          console.error(e);
          setItems([]);
        }
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [query, open, priceListId]);

  // Close on outside click
  useEffect(() => {
    const onDoc = (e) => {
      if (!inputRef.current?.contains(e.target) && !listRef.current?.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const select = (it) => {
    // Notify parent with the full item object (or just id if you prefer)
    onChange?.(it || null);
    setQuery(it ? it.name : "");
    setOpen(false);
    inputRef.current?.blur();
  };

  const onKeyDown = (e) => {
    if (!open && (e.key === "ArrowDown" || e.key === "Enter")) {
      setOpen(true);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, items.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (items[active]) select(items[active]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div className="relative">
      <div className="flex">
        <input
          ref={inputRef}
          type="text"
          placeholder="Type to search items…"
          value={query}
          disabled={disabled}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          role="combobox"
          aria-expanded={open}
          aria-controls="item-listbox"
          aria-autocomplete="list"
        />
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="ml-1 rounded-md border border-gray-200 px-2 text-sm"
          title="Open list"
        >
          {loading ? "…" : "🔍"}
        </button>
      </div>

      {open && (
        <ul
          ref={listRef}
          id="item-listbox"
          role="listbox"
          className="absolute z-30 mt-1 max-h-64 w-full overflow-auto rounded-lg border border-gray-200 bg-white p-1 shadow-lg"
        >
          {loading && <li className="px-3 py-2 text-sm text-gray-500">Searching…</li>}
          {!loading && items.length === 0 && query.trim().length > 0 && (
            <li className="px-3 py-2 text-sm text-gray-500">No matches</li>
          )}
          {items.map((it, i) => {
            const isActive = i === active;
            const subtitle =
              it.sku ? `SKU: ${it.sku}` :
              typeof it.stock === "number" ? `Stock: ${it.stock}` : "";
            const price =
              it?.prices?.[priceListId] ?? it?.price ?? null;
            return (
              <li
                key={it._id}
                role="option"
                aria-selected={isActive}
                onMouseEnter={() => setActive(i)}
                onMouseDown={(e) => {
                  e.preventDefault();
                  select(it);
                }}
                className={`cursor-pointer rounded-md px-3 py-2 text-sm ${isActive ? "bg-indigo-50 text-indigo-700" : "hover:bg-gray-50"}`}
              >
                <div className="flex items-center justify-between">
                  <div className="font-medium">{it.name}</div>
                  {price != null && (
                    <div className="ml-3 text-xs text-gray-500">
                      {price}
                    </div>
                  )}
                </div>
                {subtitle && <div className="text-xs text-gray-500">{subtitle}</div>}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
