import {
    FileText,
    Clock3,
    CheckCircle2,
    Ban,
    Package,
    CalendarDays,
    Inbox
} from "lucide-react";

const cards = (summary) => [
    {
        title: "Total Notices",
        value: summary.total ?? 0,
        icon: FileText,
        color: "from-blue-500 to-indigo-600",
    },
    {
        title: "Total Quantity",
        value: summary.total_quantity ?? 0,
        icon: Package,
        color: "from-violet-500 to-fuchsia-600",
    },
    {
        title: "Pending",
        value: summary.pending ?? 0,
        icon: Clock3,
        color: "from-amber-400 to-orange-500",
    },
    {
        title: "Filed",
        value: summary.filed ?? 0,
        icon: CheckCircle2,
        color: "from-emerald-500 to-green-600",
    },
    {
        title: "Not Needed",
        value: summary.not_needed ?? 0,
        icon: Ban,
        color: "from-rose-500 to-red-600",
    },
    {
        title: "Today's Notices",
        value: summary.today_notices ?? 0,
        icon: CalendarDays,
        color: "from-cyan-500 to-sky-600",
    },
    {
        title: "Today's Quantity",
        value: summary.today_quantity ?? 0,
        icon: Inbox,
        color: "from-purple-500 to-indigo-700",
    },
];

export default function SummaryCards({ summary }) {
    return (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {cards(summary).map((card) => {
                const Icon = card.icon;

                return (
                    <div
                        key={card.title}
                        className="group rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-slate-700 dark:bg-slate-900"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    {card.title}
                                </p>

                                <h2 className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
                                    {card.value}
                                </h2>
                            </div>

                            <div
                                className={`rounded-2xl bg-gradient-to-r ${card.color} p-4 text-white shadow-lg`}
                            >
                                <Icon size={24} />
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}