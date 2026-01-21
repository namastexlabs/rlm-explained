'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import { cn } from '@/lib/utils';

interface MarkdownContentProps {
  content: string;
  className?: string;
}

export function MarkdownContent({ content, className }: MarkdownContentProps) {
  return (
    <div
      className={cn(
        // Base prose styling with dark mode support
        'prose prose-sm dark:prose-invert max-w-none break-words overflow-auto',
        // Paragraph styling
        'prose-p:leading-relaxed prose-p:my-3 prose-p:text-foreground',
        // Heading hierarchy
        'prose-headings:font-semibold prose-headings:text-foreground prose-headings:mt-6 prose-headings:mb-3',
        'prose-h1:text-2xl prose-h1:font-bold prose-h1:border-b prose-h1:border-border prose-h1:pb-2',
        'prose-h2:text-xl prose-h2:font-bold',
        'prose-h3:text-lg prose-h3:font-semibold',
        'prose-h4:text-base prose-h4:font-semibold',
        // List styling with proper indentation
        'prose-ul:my-3 prose-ul:pl-6 prose-ul:list-disc',
        'prose-ol:my-3 prose-ol:pl-6 prose-ol:list-decimal',
        'prose-li:my-1 prose-li:marker:text-muted-foreground',
        // Inline code styling
        'prose-code:bg-muted prose-code:text-foreground prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:text-sm prose-code:font-mono prose-code:before:content-none prose-code:after:content-none',
        // Code block styling
        'prose-pre:bg-muted prose-pre:border prose-pre:border-border prose-pre:rounded-lg prose-pre:p-4 prose-pre:overflow-x-auto',
        // Blockquote styling with accent
        'prose-blockquote:border-l-4 prose-blockquote:border-l-primary prose-blockquote:bg-muted/40 prose-blockquote:py-2 prose-blockquote:px-4 prose-blockquote:rounded-r-md prose-blockquote:not-italic prose-blockquote:text-muted-foreground',
        // Table styling with borders and alternating rows
        'prose-table:w-full prose-table:border-collapse prose-table:my-4 prose-table:border prose-table:border-border prose-table:rounded-lg prose-table:overflow-hidden',
        'prose-thead:bg-muted/60 prose-thead:border-b-2 prose-thead:border-border',
        'prose-th:px-4 prose-th:py-2.5 prose-th:text-left prose-th:font-semibold prose-th:text-foreground',
        'prose-tr:border-b prose-tr:border-border prose-tr:even:bg-muted/30',
        'prose-td:px-4 prose-td:py-2.5 prose-td:text-foreground',
        // Strong and emphasis
        'prose-strong:font-semibold prose-strong:text-foreground',
        'prose-em:italic prose-em:text-foreground',
        // Links
        'prose-a:text-primary prose-a:underline prose-a:underline-offset-2 hover:prose-a:text-primary/80',
        // Horizontal rule
        'prose-hr:border-border prose-hr:my-6',
        className
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, rehypeSanitize]}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

interface StreamingMarkdownProps {
  text: string;
  speed?: number;
  className?: string;
}

/**
 * StreamingMarkdown is a semantic alias for MarkdownContent.
 *
 * The "streaming" behavior happens through React state updates:
 * the parent component updates the `text` prop as new tokens arrive,
 * and this component re-renders with the new content. The `speed`
 * parameter is intentionally unused - animation timing is controlled
 * by the token arrival rate from the backend, not by client-side timers.
 */
export function StreamingMarkdown({ text, className }: StreamingMarkdownProps) {
  return <MarkdownContent content={text} className={className} />;
}
