import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowsFullscreen,
  Code,
  CodeSlash,
  Eye,
  FullscreenExit,
  Image,
  Link45deg,
  ListOl,
  ListUl,
  PencilSquare,
  Quote,
  TypeBold,
  TypeH2,
  TypeH3,
  TypeItalic,
  TypeStrikethrough,
} from "react-bootstrap-icons";
import MarkdownRenderer from "../../../components/ui/MarkdownRenderer/MarkdownRenderer.jsx";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getWordCount(text) {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

function applyInlineWrap(el, before, after) {
  const start = el.selectionStart;
  const end = el.selectionEnd;
  const selected = el.value.slice(start, end);
  const replacement = before + (selected || "text") + after;
  const next = el.value.slice(0, start) + replacement + el.value.slice(end);
  const nextCursor = selected
    ? start + before.length + selected.length + after.length
    : start + before.length;
  return { value: next, selStart: start + before.length, selEnd: selected ? nextCursor - after.length : nextCursor - after.length };
}

function applyLinePrefix(el, prefix) {
  const start = el.selectionStart;
  const lineStart = el.value.lastIndexOf("\n", start - 1) + 1;
  const next = el.value.slice(0, lineStart) + prefix + el.value.slice(lineStart);
  return { value: next, selStart: start + prefix.length, selEnd: el.selectionEnd + prefix.length };
}

function applyBlock(el, before, after, placeholder) {
  const start = el.selectionStart;
  const end = el.selectionEnd;
  const selected = el.value.slice(start, end) || placeholder;
  const block = `\n${before}\n${selected}\n${after}\n`;
  const next = el.value.slice(0, start) + block + el.value.slice(end);
  return { value: next, selStart: start + before.length + 2, selEnd: start + before.length + 2 + selected.length };
}

// Link / image: uses the selection as the label, then selects the URL
// placeholder so the editor can immediately paste a link. (GitHub-style.)
function applyMedia(el, isImage) {
  const start = el.selectionStart;
  const end = el.selectionEnd;
  const selected = el.value.slice(start, end);
  const prefix = isImage ? "!" : "";
  const label = selected || (isImage ? "image description" : "link text");
  const url = "https://";
  const replacement = `${prefix}[${label}](${url})`;
  const next = el.value.slice(0, start) + replacement + el.value.slice(end);
  const urlStart = start + prefix.length + 1 + label.length + 2;
  return { value: next, selStart: urlStart, selEnd: urlStart + url.length };
}

// ─── Toolbar button ───────────────────────────────────────────────────────────

function ToolBtn({ icon: Icon, title, onClick, active }) {
  return (
    <button
      aria-label={title}
      className={[
        "grid h-8 w-8 place-items-center rounded transition",
        active
          ? "bg-brand-forest text-white"
          : "text-brand-forest/70 hover:bg-brand-forest/10 hover:text-brand-forest",
      ].join(" ")}
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      title={title}
      type="button"
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}

function Divider() {
  return <span aria-hidden="true" className="mx-1 h-5 w-px bg-brand-forest/15" />;
}

// ─── Main component ───────────────────────────────────────────────────────────

function BlogEditor({ value = "", onChange, label, required }) {
  const [view, setView] = useState("split"); // "edit" | "preview" | "split"
  const [fullscreen, setFullscreen] = useState(false);
  const textareaRef = useRef(null);

  const apply = useCallback((result) => {
    onChange({ target: { name: "content", value: result.value } });
    requestAnimationFrame(() => {
      const el = textareaRef.current;
      if (!el) return;
      el.focus();
      el.setSelectionRange(result.selStart, result.selEnd);
    });
  }, [onChange]);

  const cmd = useCallback((fn) => {
    const el = textareaRef.current;
    if (!el) return;
    apply(fn(el));
  }, [apply]);

  // Keyboard shortcuts
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;

    const onKey = (e) => {
      const mod = e.ctrlKey || e.metaKey;
      if (!mod) return;
      if (e.key === "b") { e.preventDefault(); cmd((el) => applyInlineWrap(el, "**", "**")); }
      if (e.key === "i") { e.preventDefault(); cmd((el) => applyInlineWrap(el, "*", "*")); }
      if (e.key === "k") { e.preventDefault(); cmd((el) => applyMedia(el, false)); }
    };

    el.addEventListener("keydown", onKey);
    return () => el.removeEventListener("keydown", onKey);
  }, [cmd]);

  // Tab key inserts 2 spaces instead of losing focus
  const handleKeyDown = (e) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const el = e.target;
      const start = el.selectionStart;
      const next = el.value.slice(0, start) + "  " + el.value.slice(el.selectionEnd);
      onChange({ target: { name: "content", value: next } });
      requestAnimationFrame(() => el.setSelectionRange(start + 2, start + 2));
    }
  };

  const words = getWordCount(value);
  const chars = value.length;
  const readMins = Math.max(1, Math.round(words / 200));

  const showEdit    = view === "edit"    || view === "split";
  const showPreview = view === "preview" || view === "split";

  return (
    <div
      className={[
        "flex flex-col overflow-hidden border border-brand-forest/15 bg-white",
        fullscreen ? "fixed inset-0 z-50" : "h-144",
      ].join(" ")}
    >
      {/* ── Label ── */}
      {label && !fullscreen && (
        <p className="shrink-0 border-b border-brand-forest/10 px-4 py-2 text-xs font-extrabold uppercase tracking-widest text-brand-forest">
          {label}
          {required && <span className="ml-1 text-red-500">*</span>}
        </p>
      )}

      {/* ── Toolbar (pinned) ── */}
      <div className="shrink-0 flex flex-wrap items-center gap-0.5 border-b border-brand-forest/10 bg-brand-cream/40 px-3 py-2">
        {/* Headings */}
        <ToolBtn icon={TypeH2} title="Big heading" onClick={() => cmd((el) => applyLinePrefix(el, "## "))} />
        <ToolBtn icon={TypeH3} title="Small heading" onClick={() => cmd((el) => applyLinePrefix(el, "### "))} />
        <Divider />

        {/* Inline */}
        <ToolBtn icon={TypeBold}          title="Bold"                   onClick={() => cmd((el) => applyInlineWrap(el, "**", "**"))} />
        <ToolBtn icon={TypeItalic}        title="Italic"                 onClick={() => cmd((el) => applyInlineWrap(el, "*", "*"))} />
        <ToolBtn icon={TypeStrikethrough} title="Strikethrough"          onClick={() => cmd((el) => applyInlineWrap(el, "~~", "~~"))} />
        <Divider />

        {/* Links & media */}
        <ToolBtn icon={Link45deg} title="Add link"       onClick={() => cmd((el) => applyMedia(el, false))} />
        <ToolBtn icon={Image}     title="Add image"      onClick={() => cmd((el) => applyMedia(el, true))} />
        <Divider />

        {/* Lists */}
        <ToolBtn icon={ListUl} title="Bullet list"   onClick={() => cmd((el) => applyLinePrefix(el, "- "))} />
        <ToolBtn icon={ListOl} title="Numbered list" onClick={() => cmd((el) => applyLinePrefix(el, "1. "))} />
        <Divider />

        {/* Blocks */}
        <ToolBtn icon={Quote}    title="Quote"        onClick={() => cmd((el) => applyLinePrefix(el, "> "))} />
        <ToolBtn icon={Code}     title="Code style"   onClick={() => cmd((el) => applyInlineWrap(el, "`", "`"))} />
        <ToolBtn icon={CodeSlash} title="Code section" onClick={() => cmd((el) => applyBlock(el, "```", "```", "code here"))} />

        {/* Spacer */}
        <span className="flex-1" />

        {/* View toggle */}
        <div className="flex items-center gap-0.5 rounded border border-brand-forest/15 bg-white p-0.5">
          <ToolBtn icon={PencilSquare} title="Write only"  active={view === "edit"}    onClick={() => setView("edit")} />
          <ToolBtn icon={Eye}          title="See page"    active={view === "preview"} onClick={() => setView("preview")} />
          <button
            className={[
              "px-2 py-1 text-[10px] font-extrabold uppercase tracking-widest rounded transition",
              view === "split"
                ? "bg-brand-forest text-white"
                : "text-brand-forest/70 hover:bg-brand-forest/10 hover:text-brand-forest",
            ].join(" ")}
            onMouseDown={(e) => { e.preventDefault(); setView("split"); }}
            title="Write and see"
            type="button"
          >
            Both
          </button>
        </div>
        <Divider />
        <ToolBtn
          icon={fullscreen ? FullscreenExit : ArrowsFullscreen}
          title={fullscreen ? "Close large view" : "Large view"}
          onClick={() => setFullscreen((f) => !f)}
        />
      </div>

      {/* ── Editor + Preview (scrolls inside) ── */}
      <div
        className={[
          "grid min-h-0 flex-1 overflow-hidden",
          view === "split" ? "grid-cols-2 divide-x divide-brand-forest/10" : "grid-cols-1",
        ].join(" ")}
      >
        {showEdit && (
          <textarea
            className="h-full w-full resize-none overflow-y-auto bg-white p-4 font-mono text-sm leading-7 text-brand-charcoal outline-none placeholder:text-brand-muted/50"
            name="content"
            onChange={onChange}
            onKeyDown={handleKeyDown}
            placeholder={"Start with a clear title.\n\nWrite the post here. Keep sentences short and helpful.\n\nAdd important details like location, price range, documents, and who to contact."}
            ref={textareaRef}
            required={required}
            spellCheck
            value={value}
          />
        )}

        {showPreview && (
          <div className="h-full overflow-y-auto bg-brand-cream/20 p-6">
            {value.trim() ? (
              <MarkdownRenderer content={value} />
            ) : (
              <p className="text-sm italic text-brand-muted/60">You will see the post here as you write.</p>
            )}
          </div>
        )}
      </div>

      {/* ── Status bar (pinned) ── */}
      <div className="shrink-0 flex items-center justify-between border-t border-brand-forest/10 bg-brand-cream/30 px-4 py-1.5">
        <div className="flex items-center gap-4 text-[11px] text-brand-muted">
          <span>{words} {words === 1 ? "word" : "words"}</span>
          <span>{chars} characters</span>
          <span>~{readMins} min read</span>
        </div>
        <span className="text-[11px] text-brand-muted">Write clearly. Keep paragraphs short.</span>
      </div>
    </div>
  );
}

export default BlogEditor;
