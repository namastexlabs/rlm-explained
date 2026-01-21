'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useLocale, Locale } from '@/lib/i18n';

const LOCALE_CONFIG: Record<Locale, { flag: string; label: string }> = {
  en: { flag: '🇺🇸', label: 'English' },
  pt: { flag: '🇧🇷', label: 'Português' },
  es: { flag: '🇪🇸', label: 'Español' },
};

export function LocaleSwitcher() {
  const { locale, setLocale, t } = useLocale();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button variant="ghost" size="sm" className="w-8 h-8 p-0">
        <span className="sr-only">{t('locale.toggle')}</span>
      </Button>
    );
  }

  const currentConfig = LOCALE_CONFIG[locale];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="w-8 h-8 p-0 hover:bg-primary/10"
        >
          <span className="text-lg">{currentConfig.flag}</span>
          <span className="sr-only">{t('locale.toggle')}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[140px]">
        {(Object.keys(LOCALE_CONFIG) as Locale[]).map((loc) => {
          const config = LOCALE_CONFIG[loc];
          return (
            <DropdownMenuItem
              key={loc}
              onClick={() => setLocale(loc)}
              className="flex items-center gap-2 cursor-pointer"
            >
              <span className="text-lg">{config.flag}</span>
              <span className={locale === loc ? 'font-medium' : ''}>
                {config.label}
              </span>
              {locale === loc && (
                <span className="ml-auto text-primary">✓</span>
              )}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
