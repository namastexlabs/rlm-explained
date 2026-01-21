'use client';

import { useCallback, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { PrivacyDisclaimer } from './PrivacyDisclaimer';
import { useTranslation } from '@/lib/i18n';

// Supported file extensions
const SUPPORTED_EXTENSIONS = ['txt', 'md', 'pdf', 'jsonl'];

interface FileUploaderProps {
  onFileLoaded: (fileName: string, content: string) => void;
  onDocumentLoaded?: (fileName: string, content: string, fileType: string) => void;
  mode?: 'jsonl' | 'documents' | 'all';
  showPrivacyNotice?: boolean;
}

export function FileUploader({
  onFileLoaded,
  onDocumentLoaded,
  mode = 'all',
  showPrivacyNotice = true
}: FileUploaderProps) {
  const { t } = useTranslation();
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [pastedContent, setPastedContent] = useState('');

  const getAcceptedExtensions = () => {
    switch (mode) {
      case 'jsonl':
        return ['.jsonl'];
      case 'documents':
        return ['.txt', '.md', '.pdf'];
      default:
        return SUPPORTED_EXTENSIONS.map(ext => `.${ext}`);
    }
  };

  const handleFile = useCallback(async (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase();

    if (!ext || !SUPPORTED_EXTENSIONS.includes(ext)) {
      alert(t('fileUploader.unsupportedType', { types: getAcceptedExtensions().join(', ') }));
      return;
    }

    // Check mode restrictions
    if (mode === 'jsonl' && ext !== 'jsonl') {
      alert(t('fileUploader.uploadJsonlOnly'));
      return;
    }
    if (mode === 'documents' && ext === 'jsonl') {
      alert(t('fileUploader.uploadDocumentOnly'));
      return;
    }

    setIsLoading(true);
    try {
      if (ext === 'jsonl') {
        // Handle JSONL files (legacy visualization)
        const content = await file.text();
        onFileLoaded(file.name, content);
      } else if (ext === 'pdf') {
        // Handle PDF files - use pdf.js
        const arrayBuffer = await file.arrayBuffer();
        const pdfContent = await parsePDF(arrayBuffer);
        if (onDocumentLoaded) {
          onDocumentLoaded(file.name, pdfContent, 'pdf');
        } else {
          onFileLoaded(file.name, pdfContent);
        }
      } else {
        // Handle text files (.txt, .md)
        const content = await file.text();
        if (onDocumentLoaded) {
          onDocumentLoaded(file.name, content, ext);
        } else {
          onFileLoaded(file.name, content);
        }
      }
    } catch (error) {
      console.error('Error reading file:', error);
      alert(t('fileUploader.failedRead'));
    } finally {
      setIsLoading(false);
    }
  }, [onFileLoaded, onDocumentLoaded, mode, t]);

  // Simple PDF parser using pdf.js (loaded from CDN)
  async function parsePDF(arrayBuffer: ArrayBuffer): Promise<string> {
    // Dynamically import pdf.js
    const pdfjsLib = await import('pdfjs-dist');

    // Set worker source (using CDN)
    pdfjsLib.GlobalWorkerOptions.workerSrc =
      `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const textParts: string[] = [];

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .filter((item) => 'str' in item)
        .map((item) => (item as { str: string }).str)
        .join(' ');
      textParts.push(pageText);
    }

    return textParts.join('\n\n');
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  }, [handleFile]);

  const handlePastedSubmit = useCallback(() => {
    if (!pastedContent.trim()) return;

    if (onDocumentLoaded) {
      onDocumentLoaded('pasted-content.txt', pastedContent, 'txt');
    } else {
      onFileLoaded('pasted-content.txt', pastedContent);
    }
    setPastedContent('');
  }, [pastedContent, onDocumentLoaded, onFileLoaded]);

  const getUploadLabel = () => {
    switch (mode) {
      case 'jsonl':
        return t('fileUploader.uploadJsonl');
      case 'documents':
        return t('fileUploader.uploadDocument');
      default:
        return t('fileUploader.uploadFile');
    }
  };

  const getFormatHint = () => {
    switch (mode) {
      case 'jsonl':
        return t('fileUploader.supportsJsonl');
      case 'documents':
        return t('fileUploader.supportsDocuments');
      default:
        return t('fileUploader.supportsAll');
    }
  };

  return (
    <Card
      className={cn(
        'border-2 border-dashed transition-all duration-200',
        isDragging
          ? 'border-[oklch(0.65_0.18_145)] bg-[oklch(0.65_0.18_145/0.05)] scale-[1.01]'
          : 'border-[oklch(0.25_0.03_145)] hover:border-[oklch(0.5_0.12_145)]'
      )}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      <CardContent className="p-8">
        {showPrivacyNotice && mode !== 'jsonl' && (
          <PrivacyDisclaimer className="mb-4 text-left" />
        )}

        {/* Paste Content Section - only for documents mode */}
        {mode === 'documents' && (
          <>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2 text-left">
                {t('fileUploader.pasteContent')}
              </label>
              <textarea
                value={pastedContent}
                onChange={(e) => setPastedContent(e.target.value)}
                placeholder={t('fileUploader.pastePlaceholder')}
                className="w-full h-32 p-3 text-sm rounded-lg border border-[oklch(0.25_0.03_145)] bg-background resize-none focus:outline-none focus:border-[oklch(0.5_0.12_145)] focus:ring-1 focus:ring-[oklch(0.5_0.12_145)]"
              />
            </div>
            <Button
              onClick={handlePastedSubmit}
              disabled={!pastedContent.trim() || isLoading}
              size="sm"
              className="w-full bg-[oklch(0.55_0.15_145)] hover:bg-[oklch(0.6_0.17_145)] text-white disabled:opacity-50"
            >
              {isLoading ? t('processor.processing') : t('fileUploader.analyzeContent')}
            </Button>

            {/* OR Divider */}
            <div className="flex items-center my-6">
              <div className="flex-1 border-t border-[oklch(0.25_0.03_145)]" />
              <span className="px-4 text-xs text-muted-foreground uppercase tracking-wider">{t('fileUploader.or')}</span>
              <div className="flex-1 border-t border-[oklch(0.25_0.03_145)]" />
            </div>
          </>
        )}

        {/* File Upload Section */}
        <div className="text-center">
          <div className={cn(
            'w-14 h-14 mx-auto mb-4 rounded-xl flex items-center justify-center transition-all border',
            isDragging
              ? 'bg-[oklch(0.65_0.18_145/0.15)] border-[oklch(0.65_0.18_145/0.3)] scale-105'
              : 'bg-muted/20 border-[oklch(0.25_0.03_145)]'
          )}>
            <span className={cn(
              'text-2xl transition-colors font-mono',
              isDragging ? 'text-[oklch(0.65_0.18_145)]' : 'text-muted-foreground'
            )}>
              {isLoading ? '...' : '↑'}
            </span>
          </div>

          <h3 className="text-sm font-medium mb-1">
            {isDragging ? t('fileUploader.dropHere') : getUploadLabel()}
          </h3>
          <p className="text-muted-foreground text-xs mb-4">
            {getFormatHint()}
          </p>

          <input
            type="file"
            id="file-upload"
            accept={getAcceptedExtensions().join(',')}
            onChange={handleFileSelect}
            className="hidden"
          />
          <Button
            asChild
            size="sm"
            className="bg-[oklch(0.55_0.15_145)] hover:bg-[oklch(0.6_0.17_145)] text-white"
          >
            <label htmlFor="file-upload" className="cursor-pointer">
              {isLoading ? t('processor.processing') : t('fileUploader.chooseFile')}
            </label>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
