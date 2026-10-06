import React from "react";
import { AlertTriangle, RefreshCw, LayoutDashboard, LogIn } from "lucide-react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("[StudyBuddy ErrorBoundary] Caught runtime error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoDashboard = () => {
    window.location.href = "/dashboard";
  };

  handleResetSession = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return typeof this.props.fallback === "function"
          ? this.props.fallback(this.state.error, this.handleReset)
          : this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-[#030005] text-white flex items-center justify-center p-4 sm:p-6 select-none">
          <div className="w-full max-w-lg rounded-2xl border border-red-500/30 bg-[#121214] p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0 shadow-sm">
                <AlertTriangle className="w-6 h-6 text-red-400" />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg font-bold text-neutral-100 tracking-tight">
                  {this.props.title || "Something went wrong"}
                </h1>
                <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                  StudyBuddy encountered an unexpected error while rendering this page.
                </p>
              </div>
            </div>

            {/* Error Message Snippet */}
            <div className="rounded-xl border border-neutral-800 bg-[#0E0E12] p-4 font-mono text-xs text-red-400 overflow-x-auto max-h-48 whitespace-pre-wrap">
              {this.state.error?.message || this.state.error?.toString() || "Unknown error"}
              {this.state.errorInfo?.componentStack && (
                <div className="mt-3 pt-3 border-t border-neutral-800/80 text-[10px] text-neutral-500">
                  {this.state.errorInfo.componentStack.slice(0, 500)}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between gap-2.5 pt-2 flex-wrap">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={this.handleGoDashboard}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-neutral-800 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 text-xs font-medium transition cursor-pointer"
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  <span>Dashboard</span>
                </button>
                <button
                  type="button"
                  onClick={this.handleResetSession}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-neutral-800 bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-red-400 text-xs font-medium transition cursor-pointer"
                  title="Clear session and return to login"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Re-login</span>
                </button>
              </div>

              <button
                type="button"
                onClick={this.handleReload}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#BA3C3C] to-[#E04D4D] hover:opacity-90 text-white text-xs font-semibold transition cursor-pointer shadow-md shadow-red-500/20"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reload Page</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
