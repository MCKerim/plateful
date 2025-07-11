import ReactMarkdown from 'react-markdown';
import { cn } from '../../lib/utils';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

// Custom components for markdown rendering with proper types
const CustomParagraph = (props: any) => (
  <p className="mb-2 last:mb-0 leading-relaxed text-primary">{props.children}</p>
);

const CustomH1 = (props: any) => (
  <h1 className="text-lg font-semibold mb-2 text-primary">{props.children}</h1>
);

const CustomH2 = (props: any) => (
  <h2 className="text-base font-semibold mb-2 text-primary">{props.children}</h2>
);

const CustomH3 = (props: any) => (
  <h3 className="text-sm font-semibold mb-1 text-primary">{props.children}</h3>
);

const CustomUL = (props: any) => (
  <ul className="list-disc pl-4 mb-2 space-y-1 text-primary">{props.children}</ul>
);

const CustomOL = (props: any) => (
  <ol className="list-decimal pl-4 mb-2 space-y-1 text-primary ">{props.children}</ol>
);

const CustomLI = (props: any) => (
  <li className="text-sm leading-relaxed text-primary">{props.children}</li>
);

const CustomCode = (props: any) => {
  const isInline = !props.className;
  if (isInline) {
    return (
      <code className="bg-muted/50 px-1 py-0.5 rounded text-xs font-mono">
        {props.children}
      </code>
    );
  }
  return (
    <code className="block bg-muted/50 p-2 rounded text-xs font-mono overflow-x-auto">
      {props.children}
    </code>
  );
};

const CustomBlockquote = (props: any) => (
  <blockquote className="border-l-4 border-muted pl-4 italic my-2 text-primary">
    {props.children}
  </blockquote>
);

const CustomStrong = (props: any) => (
  <strong className="font-semibold text-primary">{props.children}</strong>
);

const CustomEm = (props: any) => (
  <em className="italic text-primary">{props.children}</em>
);

const CustomA = (props: any) => (
  <a 
    href={props.href} 
    className="text-primary underline hover:no-underline"
    target="_blank"
    rel="noopener noreferrer"
  >
    {props.children}
  </a>
);

export default function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  return (
    <div className={cn("prose prose-sm max-w-none", className)}>
      <ReactMarkdown
        components={{
          p: CustomParagraph,
          h1: CustomH1,
          h2: CustomH2,
          h3: CustomH3,
          ul: CustomUL,
          ol: CustomOL,
          li: CustomLI,
          code: CustomCode,
          blockquote: CustomBlockquote,
          strong: CustomStrong,
          em: CustomEm,
          a: CustomA,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
