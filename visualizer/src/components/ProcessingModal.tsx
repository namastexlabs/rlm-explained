'use client';

import { useEffect, useRef } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { MarkdownContent } from './MarkdownContent';
import { useTranslation } from '@/lib/i18n';

interface CodeResult {
  code: string;
  result: unknown;
}

interface EnrichedIteration {
  type?: string;
  iteration?: number;
  timestamp?: string;
  prompt?: Array<{ role: string; content: string }>;
  response?: string;
  code_blocks?: Array<{
    code: string;
    result?: {
      stdout?: string;
      stderr?: string;
      locals?: Record<string, unknown>;
      execution_time?: number;
      rlm_calls?: Array<{
        prompt: string | Record<string, unknown>;
        response: string;
        execution_time: number;
      }>;
    };
  }>;
  final_answer?: string | [string, string] | null;
  iteration_time?: number | null;
  education?: {
    phase: string;
    phaseIcon: string;
    phaseTitle: string;
    phaseExplanation: string;
    phaseImportance: string;
    whatHappened: string;
    codeAnnotations: Array<{
      line: number;
      explanation: string;
      importance: string;
    }>;
  };
}

interface PhaseInfo {
  icon: string;
  title: string;
  narrator: string;
  insight: string;
}

interface ProcessingModalProps {
  isOpen: boolean;
  onCancel: () => void;
  streamingResponse: string;
  currentIteration: number;
  iterations: EnrichedIteration[];
  codeResults: CodeResult[];
  phaseInfo: PhaseInfo;
}

export function ProcessingModal({
  isOpen,
  onCancel,
  streamingResponse,
  currentIteration,
  iterations,
  codeResults,
  phaseInfo,
}: ProcessingModalProps) {
  const { t } = useTranslation();
  const scrollEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll when new content arrives
  useEffect(() => {
    if (isOpen) {
      scrollEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isOpen, iterations.length, streamingResponse, codeResults.length]);

  return (
    <Dialog.Root open={isOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-in fade-in-0 duration-200" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-2xl max-h-[85vh] bg-background border border-border rounded-lg shadow-xl overflow-hidden animate-in fade-in-0 zoom-in-95 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border bg-gradient-to-r from-primary/10 to-accent/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="text-xl animate-pulse">{phaseInfo.icon}</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <Dialog.Title className="text-lg font-semibold">
                    {phaseInfo.title}
                  </Dialog.Title>
                  <Badge variant="outline" className="font-mono">
                    {t('processor.step', { number: iterations.length + 1 })}
                  </Badge>
                </div>
                <Dialog.Description className="text-sm text-muted-foreground">
                  {phaseInfo.narrator}
                </Dialog.Description>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={onCancel}>
              {t('processor.cancel')}
            </Button>
          </div>

          {/* Scrollable content */}
          <div className="overflow-y-auto max-h-[calc(85vh-80px)] p-6 space-y-4">
            {/* Educational Insight */}
            <div className="flex items-start gap-3 p-4 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50">
              <span className="text-lg">💡</span>
              <p className="text-sm text-amber-900 dark:text-amber-100">
                {phaseInfo.insight}
              </p>
            </div>

            {/* Completed Iterations Timeline */}
            {iterations.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-muted-foreground">
                    {t('processor.stepsCompleted')}
                  </p>
                  <Badge variant="secondary" className="font-mono">
                    {iterations.length === 1
                      ? t('processor.steps', { count: iterations.length })
                      : t('processor.stepsPlural', { count: iterations.length })}
                  </Badge>
                </div>

                {/* Linear timeline of iterations */}
                <div className="space-y-3">
                  {iterations.map((iter, i) => {
                    const hasCode = iter.code_blocks && iter.code_blocks.length > 0;
                    const hasSubLM = iter.code_blocks?.some(
                      b => b.result?.rlm_calls && b.result.rlm_calls.length > 0
                    );
                    const subLMCount = iter.code_blocks?.reduce(
                      (acc, b) => acc + (b.result?.rlm_calls?.length || 0), 0
                    ) || 0;

                    return (
                      <div
                        key={i}
                        className="p-3 rounded-lg bg-muted/50 border border-border/50 space-y-2"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-lg">
                            {hasSubLM ? '🤖' : hasCode ? '📝' : '🔍'}
                          </span>
                          <span className="font-medium text-sm">
                            {t('processor.step', { number: i + 1 })}
                          </span>
                          {hasCode && (
                            <Badge variant="outline" className="text-xs">
                              {t('iterationSummary.code')}
                            </Badge>
                          )}
                          {subLMCount > 0 && (
                            <Badge variant="outline" className="text-xs">
                              {subLMCount === 1
                                ? t('iterationSummary.helper', { count: subLMCount })
                                : t('iterationSummary.helpers', { count: subLMCount })}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {hasSubLM
                            ? (subLMCount === 1
                                ? t('iterationSummary.askedHelpers', { count: subLMCount })
                                : t('iterationSummary.askedHelpersPlural', { count: subLMCount }))
                            : hasCode
                              ? t('iterationSummary.executedCode')
                              : t('iterationSummary.explored')}
                        </p>
                        {/* Show code snippet if present */}
                        {hasCode && iter.code_blocks![0].code && (
                          <div className="mt-2 p-2 rounded bg-background border border-border/30">
                            <pre className="text-xs font-mono text-muted-foreground overflow-hidden whitespace-pre-wrap line-clamp-3">
                              {iter.code_blocks![0].code.slice(0, 200)}
                              {iter.code_blocks![0].code.length > 200 && '...'}
                            </pre>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Current Streaming Response */}
            {streamingResponse && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm animate-pulse">💭</span>
                  <p className="text-sm font-medium">
                    {t('processor.rlmThinking')}
                    {currentIteration > 0 && (
                      <span className="ml-2 text-muted-foreground">
                        ({t('processor.step', { number: currentIteration })})
                      </span>
                    )}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
                  <MarkdownContent content={streamingResponse} className="text-sm" />
                </div>
              </div>
            )}

            {/* Code Execution Results */}
            {codeResults.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm">⚡</span>
                  <p className="text-sm font-medium">
                    {t('processor.codeExecuted') || 'Code executed'}
                  </p>
                </div>
                <div className="space-y-2">
                  {codeResults.map((cr, idx) => (
                    <div key={idx} className="p-3 rounded-lg bg-muted/50 border border-border/30">
                      <pre className="text-xs font-mono text-muted-foreground overflow-hidden whitespace-pre-wrap line-clamp-3">
                        {cr.code.slice(0, 200)}
                        {cr.code.length > 200 && '...'}
                      </pre>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Scroll anchor for auto-scroll */}
            <div ref={scrollEndRef} />
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
