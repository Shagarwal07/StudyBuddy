import { useState, useEffect } from "react";
import { X, ShieldCheck, Clock, RefreshCw, Search, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../api/axios";

export default function RkAdminModal({ isOpen, onClose, onUpdated }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await api.get("/prephub/admin/pending-verifications");
      if (res.data.success) setRequests(res.data.requests || []);
    } catch {
      toast.error("Failed to load verification requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) fetchRequests();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDecision = async (userId, decision) => {
    try {
      setActionLoading(userId);
      const res = await api.post("/prephub/admin/decide-verification", { userId, decision });
      if (res.data.success) {
        toast.success(decision === "approve" ? "Student approved." : "Request rejected.");
        setRequests((prev) => prev.filter((r) => r.userId !== userId));
        onUpdated?.();
      }
    } catch {
      toast.error("Failed to update verification");
    } finally {
      setActionLoading(null);
    }
  };

  const term = searchTerm.toLowerCase();
  const filtered = requests.filter(
    (r) =>
      r.studentName?.toLowerCase().includes(term) ||
      r.contact?.toLowerCase().includes(term) ||
      r.email?.toLowerCase().includes(term)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="relative w-full max-w-xl bg-[#0F0F12] border border-neutral-800 rounded-2xl shadow-2xl flex flex-col text-neutral-200 max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center text-red-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-white">Student Verifications</h2>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-neutral-800 text-neutral-300 font-mono">
                  {requests.length}
                </span>
              </div>
              <p className="text-[11px] text-neutral-400">RK Coaching access approvals</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={fetchRequests}
              disabled={loading}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition cursor-pointer"
              title="Refresh"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="px-5 py-2.5 border-b border-neutral-800/80 bg-neutral-900/40 flex items-center gap-2">
          <Search className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
          <input
            type="text"
            placeholder="Search by student name, phone, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-transparent text-xs text-white placeholder-neutral-500 outline-none"
          />
        </div>

        {/* List */}
        <div className="p-5 overflow-y-auto space-y-2.5 flex-1">
          {loading ? (
            <div className="text-center py-10 text-xs text-neutral-400">Loading requests...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-10 space-y-1.5">
              <CheckCircle2 className="w-8 h-8 text-neutral-600 mx-auto" />
              <p className="text-xs font-medium text-neutral-300">No pending requests</p>
              <p className="text-[11px] text-neutral-500">All verification requests have been processed.</p>
            </div>
          ) : (
            filtered.map((req) => (
              <div
                key={req.userId}
                className="p-3.5 rounded-xl bg-neutral-900/50 border border-neutral-800/80 hover:border-neutral-700 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-white">{req.studentName}</span>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 border border-neutral-700/60">
                      📱 {req.contact || "No Phone"}
                    </span>
                  </div>
                  <div className="text-[11px] text-neutral-400 flex flex-wrap items-center gap-3">
                    <span>Email: <strong className="text-neutral-300 font-normal">{req.email}</strong></span>
                    <span className="text-neutral-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(req.requestedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
                  <button
                    type="button"
                    onClick={() => handleDecision(req.userId, "reject")}
                    disabled={actionLoading === req.userId}
                    className="px-2.5 py-1.5 rounded-lg text-neutral-400 hover:text-red-400 hover:bg-neutral-800 text-xs font-medium transition cursor-pointer border border-neutral-800"
                  >
                    Reject
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDecision(req.userId, "approve")}
                    disabled={actionLoading === req.userId}
                    className="px-3 py-1.5 rounded-lg bg-neutral-100 hover:bg-white text-neutral-900 text-xs font-semibold transition cursor-pointer shadow-sm"
                  >
                    Approve
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
