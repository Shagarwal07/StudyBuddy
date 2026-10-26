import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { Copy, Check } from "lucide-react";

function CodeBlock({ className, children, ...props }) {
  const [copied, setCopied] = useState(false);
  const match = /language-(\w+)/.exec(className || "");
  const codeString = String(children || "").replace(/\n$/, "");
  const isBlock = Boolean(match) || codeString.includes("\n");

  const handleCopy = () => {
    navigator.clipboard.writeText(codeString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isBlock) {
    return (
      <div className="relative group my-2">
        <pre className="bg-neutral-950 p-3 rounded-lg border border-neutral-800 font-mono text-[11px] overflow-x-auto text-neutral-200 leading-relaxed">
          <code className={className} {...props}>
            {children}
          </code>
        </pre>
        <button
          type="button"
          onClick={handleCopy}
          className="absolute top-2 right-2 p-1 rounded bg-neutral-800/80 hover:bg-neutral-700 text-neutral-300 opacity-0 group-hover:opacity-100 transition cursor-pointer"
          title="Copy code"
        >
          {copied ? (
            <Check className="w-3 h-3 text-emerald-400" />
          ) : (
            <Copy className="w-3 h-3" />
          )}
        </button>
      </div>
    );
  }

  return (
    <code
      className="bg-neutral-800/80 border border-neutral-700/60 px-1.5 py-0.5 rounded text-[11px] font-mono text-red-300 inline align-baseline mx-0.5"
      {...props}
    >
      {children}
    </code>
  );
}

export default function MarkdownContent({ content }) {
  if (!content) return null;

  return (
    <div className="prose prose-invert prose-xs max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          table: ({ node, ...props }) => (
            <div className="overflow-x-auto my-3 border border-neutral-800 rounded-lg">
              <table className="min-w-full text-xs text-left" {...props} />
            </div>
          ),
          th: ({ node, ...props }) => (
            <th
              className="bg-neutral-950 p-2 font-mono text-[11px] font-bold text-neutral-200 border-b border-neutral-800"
              {...props}
            />
          ),
          td: ({ node, ...props }) => (
            <td
              className="p-2 border-b border-neutral-800/60 font-mono text-[11px] text-neutral-300"
              {...props}
            />
          ),
          code: CodeBlock,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
