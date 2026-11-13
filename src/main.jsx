import { StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import AppProviders from '@/app/providers';
import { router } from '@/app/router';
import PageLoader from '@/components/common/PageLoader';
import '@/styles/index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AppProviders>
      <Suspense fallback={<PageLoader label="Loading page" />}>
        <RouterProvider router={router} />
      </Suspense>
    </AppProviders>
  </StrictMode>,
);