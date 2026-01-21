'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { RLMLogFile, RLMIteration } from '@/lib/types';
import { SyntaxHighlight } from './SyntaxHighlight';
import { MarkdownContent } from './MarkdownContent';
import { useTranslation } from '@/lib/i18n';

// Fade-in component for final answer with markdown support
function FadeInMarkdown({ text, className }: { text: string; className?: string }) {
  return (
    <div className="animate-in fade-in-0 duration-500">
      <MarkdownContent content={text} className={className} />
    </div>
  );
}

interface StoryViewProps {
  logFile: RLMLogFile;
  onBack: () => void;
}

export function StoryView({ logFile, onBack }: StoryViewProps) {
  const { t } = useTranslation();
  const { iterations, metadata } = logFile;
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set());

  // Educational phase mappings
  const PHASE_INFO: Record<string, { title: string; icon: string; description: string }> = {
    exploring: {
      title: t('storyPhases.exploring.title'),
      icon: '🔍',
      description: t('storyPhases.exploring.description'),
    },
    analyzing: {
      title: t('storyPhases.analyzing.title'),
      icon: '📊',
      description: t('storyPhases.analyzing.description'),
    },
    synthesizing: {
      title: t('storyPhases.synthesizing.title'),
      icon: '🔗',
      description: t('storyPhases.synthesizing.description'),
    },
    answering: {
      title: t('storyPhases.answering.title'),
      icon: '✅',
      description: t('storyPhases.answering.description'),
    },
  };

  // Get educational insights for an iteration
  function getIterationInsight(iteration: RLMIteration, index: number): {
    phase: string;
    title: string;
    icon: string;
    explanation: string;
    insight: string;
  } {
    const hasCode = iteration.code_blocks && iteration.code_blocks.length > 0;
    const hasSubLM = iteration.code_blocks?.some(
      block => block.result?.rlm_calls && block.result.rlm_calls.length > 0
    );
    const hasFinalAnswer = iteration.final_answer !== null;

    // Determine phase based on content
    let phase = 'exploring';
    if (hasFinalAnswer) {
      phase = 'answering';
    } else if (hasSubLM) {
      phase = 'synthesizing';
    } else if (hasCode && index > 0) {
      phase = 'analyzing';
    }

    const phaseInfo = PHASE_INFO[phase];

    // Generate educational insight
    let insight = '';
    if (index === 0) {
      insight = t('storyInsights.first');
    } else if (hasSubLM) {
      insight = t('storyInsights.subLM');
    } else if (hasCode) {
      insight = t('storyInsights.code');
    } else {
      insight = t('storyInsights.default');
    }

    // Generate title based on content
    let title = phaseInfo.title;
    if (index === 0) {
      title = t('storyTitles.gettingStarted');
    } else if (hasFinalAnswer) {
      title = t('storyTitles.deliveringAnswer');
    } else if (hasSubLM) {
      title = t('storyTitles.askingForHelp');
    } else if (hasCode) {
      title = t('storyTitles.writingPlan');
    }

    return {
      phase,
      title,
      icon: phaseInfo.icon,
      explanation: phaseInfo.description,
      insight,
    };
  }

  const toggleStep = (index: number) => {
    setExpandedSteps(prev => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const expandAll = () => {
    setExpandedSteps(new Set(iterations.map((_, i) => i)));
  };

  const collapseAll = () => {
    setExpandedSteps(new Set());
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-3xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="text-muted-foreground hover:text-foreground"
            >
              ← {t('storyView.back')}
            </Button>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={expandAll}>
                {t('storyView.expandAll')}
              </Button>
              <Button variant="outline" size="sm" onClick={collapseAll}>
                {t('storyView.collapseAll')}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <ScrollArea className="h-[calc(100vh-73px)]">
        <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
          {/* Final Answer Card - Prominent at top */}
          <Card className="border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-accent/5 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-xl">
                  ✅
                </div>
                <div>
                  <h2 className="text-lg font-semibold">{t('storyView.finalAnswer')}</h2>
                  <p className="text-sm text-muted-foreground">
                    {t('storyView.analysisResult')}
                  </p>
                </div>
              </div>
              <div className="max-w-none">
                {metadata.finalAnswer ? (
                  <FadeInMarkdown text={metadata.finalAnswer} className="prose-lg" />
                ) : (
                  <p className="text-foreground leading-relaxed">{t('storyView.inProgress')}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Processing Statistics */}
          <div className="flex flex-wrap items-center justify-center gap-4 py-3 px-4 rounded-lg bg-muted/30 border border-border/50">
            <div className="flex items-center gap-1.5">
              <span className="text-cyan-500">◎</span>
              <span className="font-semibold text-cyan-600 dark:text-cyan-400">{metadata.totalIterations}</span>
              <span className="text-xs text-muted-foreground">{t('storyStats.iterations')}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-emerald-500">⟨⟩</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">{metadata.totalCodeBlocks}</span>
              <span className="text-xs text-muted-foreground">{t('storyStats.codeBlocks')}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-fuchsia-500">🤖</span>
              <span className="font-semibold text-fuchsia-600 dark:text-fuchsia-400">{metadata.totalSubLMCalls}</span>
              <span className="text-xs text-muted-foreground">{t('storyStats.helpers')}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-amber-500">⏱</span>
              <span className="font-semibold text-amber-600 dark:text-amber-400">{metadata.totalExecutionTime.toFixed(1)}s</span>
              <span className="text-xs text-muted-foreground">{t('storyStats.time')}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-purple-500">📊</span>
              <span className="font-semibold text-purple-600 dark:text-purple-400">{(metadata.totalPromptTokens + metadata.totalCompletionTokens).toLocaleString()}</span>
              <span className="text-xs text-muted-foreground">{t('storyStats.tokens')}</span>
            </div>
          </div>

          {/* Expand/Collapse Section Header */}
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <span className="text-primary">↓</span>
              {t('storyView.seeHow', { count: iterations.length })}
            </h3>
          </div>

          {/* Iteration Steps as Story */}
          <div className="space-y-4">
            {iterations.map((iteration, index) => {
              const info = getIterationInsight(iteration, index);
              const isExpanded = expandedSteps.has(index);
              const hasCode = iteration.code_blocks && iteration.code_blocks.length > 0;
              const subLMCalls = iteration.code_blocks?.flatMap(
                block => block.result?.rlm_calls || []
              ) || [];

              return (
                <Card
                  key={index}
                  className={cn(
                    'transition-all duration-200',
                    iteration.final_answer && 'border-primary/30 bg-primary/5'
                  )}
                >
                  <Collapsible open={isExpanded} onOpenChange={() => toggleStep(index)}>
                    <CollapsibleTrigger asChild>
                      <CardContent className="p-5 cursor-pointer hover:bg-muted/30 transition-colors">
                        <div className="flex items-start gap-4">
                          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-lg shrink-0">
                            {info.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-medium text-muted-foreground">
                                {t('storyView.step', { number: index + 1 })}
                              </span>
                              <h4 className="font-semibold">{info.title}</h4>
                              {hasCode && (
                                <Badge variant="outline" className="text-xs">
                                  {t('storyView.code')}
                                </Badge>
                              )}
                              {subLMCalls.length > 0 && (
                                <Badge variant="outline" className="text-xs">
                                  {subLMCalls.length === 1
                                    ? t('iterationSummary.helper', { count: subLMCalls.length })
                                    : t('iterationSummary.helpers', { count: subLMCalls.length })}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {info.explanation}
                            </p>
                          </div>
                          <div className="text-muted-foreground text-sm">
                            {isExpanded ? '▼' : '▶'}
                          </div>
                        </div>
                      </CardContent>
                    </CollapsibleTrigger>

                    <CollapsibleContent>
                      <div className="px-5 pb-5 pt-0 space-y-4">
                        {/* Educational Insight */}
                        <div className="flex items-start gap-3 p-4 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50">
                          <span className="text-lg">💡</span>
                          <p className="text-sm text-amber-900 dark:text-amber-100">
                            {info.insight}
                          </p>
                        </div>

                        {/* Code Blocks */}
                        {hasCode && (
                          <div className="space-y-3">
                            {iteration.code_blocks!.map((block, blockIdx) => (
                              <div key={blockIdx} className="space-y-2">
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <span className="font-mono">{'</>'}</span>
                                  {t('storyView.code')}
                                </div>
                                <div className="rounded-lg border border-border overflow-hidden">
                                  <div className="bg-muted/50 p-4 overflow-x-auto">
                                    <SyntaxHighlight code={block.code} />
                                  </div>
                                </div>

                                {/* Code Result */}
                                {block.result?.stdout && (
                                  <div className="rounded-lg border border-border overflow-hidden">
                                    <div className="bg-muted/30 px-3 py-1.5 border-b border-border">
                                      <span className="text-xs text-muted-foreground">
                                        {t('storyView.output')}
                                      </span>
                                    </div>
                                    <ScrollArea>
                                      <div className="p-3 bg-background">
                                        <pre className="text-sm font-mono whitespace-pre-wrap text-muted-foreground">
                                          {block.result.stdout}
                                        </pre>
                                      </div>
                                    </ScrollArea>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Sub-LM Calls - Explained as "Asking for Help" */}
                        {subLMCalls.length > 0 && (
                          <div className="space-y-3">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span>🤖</span>
                              {t('storyView.helperResponses', { count: subLMCalls.length })}
                            </div>
                            {subLMCalls.map((call, callIdx) => (
                              <Collapsible key={callIdx} defaultOpen={callIdx < 2}>
                                <div className="rounded-lg border border-border overflow-hidden">
                                  <CollapsibleTrigger asChild>
                                    <div className="bg-cyan-50 dark:bg-cyan-950/30 px-4 py-3 border-b border-border cursor-pointer hover:bg-cyan-100 dark:hover:bg-cyan-900/30 transition-colors">
                                      <div className="flex items-center justify-between">
                                        <p className="text-sm font-medium text-cyan-900 dark:text-cyan-100">
                                          {t('storyView.helperNumber', { number: callIdx + 1 })}
                                        </p>
                                        <span className="text-xs text-cyan-600 dark:text-cyan-400">
                                          {t('storyView.clickExpand')}
                                        </span>
                                      </div>
                                      <p className="text-sm text-cyan-800 dark:text-cyan-200 mt-1 line-clamp-2">
                                        {typeof call.prompt === 'string'
                                          ? call.prompt.slice(0, 150)
                                          : t('storyView.analyzingContent')}
                                        {typeof call.prompt === 'string' && call.prompt.length > 150 && '...'}
                                      </p>
                                    </div>
                                  </CollapsibleTrigger>
                                  <CollapsibleContent>
                                    <div className="bg-cyan-50/50 dark:bg-cyan-950/20 px-4 py-3 border-b border-border">
                                      <p className="text-xs font-medium text-cyan-700 dark:text-cyan-300 mb-2">
                                        {t('storyView.fullQuestion')}
                                      </p>
                                      <ScrollArea>
                                        <p className="text-sm text-cyan-800 dark:text-cyan-200 whitespace-pre-wrap">
                                          {typeof call.prompt === 'string'
                                            ? call.prompt
                                            : t('storyView.analyzingContent')}
                                        </p>
                                      </ScrollArea>
                                    </div>
                                    <div className="bg-background px-4 py-3">
                                      <p className="text-sm font-medium text-muted-foreground mb-2">
                                        {t('storyView.helperResponse')}
                                      </p>
                                      <ScrollArea>
                                        <MarkdownContent content={call.response} className="text-sm" />
                                      </ScrollArea>
                                    </div>
                                  </CollapsibleContent>
                                </div>
                              </Collapsible>
                            ))}
                          </div>
                        )}

                        {/* Response Summary */}
                        {iteration.response && !hasCode && !iteration.final_answer && (
                          <div className="rounded-lg border border-border p-4 bg-muted/20">
                            <p className="text-sm text-muted-foreground mb-2">
                              {t('storyView.rlmThinking')}
                            </p>
                            <ScrollArea>
                              <MarkdownContent content={iteration.response} className="text-sm" />
                            </ScrollArea>
                          </div>
                        )}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </Card>
              );
            })}
          </div>

          {/* Footer Summary */}
          <div className="text-center py-8 border-t border-border">
            <p className="text-sm text-muted-foreground">
              {t('storyView.footerSummary', { count: iterations.length })}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              {t('storyView.footerDifference')}
            </p>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
