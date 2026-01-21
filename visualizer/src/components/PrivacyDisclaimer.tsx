'use client';

import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';

interface PrivacyDisclaimerProps {
  className?: string;
  variant?: 'compact' | 'full';
}

export function PrivacyDisclaimer({ className, variant = 'compact' }: PrivacyDisclaimerProps) {
  const { t } = useTranslation();

  if (variant === 'full') {
    return (
      <div className={cn(
        "p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-lg",
        className
      )}>
        <div className="flex items-center gap-2 text-sm text-cyan-700 dark:text-cyan-300">
          <span className="text-lg">{t('privacy.title')}</span>
        </div>
        <p className="mt-2 text-xs text-cyan-600/80 dark:text-cyan-400/80">
          {t('privacy.full')}
        </p>
      </div>
    );
  }

  return (
    <div className={cn(
      "text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg border border-dashed",
      className
    )}>
      <span className="font-medium">{t('privacy.label')}</span> {t('privacy.compact')}
    </div>
  );
}
