'use client';

import { useTheme } from 'next-themes';
import Image from 'next/image';
import { useEffect, useState } from 'react';

export function Logo({ className = '' }: { className?: string }) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch by only rendering theme-dependent content after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  // File names are inverted: logo-dark.svg is for light theme, logo-light.svg is for dark theme
  const logoSrc = mounted && resolvedTheme === 'dark' ? '/logo-light.svg' : '/logo-dark.svg';

  return (
    <Image
      src={logoSrc}
      alt="Namastex Research Labs"
      width={120}
      height={60}
      className={className}
      priority
    />
  );
}
