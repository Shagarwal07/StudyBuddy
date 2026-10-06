export default function SettingsSection({ title, description, children }) {
  return (
    <section className="space-y-3">
      <header>
        <h2 className="text-sm font-semibold tracking-tight text-neutral-100">
          {title}
        </h2>

        {description && <p className="mt-0.5 text-xs text-neutral-400">{description}</p>}
      </header>

      <div className="overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900/60 backdrop-blur-sm shadow-sm">
        {children}
      </div>
    </section>
  );
}
