import ReactMarkdown from "react-markdown";
import { cn } from "../../lib/utils";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

type MarkdownComponentProps = {
  children?: React.ReactNode;
  className?: string;
  href?: string;
};

const CustomParagraph = ({ children }: MarkdownComponentProps) => (
  <p className="mb-2 leading-relaxed last:mb-0 text-primary">{children}</p>
);

const CustomH1 = ({ children }: MarkdownComponentProps) => (
  <h1 className="mb-2 text-lg font-semibold text-primary">{children}</h1>
);

const CustomH2 = ({ children }: MarkdownComponentProps) => (
  <h2 className="mb-2 text-base font-semibold text-primary">{children}</h2>
);

const CustomH3 = ({ children }: MarkdownComponentProps) => (
  <h3 className="mb-1 text-sm font-semibold text-primary">{children}</h3>
);

const CustomUL = ({ children }: MarkdownComponentProps) => (
  <ul className="pl-4 mb-2 space-y-1 list-disc text-primary">{children}</ul>
);

const CustomOL = ({ children }: MarkdownComponentProps) => (
  <ol className="pl-4 mb-2 space-y-1 list-decimal text-primary">{children}</ol>
);

const CustomLI = ({ children }: MarkdownComponentProps) => (
  <li className="text-sm leading-relaxed text-primary">{children}</li>
);

const CustomCode = ({ children, className }: MarkdownComponentProps) => {
  const isInline = !className;
  if (isInline) {
    return (
      <code className="bg-muted/50 px-1 py-0.5 rounded text-xs font-mono">{children}</code>
    );
  }
  return (
    <code className="block p-2 overflow-x-auto font-mono text-xs rounded bg-muted/50">
      {children}
    </code>
  );
};

const CustomBlockquote = ({ children }: MarkdownComponentProps) => (
  <blockquote className="pl-4 my-2 italic border-l-4 border-muted text-primary">
    {children}
  </blockquote>
);

const CustomStrong = ({ children }: MarkdownComponentProps) => (
  <strong className="font-semibold text-primary">{children}</strong>
);

const CustomEm = ({ children }: MarkdownComponentProps) => <em className="italic text-primary">{children}</em>;

const CustomA = ({ href, children }: MarkdownComponentProps) => (
  <a
    href={href}
    className="underline text-primary hover:no-underline"
    target="_blank"
    rel="noopener noreferrer"
  >
    {children}
  </a>
);

export default function MarkdownRenderer({ content, className }: Readonly<MarkdownRendererProps>) {
  return (
    <div className={cn("prose prose-sm max-w-none break-words", className)}>
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
