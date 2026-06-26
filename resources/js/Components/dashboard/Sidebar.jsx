import { Link } from "@inertiajs/react";

export default function Sidebar({ open, setOpen }) {

    const menuItems = [
        {
            name: "Dashboard",
            icon: "📊",
            href: route("dashboard"),
        },
        // Yahan baad me aur menu items add kar sakte ho
    ];

    return (
        <>
            {/* Mobile Overlay */}
            {open && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setOpen(false)}
                />
            )}

            <aside
                className={`
                    fixed top-0 left-0
                    h-screen w-72
                    bg-slate-900 text-white
                    z-50
                    transform transition-transform duration-300 ease-in-out
                    ${open ? "translate-x-0" : "-translate-x-full"}
                    lg:translate-x-0
                `}
            >
                {/* Logo */}
                <div className="flex items-center justify-between p-6 border-b border-slate-700">

                    <h1 className="text-xl font-bold">
                        NoticeHub
                    </h1>

                    <button
                        onClick={() => setOpen(false)}
                        className="lg:hidden text-2xl"
                    >
                        ✕
                    </button>

                </div>

                {/* Menu */}
                <nav className="p-4 space-y-2">

                    {menuItems.map((item) => (
                        <Link
                            key={item.name}
                            href={item.href}
                            onClick={() => setOpen(false)}
                            className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-800 transition"
                        >
                            <span>{item.icon}</span>
                            <span>{item.name}</span>
                        </Link>
                    ))}

                </nav>

            </aside>
        </>
    );
}