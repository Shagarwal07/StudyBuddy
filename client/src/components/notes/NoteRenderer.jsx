import React, { useState, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { Copy, Check, Clock, Play } from "lucide-react";
import "./NoteRenderer.css";

/**
 * Dedicated Code Block with Copy button top-right
 */
function CodeBlock({ children, className }) {
  const [copied, setCopied] = useState(false);
  const codeString = String(children || "").replace(/\n$/, "");

  const handleCopy = () => {
    navigator.clipboard.writeText(codeString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="code-block-wrapper">
      <button
        type="button"
        onClick={handleCopy}
        title="Copy code to clipboard"
        className="absolute top-2.5 right-2.5 px-2.5 py-1 text-xs font-mono bg-zinc-800/90 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded border border-zinc-700 transition cursor-pointer flex items-center gap-1.5 select-none shadow-xs"
      >
        {copied ? (
          <>
            <Check className="w-3 h-3 text-emerald-400" />
            <span className="text-emerald-400 font-semibold">Copied!</span>
          </>
        ) : (
          <>
            <Copy className="w-3 h-3 text-zinc-400" />
            <span>Copy</span>
          </>
        )}
      </button>
      <pre>
        <code>{codeString}</code>
      </pre>
    </div>
  );
}

/**
 * Normalizes concepts into clean unordered lists (ul > li)
 */
function normalizeConcepts(markdown) {
  if (!markdown) return "";
  return markdown.replace(
    /(##\s*Concepts\s*\n)([\s\S]*?)(?=\n##|\n#|---|$)/gi,
    (match, header, body) => {
      const rawLines = body.trim().split(/\n+/);
      const bullets = [];

      for (const line of rawLines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        if (/^[-*•]\s+/.test(trimmed)) {
          bullets.push(trimmed);
        } else if (/^\d+\.\s+/.test(trimmed)) {
          bullets.push(trimmed.replace(/^\d+\.\s+/, "- "));
        } else {
          bullets.push(`- ${trimmed}`);
        }
      }

      return `${header}\n${bullets.join("\n")}\n\n`;
    }
  );
}

/**
 * Parses markdown into structured sections:
 * - Course Overview (with description inside card)
 * - Main Body
 * - Key Insights (with bullets inside callout)
 */
function parseNoteBlocks(rawMarkdown) {
  if (!rawMarkdown || typeof rawMarkdown !== "string") {
    return { overview: null, chapters: [] };
  }

  let text = normalizeConcepts(rawMarkdown.trim());
  let overview = null;

  // 1. Extract Course Overview block if present at start
  const overviewRegex = /^#+\s*Course Overview\s*\n+([\s\S]*?)(?=\n---\s*\n|\n#+ Chapter|\n##|$)/i;
  const overviewMatch = text.match(overviewRegex);
  if (overviewMatch) {
    overview = overviewMatch[1].trim();
    text = text.slice(overviewMatch[0].length).replace(/^\s*---\s*\n*/, "").trim();
  }

  // 2. Split chapters by "# Chapter" if multiple, or treat whole text as single chapter
  const rawChapters = text.split(/(?=\n*#\s*Chapter\s*\d+)/i).filter((ch) => ch.trim());

  const parsedChapters = (rawChapters.length > 0 ? rawChapters : [text]).map((chText) => {
    let title = "";
    let timeRange = "";
    let body = chText.trim();

    // Check for chapter header with optional timestamp: # Chapter X: Title \n *Timestamp: 00:00 - 12:00*
    const headerRegex = /^#\s*(Chapter\s*[^:\n]+:\s*[^\n]+)\n+(?:\*?Timestamp:?\s*[0-9: -]+\*?\n*)?/i;
    const headerMatch = body.match(headerRegex);

    if (headerMatch) {
      title = headerMatch[1].trim();
      body = body.slice(headerMatch[0].length).trim();
    }

    // Strip out any redundant timestamp lines (e.g., *Timestamp: 12:00 - 33:22*)
    body = body.replace(/^\s*\*?Timestamp:?\s*[0-9: -]+\*?\s*$/gim, "").trim();

    // Extract Key Insights from chapter body
    const insightParts = body.split(/(?:###|##)\s*Key Insights:?\s*\n+/i);
    let mainContent = body;
    let keyInsightsBullets = null;

    if (insightParts.length > 1) {
      mainContent = insightParts[0].trim();
      const rest = insightParts[1];
      const restParts = rest.split(/(?=\n##|\n#|---)/);
      keyInsightsBullets = restParts[0].trim();
      const tail = restParts.slice(1).join("").trim();
      if (tail) {
        mainContent += `\n\n${tail}`;
      }
    }

    return {
      title,
      timeRange,
      mainContent,
      keyInsightsBullets,
    };
  });

  return { overview, chapters: parsedChapters };
}

export default function NoteRenderer({
  content,
  onSeekTimestamp,
  className = "",
}) {
  const { overview, chapters } = useMemo(() => {
    return parseNoteBlocks(content);
  }, [content]);

  if (!content) {
    return (
      <div className="text-sm text-neutral-500 italic py-4">
        No notes content available.
      </div>
    );
  }

  const markdownComponents = {
    h2: ({ node, children, ...props }) => {
      return <h2 {...props}>{children}</h2>;
    },
    h3: ({ node, children, ...props }) => {
      return <h3 {...props}>{children}</h3>;
    },
    p: ({ node, children, ...props }) => {
      return <p {...props}>{children}</p>;
    },
    ul: ({ node, children, ...props }) => {
      return (
        <ul className="list-disc pl-5 my-3 space-y-2.5" {...props}>
          {children}
        </ul>
      );
    },
    li: ({ node, children, ...props }) => {
      return (
        <li className="leading-relaxed" {...props}>
          {children}
        </li>
      );
    },
    code: ({ node, inline, className: codeClass, children, ...props }) => {
      const isInline = inline || (!codeClass && !String(children).includes("\n"));
      if (isInline) {
        return (
          <code className="inline-code" {...props}>
            {children}
          </code>
        );
      }
      return <CodeBlock className={codeClass}>{children}</CodeBlock>;
    },
    a: ({ node, href, children, ...props }) => {
      if (href && href.startsWith("#t=")) {
        const timeStr = href.replace("#t=", "");
        const parts = timeStr.split(":").map(Number);
        let seconds = 0;
        if (parts.length === 3) seconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
        else if (parts.length === 2) seconds = parts[0] * 60 + parts[1];

        return (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              if (onSeekTimestamp) {
                onSeekTimestamp(seconds);
              }
            }}
            title={`Seek video to ${timeStr}`}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-500/15 hover:bg-red-500/25 text-red-400 font-mono text-xs font-semibold border border-red-500/20 cursor-pointer align-baseline transition-colors not-prose mx-1"
          >
            <Play className="w-2.5 h-2.5 fill-current" />
            <span>{timeStr}</span>
          </button>
        );
      }

      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-red-400 hover:text-red-300 underline underline-offset-2 transition-colors"
          {...props}
        >
          {children}
        </a>
      );
    },
  };

  return (
    <div className={`markdown-body ${className}`}>
      {/* 1. Course Overview Card (Header AND Description enclosed inside card) */}
      {overview && (
        <div className="overview-card bg-zinc-900 border border-zinc-800 p-4 rounded-lg mb-6">
          <h2 className="text-base font-bold text-white mb-2 pb-0 border-none mt-0">
            Course Overview
          </h2>
          <p className="text-sm text-[#E5E7EB] leading-relaxed mb-0">
            {overview}
          </p>
        </div>
      )}

      {/* 2. Chapters */}
      {chapters.map((chapter, idx) => (
        <div key={idx} className="chapter-section mb-8">
          {/* Chapter Header */}
          {chapter.title && (
            <div className="mb-4 mt-6">
              <h1 className="text-xl sm:text-2xl font-bold text-white m-0">
                {chapter.title}
              </h1>
            </div>
          )}

          {/* Main Chapter Content */}
          <ReactMarkdown
            remarkPlugins={[remarkGfm, remarkMath]}
            rehypePlugins={[rehypeKatex]}
            components={markdownComponents}
          >
            {chapter.mainContent}
          </ReactMarkdown>

          {/* Key Insights Callout (Header AND Bullets enclosed inside green callout) */}
          {chapter.keyInsightsBullets && (
            <div className="callout bg-green-900/20 border border-green-800 p-4 rounded-lg mt-6 mb-6">
              <div className="text-xs font-mono font-bold uppercase tracking-wider text-green-400 mb-2.5 flex items-center gap-1.5">
                <span>💡</span>
                <span>KEY INSIGHTS</span>
              </div>
              <div className="text-green-200">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm, remarkMath]}
                  rehypePlugins={[rehypeKatex]}
                  components={markdownComponents}
                >
                  {chapter.keyInsightsBullets}
                </ReactMarkdown>
              </div>
            </div>
          )}

          {idx < chapters.length - 1 && <hr className="my-8 border-neutral-800" />}
        </div>
      ))}
    </div>
  );
}
