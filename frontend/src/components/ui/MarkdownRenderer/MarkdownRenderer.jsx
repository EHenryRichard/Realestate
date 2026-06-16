function parseInline(text) {
  const parts = [];
  const pattern = /(\*\*(.+?)\*\*|\*(.+?)\*)/g;
  let last = 0;
  let match;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    if (match[2]) parts.push(<strong key={match.index}>{match[2]}</strong>);
    else if (match[3]) parts.push(<em key={match.index}>{match[3]}</em>);
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
    const isList = lines.every((l) => /^[-*]\s/.test(l.trim()));

    if (isList) {
      return (
        <ul className="mb-4 ml-1 space-y-2" key={blockIndex}>
          {lines.map((line, lineIndex) => (
            <li className="flex gap-3 text-base leading-7 text-brand-charcoal" key={lineIndex}>
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
