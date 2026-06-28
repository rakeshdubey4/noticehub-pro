import { useEffect, useRef, useState } from "react";
import axios from "axios";

export default function Autocomplete({
    value,
    onChange,
    url,
    placeholder = "",
    label,
    required = false,
    error = "",
}) {
    const [query, setQuery] = useState(value || "");
    const [items, setItems] = useState([]);
    const [recentItems, setRecentItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const [selected, setSelected] = useState(-1);

    const wrapperRef = useRef(null);

    useEffect(() => {
        setQuery(value || "");
    }, [value]);

    useEffect(() => {
        const recent = JSON.parse(
            localStorage.getItem(`recent_${url}`) || "[]"
        );

        setRecentItems(recent);
    }, [url]);

    useEffect(() => {
        if (query.trim() === "") {
            setItems([]);
            setSelected(-1);
            return;
        }

        const timer = setTimeout(async () => {
            try {
                setLoading(true);

                const res = await axios.get(url, {
                    params: {
                        search: query,
                    },
                });

                setItems(res.data);
                setOpen(true);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [query, url]);

    useEffect(() => {
        function handleOutside(e) {
            if (!wrapperRef.current?.contains(e.target)) {
                setOpen(false);
            }
        }

        document.addEventListener("mousedown", handleOutside);

        return () =>
            document.removeEventListener("mousedown", handleOutside);
    }, []);

    function saveRecent(item) {
        let list = JSON.parse(
            localStorage.getItem(`recent_${url}`) || "[]"
        );

        list = [item, ...list.filter((i) => i !== item)].slice(0, 8);

        localStorage.setItem(
            `recent_${url}`,
            JSON.stringify(list)
        );

        setRecentItems(list);
    }

    function choose(item) {
        setQuery(item);
        onChange(item);
        saveRecent(item);
        setOpen(false);
    }

    function handleKey(e) {
        const activeList =
            query.trim() === "" ? recentItems : items;

        if (!open || activeList.length === 0) return;

        if (e.key === "ArrowDown") {
            e.preventDefault();

            setSelected((prev) =>
                Math.min(prev + 1, activeList.length - 1)
            );
        }

        if (e.key === "ArrowUp") {
            e.preventDefault();

            setSelected((prev) =>
                Math.max(prev - 1, 0)
            );
        }

        if (e.key === "Enter") {
            if (selected >= 0) {
                e.preventDefault();
                choose(activeList[selected]);
            }
        }

        if (e.key === "Escape") {
            setOpen(false);
        }
    }

    return (
        <div className="relative" ref={wrapperRef}>
            {label && (
                <label className="mb-1 block text-sm font-medium">
                    {label}

                    {required && (
                        <span className="ml-1 text-red-500">*</span>
                    )}
                </label>
            )}

            <input
                value={query}
                placeholder={placeholder}
                onFocus={() => setOpen(true)}
                onKeyDown={handleKey}
                onChange={(e) => {
                    setQuery(e.target.value);
                    onChange(e.target.value);
                    setSelected(-1);
                    setOpen(true);
                }}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 shadow-sm transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            />

            {open && (
                <div className="absolute z-50 mt-1 max-h-72 w-full overflow-auto rounded-xl border bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900">

                    {loading && (
                        <div className="px-4 py-3 text-sm text-gray-500">
                            Searching...
                        </div>
                    )}

                    {!loading &&
                        query.trim() === "" &&
                        recentItems.length > 0 && (
                            <>
                                <div className="border-b bg-slate-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:bg-slate-800">
                                    🕒 Recently Used
                                </div>

                                {recentItems.map((item, index) => (
                                    <button
                                        key={item}
                                        type="button"
                                        onClick={() => choose(item)}
                                        className={`block w-full px-4 py-2 text-left transition hover:bg-blue-50 dark:hover:bg-slate-800 ${
                                            selected === index
                                                ? "bg-blue-100 dark:bg-slate-700"
                                                : ""
                                        }`}
                                    >
                                        {item}
                                    </button>
                                ))}

                                <button
                                    type="button"
                                    onClick={() => {
                                        localStorage.removeItem(
                                            `recent_${url}`
                                        );
                                        setRecentItems([]);
                                    }}
                                    className="w-full border-t px-4 py-2 text-left text-xs text-red-600 hover:bg-red-50"
                                >
                                    Clear History
                                </button>
                            </>
                        )}

                    {!loading &&
                        query.trim() !== "" &&
                        items.map((item, index) => (
                            <button
                                key={item}
                                type="button"
                                onClick={() => choose(item)}
                                className={`block w-full px-4 py-2 text-left transition hover:bg-blue-50 dark:hover:bg-slate-800 ${
                                    selected === index
                                        ? "bg-blue-100 dark:bg-slate-700"
                                        : ""
                                }`}
                            >
                                {item}
                            </button>
                        ))}

                    {!loading &&
                        query.trim() !== "" &&
                        items.length === 0 && (
                            <div className="px-4 py-3 text-sm text-gray-500">
                                No matching result found.
                            </div>
                        )}
                </div>
            )}

            {error && (
                <p className="mt-1 text-sm text-red-600">
                    {error}
                </p>
            )}
        </div>
    );
}