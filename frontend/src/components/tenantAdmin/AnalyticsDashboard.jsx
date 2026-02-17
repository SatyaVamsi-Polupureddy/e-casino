import React, { useState, useEffect } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Users, DollarSign, Activity, Filter, Search } from "lucide-react";
import statsService from "../../services/tenantService";

const COLORS = ["#EAB308", "#334155"];
const getCurrentMonthString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`; // e.g., "2026-02"
};

const AnalyticsDashboard = () => {
  const [summary, setSummary] = useState(null);
  const [tableData, setTableData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthString());
  const [selectedFilter, setSelectedFilter] = useState("ACTIVE_TODAY");
  const [threshold, setThreshold] = useState(100);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchSummary = async () => {
    try {
      const res = await statsService.getSummary();
      setSummary(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTableData = async () => {
    setIsRefreshing(true);
    try {
      const res = await statsService.getPlayerStats(
        selectedFilter,
        threshold,
        selectedMonth,
      );
      setTableData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchSummary(), fetchTableData()]).finally(() =>
      setLoading(false),
    );
  }, []);

  useEffect(() => {
    fetchTableData();
  }, [selectedFilter, selectedMonth]);

  const handleThresholdSubmit = (e) => {
    if (e.key === "Enter") fetchTableData();
  };

  const pieData = summary
    ? [
        { name: "Active Today", value: summary.active_today },
        { name: "Inactive", value: summary.inactive_today },
      ]
    : [];

  if (loading) {
    return (
      <div className="p-8 text-center text-gray-500 animate-pulse bg-[#020010] min-h-screen">
        Loading Analytics...
      </div>
    );
  }

  return (
    <div className="p-6 bg-[#020010] min-h-screen text-white space-y-8">
      {/* KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard
          title="Total Players"
          value={summary?.total_players || 0}
          icon={Users}
          color="text-blue-400"
        />
        <KpiCard
          title="Active Today"
          value={summary?.active_today || 0}
          icon={Activity}
          color="text-green-400"
        />
        <KpiCard
          title="Today's GGR"
          value={`$${summary?.ggr_today?.toFixed(2) || "0.00"}`}
          icon={DollarSign}
          color="text-yellow-400"
        />
        <KpiCard
          title="Inactive"
          value={summary?.inactive_today || 0}
          icon={Users}
          color="text-gray-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 ">
        {/* PIE CHART */}
        <div className="bg-[#0b0a1f] p-6 rounded-xl border border-white/5 shadow-xl">
          <h3 className="text-lg font-display text-yellow-500 mb-4">
            Player Activity Ratio
          </h3>

          <div
            className="h-[250px] min-w-0  w-full  "
            // style={{ width: "100%", height: 250 }}
          >
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1a1a1a",
                      border: "1px solid #333",
                    }}
                    itemStyle={{ color: "#fff" }}
                  />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500 text-sm">
                No Data Available
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-2 bg-[#0b0a1f] p-6 rounded-xl border border-white/5 shadow-xl flex flex-col justify-center items-center text-center">
          <div className="p-4 bg-yellow-500/10 rounded-full mb-4">
            <Activity size={40} className="text-yellow-500" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">
            Real-Time Insights
          </h3>
          <p className="text-gray-400 max-w-md">
            Select a filter from the top right to deep dive into specific player
            segments like High Rollers or Big Winners.
          </p>
        </div>
      </div>

      {/* DATA TABLE SECTION */}
      <div className="bg-[#0b0a1f] rounded-xl border border-white/5 shadow-xl flex flex-col max-w-full">
        <div className="p-6 border-b border-white/10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex items-center gap-2 mb-2 lg:mb-0">
            <Filter className="text-yellow-500" size={20} />
            <h3 className="text-lg font-bold text-white">Player Segments</h3>
          </div>

          <div className="flex flex-col lg:flex-row gap-3 w-full lg:w-auto items-stretch lg:items-center">
            {selectedFilter !== "CHURN_RISK" && (
              <input
                type="month"
                value={selectedMonth}
                max={getCurrentMonthString()}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-black/30 border border-white/10 rounded-lg py-2 px-4 text-sm text-white focus:border-yellow-500 outline-none cursor-pointer hover:bg-white/5 transition-colors w-full lg:w-auto"
                title="Filter by Month (Clear to see Today/All Time)"
              />
            )}

            {selectedFilter === "HIGH_ROLLERS" && (
              <div className="relative w-full lg:w-auto">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  $
                </span>
                <input
                  type="number"
                  value={threshold}
                  onChange={(e) => setThreshold(e.target.value)}
                  onKeyDown={handleThresholdSubmit}
                  className="bg-black/30 border border-white/10 rounded-lg py-2 pl-7 pr-4 text-sm text-white focus:border-yellow-500 outline-none w-full lg:w-32 transition-colors"
                  placeholder="Min Bet"
                />
              </div>
            )}

            <select
              value={selectedFilter}
              onChange={(e) => {
                setSelectedFilter(e.target.value);
                if (e.target.value === "CHURN_RISK") setSelectedMonth("");
              }}
              className="bg-black/30 border border-white/10 rounded-lg py-2 px-4 text-sm text-white focus:border-yellow-500 outline-none cursor-pointer hover:bg-white/5 transition-colors w-full lg:w-auto max-w-full"
            >
              <option value="ACTIVE" className="bg-[#040029]">
                {selectedMonth
                  ? "Most Active (in Month)"
                  : "Most Active (Today)"}
              </option>
              <option value="HIGH_ROLLERS" className="bg-[#040029]">
                High Rollers (Bet &gt; X)
              </option>
              <option value="BIG_WINNERS" className="bg-[#040029]">
                Top Winners (Profit)
              </option>
              <option value="TOP_LOSERS" className="bg-[#040029]">
                Top Losers (Losses)
              </option>
              <option value="CHURN_RISK" className="bg-[#040029]">
                Inactive 30+ Days
              </option>
            </select>
          </div>
        </div>

        {/* TABLE */}
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-sm text-gray-400">
            <thead className="bg-white/5 text-gray-200 font-display uppercase tracking-wider text-xs">
              <tr>
                <th className="p-4 whitespace-nowrap">Player</th>
                <th className="p-4 whitespace-nowrap hidden md:table-cell">
                  Email
                </th>
                <th className="p-4 text-right whitespace-nowrap">
                  {selectedFilter === "HIGH_ROLLERS"
                    ? "Max Bet"
                    : selectedFilter === "BIG_WINNERS"
                      ? "Net Profit"
                      : selectedFilter === "TOP_LOSERS"
                        ? "Net Loss"
                        : selectedFilter === "CHURN_RISK"
                          ? "Days Inactive"
                          : selectedMonth
                            ? "Monthly Sessions"
                            : "Sessions Today"}
                </th>
                <th className="p-4 text-right whitespace-nowrap">
                  Last Active
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {isRefreshing ? (
                <tr>
                  <td colSpan="4" className="p-8 text-center animate-pulse">
                    Querying Database...
                  </td>
                </tr>
              ) : tableData.length === 0 ? (
                <tr>
                  <td colSpan="4" className="p-8 text-center text-gray-500">
                    No data found for this period.
                  </td>
                </tr>
              ) : (
                tableData.map((player) => (
                  <tr
                    key={player.player_id}
                    className="hover:bg-white/5 transition-colors"
                  >
                    <td className="p-4 font-bold text-white whitespace-nowrap">
                      {player.username}
                    </td>
                    <td className="p-4 whitespace-nowrap hidden md:table-cell">
                      {player.email}
                    </td>

                    <td
                      className={`p-4 text-right font-mono whitespace-nowrap 
                        ${
                          selectedFilter === "BIG_WINNERS"
                            ? "text-green-400"
                            : selectedFilter === "TOP_LOSERS"
                              ? "text-red-400"
                              : "text-yellow-500"
                        }`}
                    >
                      {selectedFilter === "HIGH_ROLLERS" &&
                        `$${player.max_val}`}
                      {selectedFilter === "BIG_WINNERS" &&
                        `+$${player.max_val?.toFixed(2)}`}
                      {selectedFilter === "TOP_LOSERS" &&
                        `-$${player.max_val?.toFixed(2)}`}
                      {(selectedFilter === "ACTIVE" ||
                        selectedFilter === "ACTIVE_TODAY") &&
                        player.max_val}
                      {selectedFilter === "CHURN_RISK" &&
                        (player.max_val !== null
                          ? `${Math.floor(player.max_val)} Days`
                          : "Never Played")}
                    </td>
                    <td className="p-4 text-right whitespace-nowrap">
                      {player.last_active
                        ? new Date(player.last_active).toLocaleDateString()
                        : "Never"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const KpiCard = ({ title, value, icon: Icon, color }) => (
  <div className="bg-[#0b0a1f] p-6 rounded-xl border border-white/5 shadow-xl flex items-center gap-4 hover:border-white/10 transition-colors">
    <div className={`p-3 bg-white/5 rounded-lg ${color}`}>
      <Icon size={24} />
    </div>
    <div>
      <p className="text-gray-500 text-xs uppercase tracking-widest">{title}</p>
      <h4 className="text-2xl font-bold font-display text-white mt-1">
        {value}
      </h4>
    </div>
  </div>
);

export default AnalyticsDashboard;
