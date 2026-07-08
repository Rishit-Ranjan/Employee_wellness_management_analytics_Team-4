import { useEffect, useMemo, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle() {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('wellness_theme');
    return saved === 'light' || saved === 'dark' ? saved : 'dark';
  });

  useEffect(() => {
    localStorage.setItem('wellness_theme', theme);
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const isLight = theme === 'light';

  const className = useMemo(
    () =>
      `fixed top-4 right-4 z-50 flex items-center gap-2 px-3 py-2 rounded-xl border shadow-sm cursor-pointer transition-all select-none ${
        isLight
          ? 'bg-white/95 border-zinc-200 text-black hover:bg-white'
          : 'bg-[#0a0a0a]/95 border-[#1a1a1a] text-[#e0e0e0] hover:bg-[#111]'
      }`,
    [isLight]
  );

  return (
    <button
      type="button"
      aria-label="Toggle theme"
      className={className}
      onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
    >
      {isLight ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
      <span className="text-xs font-semibold">{isLight ? 'Light' : 'Dark'}</span>
    </button>
  );
}

