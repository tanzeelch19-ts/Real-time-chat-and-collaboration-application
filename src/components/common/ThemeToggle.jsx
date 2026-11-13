import { Moon, Sun } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import Button from '@/components/common/Button';
import { selectTheme, toggleTheme } from '@/features/ui/uiSlice';

export default function ThemeToggle() {
  const theme = useSelector(selectTheme);
  const dispatch = useDispatch();
  const isDark = theme === 'dark';

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      onClick={() => dispatch(toggleTheme())}
    >
      {isDark ? <Sun size={18} aria-hidden="true" /> : <Moon size={18} aria-hidden="true" />}
    </Button>
  );
}