import { render } from '@testing-library/react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import authReducer from '@/features/auth/authSlice';
import presenceReducer from '@/features/presence/presenceSlice';
import uiReducer from '@/features/ui/uiSlice';

export function makeTestStore(preloadedState) {
  return configureStore({
    reducer: { auth: authReducer, ui: uiReducer, presence: presenceReducer },
    preloadedState,
  });
}

/**
 * Renders a component with a fresh Redux store, a query client, and a memory router.
 */
export function renderWithProviders(ui, { route = '/', preloadedState, store = makeTestStore(preloadedState) } = {}) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  return {
    store,
    ...render(
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>
          <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
        </QueryClientProvider>
      </Provider>,
    ),
  };
}