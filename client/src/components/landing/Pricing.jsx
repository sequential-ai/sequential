const ROWS = [
  { label: 'Task API', a: 'Free', b: '$0.02–0.05 / call' },
  { label: 'Monitor API', a: 'Free', b: '— build it yourself' },
  { label: 'Parallel workers', a: 'Included', b: 'up to 20,000 credits' },
  { label: 'Free tier', a: '1,000 free credits / mo', b: 'none' },
  { label: 'Failed requests', a: '$0', b: 'billed anyway' },
];

export default function Pricing() {
  return (
    <section className="py-[100px]" id="pricing">
      <div className="max-w-[1180px] mx-auto px-8">
        <div className="max-w-[520px] mb-9">
          <span className="eyebrow flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.08em] text-muted mb-3">Pricing</span>
          <h2 className="font-display font-bold text-[clamp(26px,3.8vw,38px)] mb-3.5">Task and Monitor are free.</h2>
          <p className="text-ink-soft text-[15.5px]">Usage-based pricing on everything else, billed only for what actually ran.</p>
        </div>

        <div className="border border-line rounded-lg overflow-hidden bg-white mb-[22px]">
          <div className="grid grid-cols-[1.4fr_1fr_1fr] sm:grid-cols-[1.4fr_1fr_1fr] font-mono text-[11px] uppercase text-muted tracking-[0.03em]">
            <div className="p-4 px-5">Capability</div>
            <div className="p-4 px-5 font-semibold text-orange">Sequential AI</div>
            <div className="p-4 px-5">Single-Agent</div>
          </div>
          {ROWS.map((row, i) => (
            <div
              key={row.label}
              className={`grid grid-cols-[1.4fr_1fr_1fr] border-t border-line ${i % 2 === 1 ? 'bg-cream-2' : ''}`}
            >
              <div className="p-4 px-5 text-sm">{row.label}</div>
              <div className="p-4 px-5 text-sm font-semibold text-orange">{row.a}</div>
              <div className="p-4 px-5 text-sm">{row.b}</div>
            </div>
          ))}
        </div>

        <div className="bg-dark rounded-md p-[26px] px-[30px] flex items-center justify-between flex-wrap gap-4">
          <div className="text-cream-on-dark text-[14.5px] max-w-[320px]">
            At 10,000 tasks and 10,000 monitor checks per month, the bill speaks for itself.
          </div>
          <div className="flex items-center gap-3.5 font-mono">
            <div className="text-right px-4 py-1.5">
              <div className="text-[10.5px] text-muted-on-dark uppercase mb-1">Sequential AI</div>
              <div className="font-display font-extrabold text-[28px] text-lime">$0</div>
            </div>
            <span className="text-muted-on-dark text-base">/</span>
            <div className="text-right px-4 py-1.5">
              <div className="text-[10.5px] text-muted-on-dark uppercase mb-1">Self-built stack</div>
              <div className="font-display font-extrabold text-[28px] text-muted-on-dark">~$340</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
