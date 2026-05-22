export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer
      className="mt-16 border-t border-black/5 bg-white/60"
      role="contentinfo"
      aria-label="Footer"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:justify-between sm:text-left">
          <div className="flex flex-col leading-tight">
            <span className="text-[10px] tracking-[0.3em] uppercase text-slate-ardoise font-medium">
              Star Luxury Group
            </span>
            <span className="text-xs text-slate-ardoise/80">
              Monaco · 57 Rue Grimaldi
            </span>
          </div>

          <div className="text-[11px] uppercase tracking-[0.2em] text-slate-ardoise/80">
            © {year} · Internal tool · For Stars team only
          </div>
        </div>
      </div>
    </footer>
  );
}
