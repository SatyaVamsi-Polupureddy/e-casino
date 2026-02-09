import { useEffect, useState } from "react";

import adminService from "../../services/adminService";

const EarningsTab = () => {
  const [data, setData] = useState({ total: 0, breakdown: [] });
  const [filters, setFilters] = useState({
    groupBy: "TENANT",
    timeRange: "1M",
  });

  useEffect(() => {
    adminService
      .getPlatformEarnings({
        group_by: filters.groupBy,
        time_range: filters.timeRange,
      })
      .then((res) =>
        setData({
          total: res.data.total_earnings,
          breakdown: res.data.breakdown,
        }),
      )
      .catch(console.error);
  }, [filters]);

  return (
    <div className="max-w-5xl mx-auto mt-4">
      <div className="flex gap-6 mb-8">
        <div className="bg-gradient-to-br from-yellow-900/40 to-black border border-yellow-500/30 p-6 rounded-xl flex-1">
          <h3 className="text-gray-400 text-sm font-bold uppercase">
            Total Revenue
          </h3>
          <div className="text-4xl font-mono font-bold text-yellow-500">
            ${data.total.toFixed(4)}
          </div>
        </div>
        <div className="bg-[#040029] border border-yellow-500/30 p-6 rounded-xl flex-[2]">
          <div className="flex gap-4">
            <div>
              <label className="text-[10px] uppercase block mb-1">
                Group By
              </label>
              <select
                className="bg-black/40 border border-white/20 p-2 rounded text-white text-xs focus:outline-none hover:cursor-pointer"
                value={filters.groupBy}
                onChange={(e) =>
                  setFilters({ ...filters, groupBy: e.target.value })
                }
              >
                <option value="TENANT" className="bg-[#040029]">
                  Tenant
                </option>
                <option value="GAME" className="bg-[#040029]">
                  Game
                </option>
              </select>
            </div>
            <div>
              <label className="text-[10px] uppercase block mb-1">Time</label>
              <select
                className="bg-black/40 border border-white/20 p-2 rounded text-white text-xs focus:outline-none hover:cursor-pointer"
                value={filters.timeRange}
                onChange={(e) =>
                  setFilters({ ...filters, timeRange: e.target.value })
                }
              >
                <option value="1D" className="bg-[#040029] ">
                  24h
                </option>
                <option value="1W" className="bg-[#040029]">
                  7 Days
                </option>
                <option value="1M" className="bg-[#040029]">
                  30 Days
                </option>
              </select>
            </div>
          </div>
        </div>
      </div>
      <div className="bg-[#040029] rounded-xl border border-yellow-500/30 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-white/5 text-xs text-gray-400 uppercase font-bold">
            <tr>
              <th className="p-4">Name</th>
              <th className="p-4 text-right">Bets</th>
              <th className="p-4 text-right text-yellow-500">Commission</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {data.breakdown.map((r, i) => (
              <tr key={i} className="hover:bg-white/10">
                <td className="p-4 text-sm font-bold text-white">{r.label}</td>
                <td className="p-4 text-sm text-right text-gray-400">
                  {r.total_bets}
                </td>
                <td className="p-4 text-sm text-right font-mono text-yellow-500 font-bold">
                  ${r.earnings.toFixed(4)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default EarningsTab;
