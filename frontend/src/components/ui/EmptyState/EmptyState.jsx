import Button from "../Button/Button.jsx";

function EmptyState({ title = "No results found", message = "Try a different option.", cta }) {
  return (
    <div className="border border-brand-forest/10 bg-brand-cream/50 p-8 text-center">
      <h3 className="text-xl font-black tracking-[0] text-brand-forest">{title}</h3>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-brand-muted">{message}</p>
      {cta ? (
        <Button className="mt-5" size="sm" to={cta.href} variant="dark">
          {cta.label}
        </Button>
      ) : null}
    </div>
  );
}

export default EmptyState;
