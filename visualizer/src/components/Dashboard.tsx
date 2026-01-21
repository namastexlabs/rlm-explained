'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { StoryView } from './StoryView';
import { LiveProcessor } from './LiveProcessor';
import { FlowDiagram } from './FlowDiagram';
import { ThemeToggle } from './ThemeToggle';
import { LocaleSwitcher } from './LocaleSwitcher';
import { Logo } from './Logo';
import { useTranslation } from '@/lib/i18n';
import { RLMLogFile } from '@/lib/types';

export function Dashboard() {
  const [selectedLog, setSelectedLog] = useState<RLMLogFile | null>(null);
  const { t } = useTranslation();

  if (selectedLog) {
    return (
      <StoryView
        logFile={selectedLog}
        onBack={() => setSelectedLog(null)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Subtle background */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/3 to-transparent" />

      <div className="relative z-10">
        {/* Header */}
        <header className="border-b border-border">
          <div className="max-w-4xl mx-auto px-6 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Logo className="h-10 w-auto" />
                <div>
                  <h1 className="text-lg font-semibold tracking-tight">
                    <span className="text-primary">{t('app.title')}</span>
                    <span className="text-muted-foreground ml-2 font-normal">{t('app.subtitle')}</span>
                  </h1>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <LocaleSwitcher />
                <ThemeToggle />
              </div>
            </div>
          </div>
        </header>

        {/* Main Content - Single Column */}
        <main className="max-w-4xl mx-auto px-6 py-8">
          <div className="space-y-8">
            {/* Educational Intro - Context Rot Explanation */}
            <Card className="bg-gradient-to-br from-primary/5 via-background to-accent/5 border-primary/20">
              <CardContent className="p-8">
                <div className="space-y-6">
                  {/* The Problem */}
                  <div>
                    <h2 className="text-xl font-semibold mb-3 text-foreground">
                      {t('dashboard.problemTitle')}
                    </h2>
                    <div className="space-y-3 text-base text-muted-foreground leading-relaxed">
                      <p>
                        {t('dashboard.problemText1')}
                      </p>
                      {/* Note: HTML content from trusted translation files */}
                      <p dangerouslySetInnerHTML={{ __html: t('dashboard.problemText2') }} />
                    </div>
                  </div>

                  {/* The Solution */}
                  <div>
                    <h2 className="text-xl font-semibold mb-3 text-primary">
                      {t('dashboard.solutionTitle')}
                    </h2>
                    <div className="space-y-3 text-base text-muted-foreground leading-relaxed">
                      {/* Note: HTML content from trusted translation files */}
                      <p dangerouslySetInnerHTML={{ __html: t('dashboard.solutionText1') }} />
                      <p dangerouslySetInnerHTML={{ __html: t('dashboard.solutionText2') }} />
                    </div>
                  </div>

                </div>

                {/* Animated Comparison Diagram */}
                <div className="mt-8 pt-6 border-t border-border/50">
                  <FlowDiagram />
                </div>
              </CardContent>
            </Card>

            {/* Live Processor - The Main Action */}
            <div className="space-y-3">
              <h2 className="text-lg font-medium flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-mono">
                  1
                </span>
                {t('dashboard.tryIt')}
              </h2>
              <LiveProcessor onComplete={(logFile) => setSelectedLog(logFile)} />
            </div>

            {/* What to Expect - Condensed */}
            <Card className="border-dashed">
              <CardContent className="p-6">
                <h3 className="font-medium mb-4">{t('dashboard.whatYouSee')}</h3>
                <div className="grid sm:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-start gap-3">
                    <span className="text-xl">🔍</span>
                    <div>
                      <p className="font-medium">{t('dashboard.exploration')}</p>
                      <p className="text-muted-foreground">{t('dashboard.explorationDesc')}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-xl">📝</span>
                    <div>
                      <p className="font-medium">{t('dashboard.codeExecution')}</p>
                      <p className="text-muted-foreground">{t('dashboard.codeExecutionDesc')}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-xl">🤖</span>
                    <div>
                      <p className="font-medium">{t('dashboard.helperAIs')}</p>
                      <p className="text-muted-foreground">{t('dashboard.helperAIsDesc')}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-xl">✅</span>
                    <div>
                      <p className="font-medium">{t('dashboard.finalAnswer')}</p>
                      <p className="text-muted-foreground">{t('dashboard.finalAnswerDesc')}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-border mt-8">
          <div className="max-w-4xl mx-auto px-6 py-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
              {/* Left: Paper reference */}
              <span className="flex items-center gap-1.5">
                {t('app.paperRef')}{' '}
                <a
                  href="https://arxiv.org/abs/2512.24601"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  {t('app.paperTitle')}
                </a>
              </span>

              {/* Right: Namastex links */}
              <span className="flex items-center gap-3">
                <a
                  href="https://namastex.ai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary transition-colors"
                >
                  namastex.ai
                </a>
                <a
                  href="https://github.com/namastexlabs"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary transition-colors flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                  </svg>
                  namastexlabs
                </a>
              </span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
