import React, { useState, useEffect } from "react";
import { FileText, RefreshCw, User } from "lucide-react";
import api from "../../services/api";
import tenantService from "../../services/tenantService";

const LogViewer = () => {
  const [logs, setLogs] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState("ALL");

  // 1. Fetch Logs
  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await api.get("/tenant/logs/");
      setLogs(res.data);
    } catch (err) {
      console.error("Failed to fetch logs", err);
    } finally {
      setLoading(false);
    }
  };

  // 2. Fetch Staff Members for Dropdown
  const fetchStaff = async () => {
    try {
      const res = await tenantService.getAllStaff();
      // Assuming res.data returns an array of user objects: { email: "...", role: "..." }
      setStaffList(res.data);
    } catch (err) {
      console.error("Failed to fetch staff list", err);
    }
  };

  useEffect(() => {
    fetchLogs();
    fetchStaff();
  }, []);

  // 3. Filter Logic
  const filteredLogs = logs.filter((log) => {
    if (selectedStaff === "ALL") return true;
    // Exact match on email
    return log.staff_email === selectedStaff;
  });

  return (
    <div className="bg-white/5 p-6 rounded-xl border border-white/5 shadow-xl min-h-[500px]">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <div className="flex items-center gap-2">
          <FileText className="text-blue-400" size={24} />
          <h2 className="text-xl font-display text-white">Staff Audit Logs</h2>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* STAFF DROPDOWN */}
          <div className="relative flex-grow md:flex-grow-0 w-full md:w-64">
            <User
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={16}
            />
            <select
              value={selectedStaff}
              onChange={(e) => setSelectedStaff(e.target.value)}
              className="bg-black/30 border border-white/10 rounded-lg py-2 pl-9 pr-8 text-sm text-white focus:border-blue-500 outline-none w-full appearance-none cursor-pointer hover:bg-white/5 transition-colors"
            >
              <option value="ALL" className="bg-[#0b0a1f]">
                All Staff
              </option>
              {staffList.map((staff) => (
                <option
                  key={staff.email}
                  value={staff.email}
                  className="bg-[#0b0a1f]"
                >
                  {staff.email} ({staff.role || "Staff"})
                </option>
              ))}
            </select>
            {/* Custom Arrow for Dropdown */}
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg
                className="w-4 h-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 9l-7 7-7-7"
                ></path>
              </svg>
            </div>
          </div>

          <button
            onClick={fetchLogs}
            className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-gray-300 flex-shrink-0"
            title="Refresh Logs"
          >
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Logs Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-gray-400">
          <thead className="bg-black/40  text-gray-200 uppercase text-xs tracking-wider">
            <tr>
              <th className="p-4 whitespace-nowrap">Time</th>
              <th className="p-4 whitespace-nowrap">Staff</th>
              <th className="p-4 whitespace-nowrap">Action</th>
              <th className="p-4 w-full">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading ? (
              <tr>
                <td colSpan="4" className="p-8 text-center animate-pulse">
                  Loading Logs...
                </td>
              </tr>
            ) : filteredLogs.length === 0 ? (
              <tr>
                <td colSpan="4" className="p-8 text-center text-gray-500">
                  {selectedStaff === "ALL"
                    ? "No logs found."
                    : `No logs found for ${selectedStaff}`}
                </td>
              </tr>
            ) : (
              filteredLogs.map((log, index) => (
                <tr key={index} className="hover:bg-white/5 transition-colors">
                  <td className="p-4 whitespace-nowrap text-gray-500 font-mono text-xs">
                    {log.timestamp.split(",")[0]}
                  </td>
                  <td className="p-4 whitespace-nowrap text-blue-300 font-bold">
                    {log.staff_email}
                  </td>
                  <td className="p-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 rounded text-xs font-bold ${
                        log.action.includes("DELETE") ||
                        log.action.includes("ARCHIVE")
                          ? "bg-red-500/20 text-red-400"
                          : log.action.includes("UPDATE")
                            ? "bg-yellow-500/20 text-yellow-400"
                            : "bg-green-500/20 text-green-400"
                      }`}
                    >
                      {log.action}
                    </span>
                  </td>
                  <td className="p-4 text-gray-300">{log.details}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LogViewer;
