export default function StatsCard({
    title,
    value,
    icon,
    bg
}) {
    return (
        <div
            className={`bg-gradient-to-r ${bg} rounded-2xl p-6 text-white shadow-lg`}
        >
            <div className="text-3xl">
                {icon}
            </div>

            <h3 className="mt-4 text-sm">
                {title}
            </h3>

            <div className="text-3xl font-black">
                {value}
            </div>
        </div>
    );
}