import { useState, useEffect } from "react";
import {
  X,
  Lock,
  KeyRound,
  GraduationCap,
  Send,
  Clock,
  CheckCircle2,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";

export default function RkVerificationModal({ isOpen, onClose, initialPasskey = "" }) {
  const { user, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState("passkey"); // 'passkey' | 'request'
  const [passkey, setPasskey] = useState(initialPasskey);
  const [loading, setLoading] = useState(false);

  // Request form state
  const [formData, setFormData] = useState({
    studentName: user?.name || user?.username || "",
    contact: user?.rkStudentDetails?.contact || "",
  });

  useEffect(() => {
    if (initialPasskey) {
      setPasskey(initialPasskey);
      setActiveTab("passkey");
    }
  }, [initialPasskey]);

  useEffect(() => {
    if (user?.name || user?.username) {
      setFormData((prev) => ({
        ...prev,
        studentName: prev.studentName || user.name || user.username,
      }));
    }
  }, [user]);

  if (!isOpen) return null;

  const isVerified = Boolean(user?.isRkStudent);
  const isPending = user?.rkStatus === "pending";

  // 1. Instant Unlock via Passkey
  const handleVerifyPasskey = async (e) => {
    e?.preventDefault();
    if (!passkey.trim()) {
      toast.error("Please enter the classroom passkey");
      return;
    }

    try {
      setLoading(true);
      const res = await api.post("/prephub/verify-passkey", { passkey: passkey.trim() });
      if (res.data.success) {
        toast.success(res.data.message || "Welcome! RK Coaching workspace unlocked.");
        await refreshUser?.();
        setTimeout(() => onClose(), 600);
      }
    } catch (err) {
      const msg = err.response?.data?.message || "Invalid passkey. Please check with your instructor.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // 2. Request Manual Approval
  const handleRequestVerification = async (e) => {
    e.preventDefault();
    if (!formData.studentName.trim() || !formData.contact.trim()) {
      toast.error("Please enter your Full Name and Phone Number");
      return;
    }

    try {
      setLoading(true);
      const res = await api.post("/prephub/request-verification", formData);
      if (res.data.success) {
        toast.success(res.data.message || "Request submitted! Instructor will review shortly.");
        await refreshUser?.();
      }
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to submit verification request";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md bg-[#0F0F12] border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-neutral-200">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-neutral-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-300">
              <GraduationCap className="w-4 h-4 text-red-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold tracking-wide flex items-center gap-1.5">
                  <span className="text-red-500 font-black text-sm">RK</span>
                  <span className="text-amber-400 font-bold text-sm tracking-wider">COACHING CLASSES</span>
                </h2>
                {isVerified && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                    Verified
                  </span>
                )}
              </div>
              <p className="text-[11px] text-neutral-400">
                Classroom Workspace & Curriculum Access
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4">
          {isVerified ? (
            /* Already Verified View */
            <div className="text-center py-6 space-y-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">
                  Account Verified & Unlocked
                </h3>
                <p className="text-xs text-neutral-400 mt-1 max-w-xs mx-auto">
                  You are an approved student of{" "}
                  <strong className="text-amber-400 font-semibold">RK Coaching Classes</strong>. All exclusive RK WORKSPACE classroom modules, notes, and assignments are unlocked.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg bg-neutral-100 hover:bg-white text-neutral-900 text-xs font-semibold transition cursor-pointer"
              >
                Close & Continue
              </button>
            </div>
          ) : (
            <>
              {/* Sleek Subtext Notice */}
              <div className="p-3 rounded-xl bg-neutral-900/60 border border-neutral-800/80 text-[11px] text-neutral-400 flex items-start gap-2.5 leading-relaxed">
                <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-neutral-200 font-medium">
                    RK WORKSPACE:
                  </strong>{" "}
                  Classroom notes, assignments, mock tests & offline lecture roadmaps are exclusive to enrolled students of{" "}
                  <strong className="text-amber-400 font-semibold">
                    RK Coaching Classes
                  </strong>
                  . (CORE CS & DSA modules remain 100% free for everyone).
                </div>
              </div>

              {/* Pending Request Alert */}
              {isPending && (
                <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 text-[11px] text-neutral-300 flex items-start gap-2.5">
                  <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-neutral-100">
                      Request In Review:
                    </span>{" "}
                    Your phone{" "}
                    <code className="bg-neutral-800 px-1 py-0.5 rounded text-neutral-200 font-mono">
                      {user?.rkStudentDetails?.contact || "N/A"}
                    </code>{" "}
                    is awaiting instructor approval. If you already have the class passkey, you can also enter it below.
                  </div>
                </div>
              )}

              {/* Minimal Segmented Tab Control */}
              <div className="grid grid-cols-2 p-1 bg-neutral-900/90 border border-neutral-800/80 rounded-xl text-xs">
                <button
                  type="button"
                  onClick={() => setActiveTab("passkey")}
                  className={`py-1.5 rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer text-xs ${
                    activeTab === "passkey"
                      ? "bg-neutral-800 text-white font-medium shadow-sm border border-neutral-700/60"
                      : "text-neutral-400 hover:text-neutral-200"
                  }`}
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Class Passkey</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("request")}
                  className={`py-1.5 rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer text-xs ${
                    activeTab === "request"
                      ? "bg-neutral-800 text-white font-medium shadow-sm border border-neutral-700/60"
                      : "text-neutral-400 hover:text-neutral-200"
                  }`}
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Request Access</span>
                </button>
              </div>

              {/* TAB 1: Instant Passkey Form */}
              {activeTab === "passkey" && (
                <form onSubmit={handleVerifyPasskey} className="space-y-3 pt-1">
                  <div className="space-y-1.5">
                    <label className="text-xs text-neutral-300 font-medium">
                      Classroom Passkey
                    </label>
                    <input
                      type="text"
                      value={passkey}
                      onChange={(e) => setPasskey(e.target.value.toUpperCase())}
                      placeholder="e.g. RKCLASS2026"
                      disabled={loading}
                      className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-xs font-mono tracking-wider text-white placeholder-neutral-500 outline-none focus:border-neutral-600 transition"
                      autoFocus
                    />
                    <p className="text-[11px] text-neutral-500">
                      Check your classroom WhatsApp group or ask your instructor.
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !passkey.trim()}
                    className="w-full py-2.5 rounded-xl bg-neutral-100 hover:bg-white text-neutral-900 disabled:opacity-40 text-xs font-semibold transition cursor-pointer shadow-sm mt-1"
                  >
                    {loading ? "Verifying..." : "Unlock Workspace"}
                  </button>
                </form>
              )}

              {/* TAB 2: Request Approval Form */}
              {activeTab === "request" && (
                <form onSubmit={handleRequestVerification} className="space-y-3 pt-1">
                  <div className="space-y-1">
                    <label className="text-xs text-neutral-300 font-medium">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={formData.studentName}
                      onChange={(e) =>
                        setFormData((p) => ({ ...p, studentName: e.target.value }))
                      }
                      placeholder="Your full name"
                      required
                      disabled={loading}
                      className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-500 outline-none focus:border-neutral-600 transition"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-neutral-300 font-medium">
                      Phone Number / WhatsApp
                    </label>
                    <input
                      type="tel"
                      value={formData.contact}
                      onChange={(e) =>
                        setFormData((p) => ({ ...p, contact: e.target.value }))
                      }
                      placeholder="e.g. +91 98765 43210"
                      required
                      disabled={loading}
                      className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-500 outline-none focus:border-neutral-600 transition"
                    />
                    <p className="text-[11px] text-neutral-500">
                      Used by instructor to verify enrollment.
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !formData.studentName.trim() || !formData.contact.trim()}
                    className="w-full py-2.5 rounded-xl bg-neutral-100 hover:bg-white text-neutral-900 disabled:opacity-40 text-xs font-semibold transition cursor-pointer shadow-sm mt-1"
                  >
                    {loading ? "Submitting..." : "Submit Verification Request"}
                  </button>
                </form>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-2.5 bg-neutral-950 border-t border-neutral-800/80 flex items-center justify-between text-[10px] text-neutral-500">
          <span>RK Coaching Classes</span>
          <span>Balotra, Rajasthan</span>
        </div>
      </div>
    </div>
  );
}
