function MobileNav({ isOpen, onOpen, triggerRef }) {
  return (
    <button
      aria-controls="mobile-nav-drawer"
      aria-expanded={isOpen}
      aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
      className="inline-flex min-h-10 items-center gap-3 border-0 bg-transparent text-xs font-normal uppercase tracking-[0.01em] text-white transition hover:text-brand-gold focus:outline-none focus:ring-0"
      onClick={onOpen}
      ref={triggerRef}
      type="button"
    >
      <span className="grid h-5 w-5 place-items-center" aria-hidden="true">
        <span className="block h-px w-5 bg-current" />
        <span className="block h-px w-5 bg-current" />
        <span className="block h-px w-5 bg-current" />
      </span>
      <span>Menu</span>
    </button>
  );
}

export default MobileNav;
