// Inline markdown: images, links, bold, italic, strikethrough, inline code.
// Images are matched before links because the only difference is the leading "!".
const INLINE_PATTERN =
  /(!\[([^\]]*)\]\(([^)\s]+)\))|(\[([^\]]+)\]\(([^)\s]+)\))|(\*\*(.+?)\*\*)|(\*(.+?)\*)|(~~(.+?)~~)|(`([^`]+)`)/g;

function parseInline(text) {
  const parts = [];
  let last = 0;
  let match;

  INLINE_PATTERN.lastIndex = 0;
  while ((match = INLINE_PATTERN.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    const key = match.index;

    if (match[1]) {
      // image ![alt](url)
      parts.push(
        <img
          alt={match[2] || ""}
          className="my-4 w-full rounded-lg border border-brand-forest/10 object-cover"
          key={key}
          loading="lazy"
          src={match[3]}
        />
      );
    } else if (match[4]) {
      // link [text](url)
      const external = /^https?:\/\//.test(match[6]);
      parts.push(
        <a
          className="font-semibold text-brand-forest underline decoration-brand-gold/60 underline-offset-2 transition hover:text-brand-gold"
          href={match[6]}
          key={key}
          rel={external ? "noreferrer noopener" : undefined}
          target={external ? "_blank" : undefined}
        >
          {match[5]}
        </a>
      );
    } else if (match[7]) {
      parts.push(<strong key={key}>{match[8]}</strong>);
    } else if (match[9]) {
      parts.push(<em key={key}>{match[10]}</em>);
    } else if (match[11]) {
      parts.push(<del className="text-brand-muted" key={key}>{match[12]}</del>);
    } else if (match[13]) {
      parts.push(
        <code className="rounded bg-brand-forest/8 px-1.5 py-0.5 font-mono text-[0.85em] text-brand-forest" key={key}>
          {match[14]}
        </code>
      );
    }

    last = match.index + match[0].length;
  }

  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

function MarkdownRenderer({ content, className = "" }) {
  if (!content) return null;

  const blocks = content.split(/\n{2,}/);

  const elements = blocks.map((block, blockIndex) => {
    const trimmed = block.trim();
    if (!trimmed) return null;

    // Code block ``` ... ```
    if (trimmed.startsWith("```")) {
      const code = trimmed.replace(/^```[^\n]*\n?/, "").replace(/```$/, "").trimEnd();
      return (
        <pre
          className="mb-5 overflow-x-auto rounded-lg bg-brand-forest p-4 text-sm leading-6 text-brand-cream"
          key={blockIndex}
        >
          <code className="font-mono">{code}</code>
        </pre>
      );
    }

    // Standalone image on its own line → full-width block image
    const imageOnly = trimmed.match(/^!\[([^\]]*)\]\(([^)\s]+)\)$/);
    if (imageOnly) {
      return (
        <figure className="my-6" key={blockIndex}>
          <img
            alt={imageOnly[1] || ""}
            className="w-full rounded-xl border border-brand-forest/10 object-cover"
            loading="lazy"
            src={imageOnly[2]}
          />
          {imageOnly[1] && (
            <figcaption className="mt-2 text-center text-xs italic text-brand-muted">{imageOnly[1]}</figcaption>
          )}
        </figure>
      );
    }

    if (trimmed.startsWith("### ")) {
      return (
        <h3 className="mb-3 mt-8 text-lg font-black text-brand-forest" key={blockIndex}>
          {parseInline(trimmed.slice(4))}
        </h3>
      );
    }
    if (trimmed.startsWith("## ")) {
      return (
        <h2 className="mb-4 mt-10 text-xl font-black text-brand-forest" key={blockIndex}>
          {parseInline(trimmed.slice(3))}
        </h2>
      );
    }
    if (trimmed.startsWith("# ")) {
      return (
        <h1 className="mb-5 mt-10 text-2xl font-black text-brand-forest" key={blockIndex}>
          {parseInline(trimmed.slice(2))}
        </h1>
      );
    }

    const lines = trimmed.split("\n");

    // Blockquote (all lines start with >)
    if (lines.every((l) => /^>\s?/.test(l.trim()))) {
      return (
        <blockquote
          className="mb-5 border-l-4 border-brand-gold bg-brand-cream/40 py-2 pl-5 pr-3 text-base italic leading-8 text-brand-charcoal/80"
          key={blockIndex}
        >
          {lines.map((line, i) => (
            <span className="block" key={i}>{parseInline(line.replace(/^>\s?/, ""))}</span>
          ))}
        </blockquote>
      );
    }

    // Ordered list
    if (lines.every((l) => /^\d+\.\s/.test(l.trim()))) {
      return (
        <ol className="mb-4 ml-1 space-y-2" key={blockIndex}>
          {lines.map((line, i) => (
            <li className="flex gap-3 text-base leading-7 text-brand-charcoal" key={i}>
              <span className="font-black text-brand-gold">{i + 1}.</span>
              <span>{parseInline(line.replace(/^\d+\.\s/, "").trim())}</span>
            </li>
          ))}
        </ol>
      );
    }

    // Unordered list
    if (lines.every((l) => /^[-*]\s/.test(l.trim()))) {
      return (
        <ul className="mb-4 ml-1 space-y-2" key={blockIndex}>
          {lines.map((line, i) => (
            <li className="flex gap-3 text-base leading-7 text-brand-charcoal" key={i}>
              <span aria-hidden="true" className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-gold" />
              <span>{parseInline(line.replace(/^[-*]\s/, "").trim())}</span>
            </li>
          ))}
        </ul>
      );
    }

    return (
      <p className="mb-4 text-base leading-8 text-brand-charcoal/85" key={blockIndex}>
        {parseInline(trimmed)}
      </p>
    );
  });

  return <div className={`blog-prose ${className}`}>{elements}</div>;
}

export default MarkdownRenderer;
