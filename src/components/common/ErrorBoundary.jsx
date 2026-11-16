import { Component } from 'react';

export default class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <main
        role="alert"
        className="flex min-h-dvh flex-col items-center justify-center gap-4 p-6 text-center"
      >
        <h1 className="text-xl font-semibold">Something went wrong</h1>
        <p className="max-w-md text-sm text-slate-500 dark:text-slate-400">
          The page could not be displayed. Reload the page to try again.
        </p>
        <button
          type="button"
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white"
          onClick={() => window.location.reload()}
        >
          Reload
        </button>
      </main>
    );
  }
}
