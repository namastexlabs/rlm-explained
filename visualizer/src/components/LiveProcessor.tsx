'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileUploader } from './FileUploader';
import { ExampleQuestions } from './FlowDiagram';
import { LLMSettingsModal } from './LLMSettingsModal';
import { ProcessingModal } from './ProcessingModal';
import { useTranslation } from '@/lib/i18n';
import { RLMLogFile, RLMIteration, RLMConfigMetadata, UsageSummary } from '@/lib/types';
import { computeMetadata } from '@/lib/parse-logs';

// API configuration
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface EnrichedIteration extends RLMIteration {
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

interface LiveProcessorProps {
  onComplete: (logFile: RLMLogFile) => void;
}

export function LiveProcessor({ onComplete }: LiveProcessorProps) {
  const { t } = useTranslation();

  // Phase configuration with educational content
  const PHASE_CONFIG: Record<string, {
    icon: string;
    title: string;
    narrator: string;
    insight: string;
  }> = {
    exploring: {
      icon: '🔍',
      title: t('phases.exploring.title'),
      narrator: t('phases.exploring.narrator'),
      insight: t('phases.exploring.insight'),
    },
    analyzing: {
      icon: '📊',
      title: t('phases.analyzing.title'),
      narrator: t('phases.analyzing.narrator'),
      insight: t('phases.analyzing.insight'),
    },
    synthesizing: {
      icon: '🔗',
      title: t('phases.synthesizing.title'),
      narrator: t('phases.synthesizing.narrator'),
      insight: t('phases.synthesizing.insight'),
    },
    answering: {
      icon: '✅',
      title: t('phases.answering.title'),
      narrator: t('phases.answering.narrator'),
      insight: t('phases.answering.insight'),
    },
  };

  // Document state (persisted in session)
  const [document, setDocument] = useState<{
    fileName: string;
    content: string;
    fileType: string;
  } | null>(null);

  // Question state
  const [question, setQuestion] = useState('');

  // Settings state
  const [maxIterations, setMaxIterations] = useState(10);
  const [selectedBackend, setSelectedBackend] = useState('cerebras');
  const [apiKey, setApiKey] = useState('');
  const [showLLMModal, setShowLLMModal] = useState(false);

  // Processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [iterations, setIterations] = useState<EnrichedIteration[]>([]);
  const [config, setConfig] = useState<RLMConfigMetadata | null>(null);
  const [currentPhase, setCurrentPhase] = useState<string>('exploring');
  const [error, setError] = useState<string | null>(null);

  // Real-time streaming state
  const [streamingResponse, setStreamingResponse] = useState('');
  const [currentIteration, setCurrentIteration] = useState(0);
  const [codeResults, setCodeResults] = useState<Array<{ code: string; result: unknown }>>([]);

  // Refs to avoid stale closures in async handlers
  const iterationsRef = useRef<EnrichedIteration[]>([]);
  const configRef = useRef<RLMConfigMetadata | null>(null);
  const streamingResponseRef = useRef('');

  // Abort controller for canceling requests
  const abortControllerRef = useRef<AbortController | null>(null);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const handleDocumentLoaded = useCallback((fileName: string, content: string, fileType: string) => {
    setDocument({ fileName, content, fileType });
    setIterations([]);
    setError(null);
  }, []);

  const handleProcess = useCallback(async () => {
    if (!document || !question.trim()) return;

    setIsProcessing(true);
    setIterations([]);
    iterationsRef.current = [];
    configRef.current = null;
    setError(null);
    setCurrentPhase('exploring');

    // Reset streaming state
    setStreamingResponse('');
    streamingResponseRef.current = '';
    setCurrentIteration(0);
    setCodeResults([]);

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch(`${API_BASE}/api/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transcript: document.content,
          question: question,
          max_iterations: maxIterations,
          backend: selectedBackend,
          api_key: apiKey || undefined,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Parse SSE events
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));

              if (data.type === 'complete') {
                // Build final log file using refs (not stale state)
                const finalIterations = [...iterationsRef.current];
                const logFile: RLMLogFile = {
                  fileName: `live_${document.fileName}`,
                  filePath: '',
                  iterations: finalIterations.map(normalizeIteration),
                  metadata: computeMetadata(finalIterations.map(normalizeIteration)),
                  config: configRef.current || getDefaultConfig(),
                };
                onComplete(logFile);
              } else if (data.type === 'token') {
                // Real-time token streaming - append to current response
                const newToken = data.content || '';
                streamingResponseRef.current += newToken;
                setStreamingResponse(streamingResponseRef.current);

                // Update current iteration number
                if (data.iteration && data.iteration !== currentIteration) {
                  setCurrentIteration(data.iteration);
                }
              } else if (data.type === 'code_result') {
                // Code execution result - add to list
                setCodeResults(prev => [...prev, {
                  code: data.code || '',
                  result: data.result || {},
                }]);
              } else if (data.type === 'metadata') {
                const newConfig = {
                  root_model: data.root_model || 'gpt-oss-120b',
                  max_depth: data.max_depth || null,
                  max_iterations: data.max_iterations || null,
                  backend: data.backend || 'cerebras',
                  backend_kwargs: data.backend_kwargs || null,
                  environment_type: data.environment_type || 'local',
                  environment_kwargs: data.environment_kwargs || null,
                  other_backends: data.other_backends || null,
                };
                setConfig(newConfig);
                configRef.current = newConfig;
              } else if (data.type === 'iteration') {
                const iteration = normalizeEnrichedIteration(data);
                // Update both state and ref
                iterationsRef.current = [...iterationsRef.current, iteration];
                setIterations(prev => [...prev, iteration]);

                // Clear streaming state for next iteration
                setStreamingResponse('');
                streamingResponseRef.current = '';
                setCodeResults([]);

                // Update phase display
                if (iteration.education) {
                  setCurrentPhase(iteration.education.phase);
                }
              } else if (data.type === 'error') {
                setError(data.error || 'An error occurred');
              }
            } catch (e) {
              console.error('Failed to parse SSE event:', e);
            }
          }
        }
      }
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        setError(err.message);
      }
    } finally {
      setIsProcessing(false);
      abortControllerRef.current = null;
    }
  }, [document, question, maxIterations, selectedBackend, apiKey, onComplete]);

  const handleCancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsProcessing(false);
    }
  }, []);

  const handleReset = useCallback(() => {
    setDocument(null);
    setQuestion('');
    setIterations([]);
    setConfig(null);
    setCurrentPhase('exploring');
    setError(null);
  }, []);

  const handleExampleSelect = useCallback((q: string) => {
    setQuestion(q);
  }, []);

  const handleMaxIterationsChange = useCallback((value: number) => {
    setMaxIterations(value);
    // Show LLM modal when iterations > 10 to confirm provider choice
    if (value > 10 && !apiKey) {
      setShowLLMModal(true);
    }
  }, [apiKey]);

  const handleLLMConfirm = useCallback((backend: string, key: string) => {
    setSelectedBackend(backend);
    setApiKey(key);
    setShowLLMModal(false);
  }, []);

  const handleLLMModalClose = useCallback(() => {
    // If closing without providing API key, reset to 10 iterations
    if (!apiKey && maxIterations > 10) {
      setMaxIterations(10);
    }
    setShowLLMModal(false);
  }, [apiKey, maxIterations]);

  const phaseInfo = PHASE_CONFIG[currentPhase] || PHASE_CONFIG.exploring;

  return (
    <div className="space-y-4">
      {/* Document Upload Section */}
      {!document ? (
        <FileUploader
          onFileLoaded={(fileName, content) => handleDocumentLoaded(fileName, content, 'txt')}
          onDocumentLoaded={handleDocumentLoaded}
          mode="documents"
          showPrivacyNotice={true}
        />
      ) : (
        <Card className="bg-muted/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="font-mono text-xs">
                  {document.fileType.toUpperCase()}
                </Badge>
                <span className="font-medium">{document.fileName}</span>
                <span className="text-sm text-muted-foreground">
                  {t('processor.characters', { count: document.content.length.toLocaleString() })}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReset}
                disabled={isProcessing}
              >
                {t('processor.changeFile')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Question Input */}
      {document && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <span className="text-primary">💬</span>
              {t('processor.askQuestion')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <textarea
              placeholder={t('processor.placeholder')}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="w-full p-4 border rounded-lg bg-background resize-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-base"
              rows={3}
              disabled={isProcessing}
            />

            {/* Example Questions */}
            {!question && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">{t('processor.tryOne')}</p>
                <ExampleQuestions onSelect={handleExampleSelect} disabled={isProcessing} />
              </div>
            )}

            {/* Max Iterations Settings */}
            <div className="flex items-center gap-4 pt-4 border-t">
              <label className="text-sm font-medium whitespace-nowrap">
                {t('processor.maxSteps') || 'Max Steps:'}
              </label>
              <input
                type="range"
                min="1"
                max="100"
                value={maxIterations}
                onChange={(e) => handleMaxIterationsChange(parseInt(e.target.value))}
                className="flex-1 h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                disabled={isProcessing}
              />
              <span className="text-sm font-mono w-8 text-right">{maxIterations}</span>

              {/* Backend indicator */}
              {selectedBackend !== 'cerebras' && (
                <Badge variant="outline" className="text-xs">
                  {selectedBackend}
                </Badge>
              )}
              {selectedBackend !== 'cerebras' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowLLMModal(true)}
                  disabled={isProcessing}
                  className="text-xs"
                >
                  {t('processor.changeLLM') || 'Change'}
                </Button>
              )}
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-3">
                <Button
                  onClick={handleProcess}
                  disabled={!question.trim() || isProcessing}
                  size="lg"
                  className="bg-primary hover:bg-primary/90"
                >
                  {isProcessing ? t('processor.processing') : t('processor.analyze')}
                </Button>
                {isProcessing && (
                  <Button variant="outline" onClick={handleCancel}>
                    {t('processor.cancel')}
                  </Button>
                )}
              </div>

              {iterations.length > 0 && !isProcessing && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setIterations([]);
                    handleProcess();
                  }}
                >
                  {t('processor.runAgain')}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Processing Modal */}
      <ProcessingModal
        isOpen={isProcessing}
        onCancel={handleCancel}
        streamingResponse={streamingResponse}
        currentIteration={currentIteration}
        iterations={iterations}
        codeResults={codeResults}
        phaseInfo={phaseInfo}
      />

      {/* Error Display */}
      {error && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 text-destructive">
              <span className="text-lg">⚠️</span>
              <div>
                <p className="font-medium">{t('processor.errorTitle')}</p>
                <p className="text-sm opacity-80">{error}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* LLM Settings Modal */}
      <LLMSettingsModal
        isOpen={showLLMModal}
        onClose={handleLLMModalClose}
        onConfirm={handleLLMConfirm}
        maxIterations={maxIterations}
      />
    </div>
  );
}

// Helper functions

function getDefaultConfig(): RLMConfigMetadata {
  return {
    root_model: 'gpt-oss-120b',
    max_depth: null,
    max_iterations: 30,
    backend: 'cerebras',
    backend_kwargs: null,
    environment_type: 'local',
    environment_kwargs: null,
    other_backends: null,
  };
}

function normalizeIteration(iter: EnrichedIteration): RLMIteration {
  return {
    type: 'iteration',
    iteration: iter.iteration || 0,
    timestamp: iter.timestamp || new Date().toISOString(),
    prompt: iter.prompt || [],
    response: iter.response || '',
    code_blocks: iter.code_blocks || [],
    final_answer: iter.final_answer || null,
    iteration_time: iter.iteration_time || null,
  };
}

function normalizeEnrichedIteration(data: Record<string, unknown>): EnrichedIteration {
  return {
    type: 'iteration',
    iteration: (data.iterationNumber || data.iteration || 0) as number,
    timestamp: (data.timestamp || new Date().toISOString()) as string,
    prompt: (data.prompt || []) as Array<{ role: string; content: string }>,
    response: (data.response || '') as string,
    code_blocks: normalizeCodeBlocks((data.codeBlocks || data.code_blocks || []) as Array<Record<string, unknown>>),
    final_answer: (data.finalAnswer || data.final_answer || null) as string | [string, string] | null,
    iteration_time: (data.iterationTime || data.iteration_time || null) as number | null,
    education: data.education as EnrichedIteration['education'],
  };
}

function normalizeCodeBlocks(blocks: Array<Record<string, unknown>>): Array<{
  code: string;
  result: {
    stdout: string;
    stderr: string;
    locals: Record<string, unknown>;
    execution_time: number;
    rlm_calls: Array<{
      prompt: string | Record<string, unknown>;
      response: string;
      usage_summary?: UsageSummary;
      prompt_tokens?: number;
      completion_tokens?: number;
      execution_time: number;
    }>;
  };
}> {
  return blocks.map((block) => ({
    code: (block.code || '') as string,
    result: {
      stdout: (block.stdout || (block.result as Record<string, unknown>)?.stdout || '') as string,
      stderr: (block.stderr || (block.result as Record<string, unknown>)?.stderr || '') as string,
      locals: (block.locals || (block.result as Record<string, unknown>)?.locals || {}) as Record<string, unknown>,
      execution_time: (block.executionTime || block.execution_time || (block.result as Record<string, unknown>)?.execution_time || 0) as number,
      rlm_calls: ((block.subLmCalls || block.rlm_calls || (block.result as Record<string, unknown>)?.rlm_calls || []) as Array<Record<string, unknown>>).map((call) => ({
        prompt: call.prompt as string | Record<string, unknown>,
        response: (call.response || '') as string,
        // Pass through nested usage_summary if present
        usage_summary: (call.usage_summary || call.usageSummary) as UsageSummary | undefined,
        // Also keep legacy flat fields for backwards compatibility
        prompt_tokens: (call.prompt_tokens || call.promptTokens) as number | undefined,
        completion_tokens: (call.completion_tokens || call.completionTokens) as number | undefined,
        execution_time: (call.execution_time || call.executionTime || 0) as number,
      })),
    },
  }));
}
