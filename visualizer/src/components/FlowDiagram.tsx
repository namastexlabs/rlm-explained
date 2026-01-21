'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';

// Animated split comparison showing Traditional AI vs RLM
export function FlowDiagram() {
  const { t } = useTranslation();
  const [contextFill, setContextFill] = useState(0);
  const [showHelpers, setShowHelpers] = useState(false);

  // Animate the context window filling
  useEffect(() => {
    const fillInterval = setInterval(() => {
      setContextFill((prev) => {
        if (prev >= 100) {
          // Reset and restart the animation
          setTimeout(() => setContextFill(0), 2000);
          return 100;
        }
        return prev + 2;
      });
    }, 100);

    return () => clearInterval(fillInterval);
  }, []);

  // Animate helper AIs appearing
  useEffect(() => {
    const helperInterval = setInterval(() => {
      setShowHelpers((prev) => !prev);
    }, 3000);

    return () => clearInterval(helperInterval);
  }, []);

  // Get status text and color based on context fill
  const getContextStatus = () => {
    if (contextFill < 40) return { text: t('flowDiagram.contextFilling'), color: 'text-emerald-600 dark:text-emerald-400' };
    if (contextFill < 70) return { text: t('flowDiagram.detailsLost'), color: 'text-amber-600 dark:text-amber-400' };
    return { text: t('flowDiagram.performanceDropping'), color: 'text-red-600 dark:text-red-400' };
  };

  const getBarColor = () => {
    if (contextFill < 40) return 'bg-emerald-500';
    if (contextFill < 70) return 'bg-amber-500';
    return 'bg-red-500';
  };

  const getAIExpression = () => {
    if (contextFill < 40) return '🙂';
    if (contextFill < 70) return '😐';
    return '😵';
  };

  const status = getContextStatus();

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* Left Side - Traditional AI */}
      <div className="bg-gradient-to-br from-muted/50 to-muted/30 rounded-xl p-6 border border-border">
        <h3 className="text-sm font-semibold text-muted-foreground mb-4 text-center uppercase tracking-wide">
          {t('flowDiagram.traditionalAI')}
        </h3>

        <div className="flex flex-col items-center gap-4">
          {/* AI with expression */}
          <div className="relative">
            <div className={cn(
              "w-20 h-20 rounded-2xl flex items-center justify-center text-4xl transition-all duration-500",
              "bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700",
              "border-2",
              contextFill < 40 ? "border-emerald-300 dark:border-emerald-700" :
              contextFill < 70 ? "border-amber-300 dark:border-amber-700" :
              "border-red-300 dark:border-red-700 animate-pulse"
            )}>
              {getAIExpression()}
            </div>
            {contextFill >= 70 && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-ping" />
            )}
          </div>

          {/* Context Window Bar */}
          <div className="w-full max-w-[180px]">
            <div className="text-xs text-muted-foreground mb-1 text-center">{t('flowDiagram.contextWindow')}</div>
            <div className="h-6 bg-muted rounded-full overflow-hidden border border-border relative">
              <div
                className={cn(
                  "h-full transition-all duration-100 rounded-full",
                  getBarColor()
                )}
                style={{ width: `${contextFill}%` }}
              />
              <div className="absolute inset-0 flex items-center justify-center text-[10px] font-mono text-foreground/70">
                {t('flowDiagram.full', { percent: contextFill })}
              </div>
            </div>
          </div>

          {/* Status Text */}
          <p className={cn("text-sm font-medium h-5 transition-colors duration-300", status.color)}>
            {status.text}
          </p>

          {/* Problem description */}
          <p className="text-xs text-muted-foreground text-center mt-2 px-2">
            {t('flowDiagram.traditionalDesc')}
          </p>
        </div>
      </div>

      {/* Right Side - RLM Solution */}
      <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl p-6 border border-primary/30">
        <h3 className="text-sm font-semibold text-primary mb-4 text-center uppercase tracking-wide">
          {t('flowDiagram.rlmSolution')}
        </h3>

        <div className="flex flex-col items-center gap-3">
          {/* Document + Question */}
          <div className="flex items-center gap-2 text-sm">
            <span className="text-lg">📄</span>
            <span className="text-muted-foreground">{t('flowDiagram.yourContent')}</span>
          </div>

          {/* Arrow down */}
          <svg className="w-4 h-4 text-primary" viewBox="0 0 16 16" fill="none">
            <path d="M8 2v10M4 8l4 4 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>

          {/* RLM Brain */}
          <div className="relative">
            <div className={cn(
              "w-16 h-16 rounded-xl flex flex-col items-center justify-center",
              "bg-gradient-to-br from-primary/30 to-primary/20 border-2 border-primary/50",
              "transition-transform duration-1000",
              showHelpers ? "scale-105" : "scale-100"
            )}>
              <span className="text-2xl">🧠</span>
              <span className="text-[9px] font-bold text-primary">RLM</span>
            </div>
            {/* Pulse effect */}
            <div className="absolute inset-0 rounded-xl bg-primary/20 animate-ping opacity-20" />
          </div>

          {/* "Explores with Code" label */}
          <span className="text-xs text-primary font-medium">{t('flowDiagram.exploresWithCode')}</span>

          {/* Branching arrows */}
          <svg className="w-32 h-6 text-primary/60" viewBox="0 0 128 24" fill="none">
            <path d="M64 0v8M64 8L24 20M64 8v12M64 8L104 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>

          {/* Helper AIs */}
          <div className="flex items-center gap-4">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={cn(
                  "flex flex-col items-center gap-1 transition-all duration-500",
                  showHelpers ? "opacity-100 translate-y-0" : "opacity-40 translate-y-1"
                )}
                style={{ transitionDelay: `${i * 100}ms` }}
              >
                <div className="relative">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-100 to-emerald-200 dark:from-emerald-900/50 dark:to-emerald-800/50 border border-emerald-300 dark:border-emerald-700 flex items-center justify-center">
                    <span className="text-lg">🤖</span>
                  </div>
                  {/* Fresh context indicator */}
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full flex items-center justify-center">
                    <span className="text-[6px] text-white">✓</span>
                  </div>
                </div>
                <span className="text-[9px] text-muted-foreground">{t('flowDiagram.fresh')}</span>
              </div>
            ))}
          </div>

          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
            {t('flowDiagram.helperAIs')}
          </span>

          {/* Converging arrows */}
          <svg className="w-32 h-6 text-emerald-500/60" viewBox="0 0 128 24" fill="none">
            <path d="M24 4L64 16M64 4v12M104 4L64 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>

          {/* Final Answer */}
          <div className="flex items-center gap-2 bg-emerald-100 dark:bg-emerald-900/30 px-4 py-2 rounded-lg border border-emerald-300 dark:border-emerald-700">
            <span className="text-lg">✅</span>
            <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">{t('flowDiagram.accurateAnswer')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Compact inline version for headers
export function FlowDiagramInline() {
  const { t } = useTranslation();
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-amber-600 dark:text-amber-400">Question</span>
      <span className="text-muted-foreground">→</span>
      <span className="text-primary font-medium">RLM Thinks</span>
      <span className="text-muted-foreground">→</span>
      <span className="text-emerald-600 dark:text-emerald-400">Answer</span>
    </div>
  );
}

// Example question suggestions
export function ExampleQuestions({
  onSelect,
  disabled = false,
}: {
  onSelect: (question: string) => void;
  disabled?: boolean;
}) {
  const { t } = useTranslation();

  const examples = [
    t('exampleQuestions.summarize'),
    t('exampleQuestions.decisions'),
    t('exampleQuestions.findings'),
    t('exampleQuestions.actionItems'),
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {examples.map((question, idx) => (
        <button
          key={idx}
          onClick={() => onSelect(question)}
          disabled={disabled}
          className={cn(
            'text-xs px-3 py-1.5 rounded-full border border-border',
            'hover:bg-muted hover:border-primary/30 transition-colors',
            'text-muted-foreground hover:text-foreground',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        >
          {question}
        </button>
      ))}
    </div>
  );
}
