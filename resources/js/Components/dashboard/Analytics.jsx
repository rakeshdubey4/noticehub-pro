import {
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid
} from "recharts";

export default function Analytics({ summary }) {

    const chartData = [
        {
            name: "Pending",
            value: summary.pending,
            color: "#f59e0b"
        },
        {
            name: "Filed",
            value: summary.filed,
            color: "#10b981"
        },
        {
            name: "Not Needed",
            value: summary.not_needed,
            color: "#64748b"
        }
    ];

    return (
        <div className="grid lg:grid-cols-2 gap-6">

            <div className="bg-white rounded-2xl p-6 shadow">

                <h3 className="font-bold mb-4">
                    Filing Distribution
                </h3>

                <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                        <Pie
                            data={chartData}
                            dataKey="value"
                            outerRadius={100}
                        >
                            {chartData.map((entry, index) => (
                                <Cell
                                    key={index}
                                    fill={entry.color}
                                />
                            ))}
                        </Pie>
                    </PieChart>
                </ResponsiveContainer>

            </div>

            <div className="bg-white rounded-2xl p-6 shadow">

                <h3 className="font-bold mb-4">
                    Notice Analytics
                </h3>

                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="value" />
                    </BarChart>
                </ResponsiveContainer>

            </div>

        </div>
    );
}