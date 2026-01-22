import ReactMarkdown from "react-markdown";
import { cn } from "../../lib/cn";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

// Custom components for markdown rendering with proper types
const CustomParagraph = (props: any) => (
  <p className="mb-2 leading-relaxed last:mb-0 text-primary">
    {props.children}
  </p>
);

const CustomH1 = (props: any) => (
  <h1 className="mb-2 text-lg font-semibold text-primary">{props.children}</h1>
);

const CustomH2 = (props: any) => (
  <h2 className="mb-2 text-base font-semibold text-primary">
    {props.children}
  </h2>
);

const CustomH3 = (props: any) => (
  <h3 className="mb-1 text-sm font-semibold text-primary">{props.children}</h3>
);

const CustomUL = (props: any) => (
  <ul className="pl-4 mb-2 space-y-1 list-disc text-primary">
    {props.children}
  </ul>
);

const CustomOL = (props: any) => (
  <ol className="pl-4 mb-2 space-y-1 list-decimal text-primary">
    {props.children}
  </ol>
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
    <code className="block p-2 overflow-x-auto font-mono text-xs rounded bg-muted/50">
      {props.children}
    </code>
  );
};

const CustomBlockquote = (props: any) => (
  <blockquote className="pl-4 my-2 italic border-l-4 border-muted text-primary">
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
    className="underline text-primary hover:no-underline"
    target="_blank"
    rel="noopener noreferrer"
  >
    {props.children}
  </a>
);

export default function MarkdownRenderer({
  content,
  className,
}: Readonly<MarkdownRendererProps>) {
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
