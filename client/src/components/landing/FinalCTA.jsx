export default function FinalCTA() {
  return (
    <section className="bg-dark py-[110px] text-center relative overflow-hidden">
      <div className="max-w-[1180px] mx-auto px-8">
        <h2 className="text-cream-on-dark font-display font-bold text-[clamp(28px,5vw,46px)] max-w-[700px] mx-auto mb-[34px] relative">
          Search, monitor, and synthesize in one stack.
        </h2>
        <div className="flex gap-3.5 justify-center flex-wrap relative">
          <a href="#" className="inline-flex items-center justify-center gap-2 rounded-full bg-orange text-white text-sm font-semibold px-6 py-3.5 transition-transform hover:-translate-y-0.5 hover:shadow-[0_14px_28px_-10px_rgba(242,84,27,0.5)]">
            Start free
          </a>
          <a href="#" className="inline-flex items-center justify-center gap-2 rounded-full bg-cream text-ink text-sm font-semibold px-6 py-3.5 transition-transform hover:-translate-y-0.5">
            Talk to sales
          </a>
        </div>
      </div>
    </section>
  );
}
