import { useEffect } from "react";
import { AlertTriangle, RefreshCw, CheckCircle2 } from "lucide-react";

const VARIANTS = {
  danger: {
    icon: AlertTriangle,
    iconBg: "bg-rose-500/15",
    iconColor: "text-rose-400",
    buttonClass: "bg-rose-600 hover:bg-rose-500 text-white shadow-sm",
  },
  primary: {
    icon: RefreshCw,
    iconBg: "bg-red-500/15",
    iconColor: "text-red-400",
    buttonClass: "bg-gradient-to-r from-[#BA3C3C] to-[#E04D4D] hover:opacity-90 text-white shadow-md shadow-red-500/20 font-semibold",
  },
  neutral: {
    icon: CheckCircle2,
    iconBg: "bg-neutral-800",
    iconColor: "text-neutral-300",
    buttonClass: "bg-neutral-800 hover:bg-neutral-700 text-white shadow-sm font-semibold",
  },
};

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  loading = false,
  loadingText = "Processing...",
  variant = "danger",
  onCancel,
  onConfirm,
}) {
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e) => {
      if (e.key === "Escape" && !loading) {
        onCancel();
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, loading, onCancel]);

  if (!isOpen) {
    return null;
  }

  const {
    icon: Icon,
    iconBg,
    iconColor,
    buttonClass,
  } = VARIANTS[variant] ?? VARIANTS.danger;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 dark:bg-black/70 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
    >
      <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-[#121214] shadow-2xl text-slate-900 dark:text-neutral-100">
        <div className="flex items-start gap-4 p-6">
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconBg}`}
          >
            <Icon className={`h-5 w-5 ${iconColor}`} />
          </div>

          <div>
            <h2
              id="confirm-modal-title"
              className="text-base font-bold text-slate-900 dark:text-neutral-100"
            >
              {title}
            </h2>

            <p className="mt-1 text-xs text-slate-600 dark:text-neutral-300 leading-relaxed">
              {message}
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2.5 border-t border-slate-200 dark:border-neutral-800 px-6 py-3.5 bg-slate-50 dark:bg-[#0e0e12]/60 rounded-b-2xl">
          <button
            type="button"
            disabled={loading}
            onClick={() => {
              if (!loading) {
                onCancel();
              }
            }}
            className="rounded-xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-4 py-2 text-xs font-medium text-slate-700 dark:text-neutral-300 transition-colors hover:bg-slate-100 dark:hover:bg-neutral-800 hover:text-slate-900 dark:hover:text-white disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
          >
            {cancelText}
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={onConfirm}
            className={`rounded-xl px-4 py-2 text-xs font-semibold text-white transition-opacity duration-200 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer ${buttonClass}`}
          >
            {loading ? loadingText : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
