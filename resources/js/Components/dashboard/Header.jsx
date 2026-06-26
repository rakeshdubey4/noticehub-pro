export default function Header({ user, setSidebarOpen }) {
    return (
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b px-6 py-4">
            <div className="flex justify-between items-center">

                <button
                    onClick={() => setSidebarOpen(true)}
                    className="lg:hidden"
                >
                    ☰
                </button>

                <h2 className="font-bold text-xl">
                    Dashboard Overview
                </h2>

                <div className="flex items-center gap-4">

                    <button>
                        🔔
                    </button>

                    <div className="h-10 w-10 rounded-full bg-blue-600 text-white flex items-center justify-center">
                        {user?.name?.charAt(0) || "U"}
                    </div>

                </div>

            </div>
        </header>
    );
}