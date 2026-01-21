'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';

interface Backend {
  id: string;
  name: string;
  description: string;
  requiresKey: boolean;
  keyPlaceholder?: string;
}

const BACKENDS: Backend[] = [
  {
    id: 'cerebras',
    name: 'Cerebras',
    description: 'GPT-OSS 120B, fast inference',
    requiresKey: true,
    keyPlaceholder: 'csk-...',
  },
  {
    id: 'openai',
    name: 'OpenAI',
    description: 'GPT-5 Nano, efficient',
    requiresKey: true,
    keyPlaceholder: 'sk-...',
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    description: 'Claude Haiku 4.5, fast',
    requiresKey: true,
    keyPlaceholder: 'sk-ant-...',
  },
  {
    id: 'gemini',
    name: 'Google Gemini',
    description: 'Gemini 3 Flash Preview',
    requiresKey: true,
    keyPlaceholder: 'AI...',
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    description: 'GPT-5 Nano via OpenRouter',
    requiresKey: true,
    keyPlaceholder: 'sk-or-...',
  },
];

interface LLMSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (backend: string, apiKey: string) => void;
  maxIterations: number;
}

export function LLMSettingsModal({
  isOpen,
  onClose,
  onConfirm,
  maxIterations,
}: LLMSettingsModalProps) {
  const { t } = useTranslation();
  const [selectedBackend, setSelectedBackend] = useState('cerebras');
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);

  const backend = BACKENDS.find((b) => b.id === selectedBackend);
  const canSubmit = apiKey.trim().length > 0;

  const handleConfirm = () => {
    onConfirm(selectedBackend, apiKey);
  };

  const handleBackendChange = (id: string) => {
    setSelectedBackend(id);
    setApiKey(''); // Clear API key when switching backends
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-xl">🤖</span>
            {t('llmModal.title') || 'Select LLM Provider'}
          </DialogTitle>
          <DialogDescription>
            {t('llmModal.description') ||
              `Running ${maxIterations} iterations requires selecting an LLM provider.`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Backend Selection */}
          <div className="space-y-3">
            <label className="text-sm font-medium">
              {t('llmModal.selectProvider') || 'Select Provider'}
            </label>
            <div className="grid gap-2">
              {BACKENDS.map((b) => (
                <button
                  key={b.id}
                  onClick={() => handleBackendChange(b.id)}
                  className={cn(
                    'flex items-center justify-between p-3 rounded-lg border text-left transition-colors',
                    selectedBackend === b.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50 hover:bg-muted/50'
                  )}
                >
                  <div className="flex-1">
                    <span className="font-medium">{b.name}</span>
                    <p className="text-sm text-muted-foreground">
                      {b.description}
                    </p>
                  </div>
                  <div
                    className={cn(
                      'w-4 h-4 rounded-full border-2 flex items-center justify-center',
                      selectedBackend === b.id
                        ? 'border-primary'
                        : 'border-muted-foreground/30'
                    )}
                  >
                    {selectedBackend === b.id && (
                      <div className="w-2 h-2 rounded-full bg-primary" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* API Key Input */}
          <div className="space-y-3">
            <label className="text-sm font-medium">
              {t('llmModal.apiKey') || 'API Key'}
            </label>
            <div className="relative">
              <Input
                type={showKey ? 'text' : 'password'}
                placeholder={backend?.keyPlaceholder || 'Enter your API key'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="pr-20"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
              >
                {showKey
                  ? t('llmModal.hide') || 'Hide'
                  : t('llmModal.show') || 'Show'}
              </button>
            </div>

            {/* Privacy Notice */}
            <div className="flex items-start gap-2 p-3 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800/50">
              <span className="text-sm">🔒</span>
              <p className="text-xs text-green-800 dark:text-green-200">
                {t('llmModal.privacyNotice') ||
                  'Your API key is processed in-memory only and never stored on our servers. It is sent directly to the provider for this session only.'}
              </p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t('llmModal.cancel') || 'Cancel'}
          </Button>
          <Button onClick={handleConfirm} disabled={!canSubmit}>
            {t('llmModal.continue') || 'Continue'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
