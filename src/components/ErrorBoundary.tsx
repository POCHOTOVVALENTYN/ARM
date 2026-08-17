import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught React Error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex items-center justify-center p-6 font-sans">
          <div className="bg-white dark:bg-slate-900 border-2 border-rose-500 rounded-2xl shadow-2xl p-8 max-w-2xl w-full text-slate-900 dark:text-slate-100 space-y-6">
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-600 shrink-0">
                <AlertTriangle size={32} />
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
                  Виникла помилка відображення компонента
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  АРМ «Розклади» КП «Одесміськелектротранс»
                </p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 font-mono text-xs text-rose-600 dark:text-rose-400 overflow-x-auto">
              <p className="font-bold">{this.state.error?.toString()}</p>
              {this.state.errorInfo && (
                <pre className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 overflow-x-auto whitespace-pre-wrap">
                  {this.state.errorInfo.componentStack}
                </pre>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center space-x-2 shadow-sm transition-all cursor-pointer"
              >
                <RefreshCw size={14} />
                <span>Оновити сторінку</span>
              </button>

              <button
                type="button"
                onClick={this.handleGoHome}
                className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center space-x-2 border border-slate-300 dark:border-slate-700 transition-all cursor-pointer"
              >
                <Home size={14} />
                <span>На головну</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
