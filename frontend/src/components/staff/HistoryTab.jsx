import { useState, useEffect } from "react";
import staffService from "../../services/staffService";
import { History } from "lucide-react";

const HistoryTab = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    staffService
      .getMyTransactions()
      .then((res) => setTransactions(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-5xl mx-auto">
      <h2 className="text-2xl font-display text-yellow-500 mb-6 flex items-center gap-2">
        <History /> My Transaction History
      </h2>

      <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm min-w-[600px]">
            <thead className="bg-black/40 text-gray-400 uppercase font-bold text-xs tracking-wider">
              <tr>
                <th className="p-4">Date & Time</th>
                <th className="p-4">Type</th>
                <th className="p-4">Player</th>
                <th className="p-4 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan="4" className="p-8 text-center text-gray-500">
                    No transactions recorded.
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <tr
                    key={tx.transaction_id}
                    className="hover:bg-white/5 transition-colors"
                  >
                    <td className="p-4">
                      <div className="font-bold text-white">
                        {new Date(tx.created_at).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(tx.created_at).toLocaleTimeString()}
                      </div>
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                          tx.transaction_type === "DEPOSIT"
                            ? "bg-green-500/20 text-green-400"
                            : "bg-red-500/20 text-red-400"
                        }`}
                      >
                        {tx.transaction_type}
                      </span>
                    </td>
                    <td className="p-4 text-white font-mono text-xs">
                      {tx.email}
                    </td>
                    <td
                      className={`p-4 text-right font-mono font-bold text-lg ${
                        tx.transaction_type === "DEPOSIT"
                          ? "text-green-400"
                          : "text-red-400"
                      }`}
                    >
                      {tx.transaction_type === "DEPOSIT" ? "+" : "-"}$
                      {tx.amount}
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

export default HistoryTab;
