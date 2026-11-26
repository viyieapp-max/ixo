import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = {
    hasError: false,
    message: '',
  };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      message: error.message || 'Terjadi kesalahan saat memproses data.',
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Application ErrorBoundary:', error, info);
  }

  private handleReload = () => {
    this.setState({ hasError: false, message: '' });
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    let parsedSummary = this.state.message;
    try {
      const parsed = JSON.parse(this.state.message) as {
        error?: string;
        operationType?: string;
        path?: string;
      };
      if (parsed?.error) {
        parsedSummary = `${parsed.error}${parsed.path ? ` (${parsed.operationType}: ${parsed.path})` : ''}`;
      }
    } catch {
      // Plain error message
    }

    return (
      <div className="min-h-screen bg-[#0D0303] text-[#EFF8FF] flex items-center justify-center p-6">
        <div className="max-w-md w-full rounded-2xl border border-[#FF0055]/45 bg-[#150A0B] p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FF0055]/15 border border-[#FF0055]/40 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-[#FF0055]" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-base font-bold text-[#EFF8FF]">
                Sinkronisasi Data Terganggu
              </h1>
              <p className="text-xs text-[#EFF8FF]/65">
                Silakan muat ulang halaman untuk mencoba kembali.
              </p>
            </div>
          </div>

          <p className="text-xs text-[#EFF8FF]/80 bg-[#0D0303] border border-[#EFF8FF]/10 rounded-xl p-3 break-words">
            {parsedSummary}
          </p>

          <button
            type="button"
            onClick={this.handleReload}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#BBEF1F] text-[#0D0303] font-bold text-sm px-4 py-2.5 hover:brightness-105 transition"
          >
            <RotateCcw className="w-4 h-4" aria-hidden="true" />
            Muat Ulang Aplikasi
          </button>
        </div>
      </div>
    );
  }
}
