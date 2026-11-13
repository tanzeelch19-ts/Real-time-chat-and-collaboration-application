import { useCallback } from 'react';
import { Outlet } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import TopBar from '@/components/layout/TopBar';
import WorkspaceSidebar from '@/components/navigation/WorkspaceSidebar';
import { useRealtimeSync } from '@/features/realtime/useRealtimeSync';
import { selectSidebarOpen, setSidebarOpen } from '@/features/ui/uiSlice';

/**
 * Authenticated application frame: sidebar, top bar, and routed content.
 */
export default function AppShell() {
  const dispatch = useDispatch();
  const sidebarOpen = useSelector(selectSidebarOpen);
  const closeSidebar = useCallback(() => dispatch(setSidebarOpen(false)), [dispatch]);
  useRealtimeSync();

  return (
    <div className="flex h-dvh overflow-hidden">
      <a
        href="#main-content"
        className="sr-only z-50 rounded-md bg-white px-3 py-2 text-sm font-medium shadow focus:not-sr-only focus:fixed focus:left-3 focus:top-3 dark:bg-slate-800"
      >
        Skip to content
      </a>

      {sidebarOpen && (
        <div
          aria-hidden="true"
          className="fixed inset-0 z-30 bg-slate-950/50 md:hidden"
          onClick={closeSidebar}
        />
      )}

      <WorkspaceSidebar open={sidebarOpen} onClose={closeSidebar} />

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <main id="main-content" tabIndex={-1} className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
}