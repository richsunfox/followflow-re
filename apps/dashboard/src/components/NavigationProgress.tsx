'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

export default function NavigationProgress() {
  const pathname = usePathname();
  const [active, setActive] = useState(false);

  // Start bar when any internal link is clicked
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const a = (e.target as HTMLElement).closest('a');
      if (!a) return;
      const href = a.getAttribute('href');
      if (!href || href.startsWith('http') || href.startsWith('#') || href.startsWith('mailto')) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      setActive(true);
    }
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  // Hide bar when navigation completes
  useEffect(() => {
    setActive(false);
  }, [pathname]);

  if (!active) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[200] h-0.5 overflow-hidden pointer-events-none">
      <div className="h-full bg-indigo-500 animate-nav-progress" />
    </div>
  );
}
