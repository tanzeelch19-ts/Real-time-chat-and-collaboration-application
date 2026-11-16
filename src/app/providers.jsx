import { useEffect } from 'react';
import { Provider, useSelector } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { store } from '@/app/store';
import {
  DENSITY_KEY,
  FONT_KEY,
  THEME_KEY,
  selectDensity,
  selectFontSize,
  selectTheme,
} from '@/features/ui/uiSlice';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

/**
 * Applies theme, density, and text size to the document root, and saves them to localStorage.
 */
function AppearanceSync({ children }) {
  const theme = useSelector(selectTheme);
  const density = useSelector(selectDensity);
  const fontSize = useSelector(selectFontSize);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    root.style.colorScheme = theme;
    root.dataset.density = density;
    root.dataset.font = fontSize;
    try {
      localStorage.setItem(THEME_KEY, theme);
      localStorage.setItem(DENSITY_KEY, density);
      localStorage.setItem(FONT_KEY, fontSize);
    } catch {
      // Storage unavailable; the choices still apply for this session.
    }
  }, [theme, density, fontSize]);

  return <>{children}</>;
}

export default function AppProviders({ children }) {
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <AppearanceSync>{children}</AppearanceSync>
      </QueryClientProvider>
    </Provider>
  );
}
