/**
 * Centered card layout shared by login, register, and password screens.
 */
export default function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-slate-50 px-4 py-12 dark:bg-slate-950">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <div
            aria-hidden="true"
            className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-600 text-lg font-bold text-white"
          >
            C
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {subtitle && <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 dark:border-slate-800 dark:bg-slate-900">
          {children}
        </div>

        {footer && (
          <div className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">{footer}</div>
        )}
      </div>
    </main>
  );
}
