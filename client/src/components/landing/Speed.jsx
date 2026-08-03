import { useReveal } from './useReveal';

const ROWS = [
  {
    label: 'P50 latency · 1,200-query sample',
    win: '3.5x faster',
    a: { width: 17, val: '556ms' },
    b: { width: 100, val: '1,970ms' },
  },
  {
    label: 'P99 latency · 1,200-query sample',
    win: '4.8x faster',
    a: { width: 21, val: '1,120ms' },
    b: { width: 100, val: '5,430ms' },
  },
  {
    label: 'Top-source accuracy · 250 questions',
    win: '+26.7 pts',
    a: { width: 88, val: '88.4%' },
    b: { width: 62, val: '61.7%' },
  },
  {
    label: 'End-to-end answer rate · 250 questions',
    win: '+13.4 pts',
    a: { width: 95, val: '94.6%' },
    b: { width: 81, val: '81.2%' },
  },
];

export default function Speed() {
  const [panelRef, panelInView] = useReveal();

  return (
    <section className="py-[100px]">
      <div className="max-w-[1180px] mx-auto px-8">
        <div className="max-w-[600px] mb-[34px]">
          <h2 className="font-display font-bold text-[clamp(26px,3.8vw,38px)] mb-3.5">
            Sequential AI research is faster than single-agent loops.
          </h2>
          <p className="text-ink-soft text-[15.5px]">
            3.5x faster at p50, 4.8x faster at p99. Single-agent loops read sources one at a time,
            so tail latency compounds fast — the user's experience gets worse exactly when the
            task gets harder.
          </p>
        </div>

        <div
          ref={panelRef}
          className={`border border-line rounded-lg bg-white overflow-hidden transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            panelInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          {ROWS.map((row, idx) => (
            <div key={row.label} className={`p-6 px-[26px] ${idx > 0 ? 'border-t border-line' : ''}`}>
              <div className="flex justify-between items-baseline mb-3.5">
                <span className="font-mono text-[11.5px] text-muted uppercase tracking-[0.03em]">{row.label}</span>
                <span className="inline-flex items-center gap-1.5 bg-lime text-lime-ink font-mono text-[11px] font-bold px-2.5 py-1 rounded-[5px]">
                  {row.win}
                </span>
              </div>

              <div className="grid grid-cols-[112px_1fr_76px] items-center gap-3 mb-2.5">
                <span className="font-mono text-[11.5px] text-ink-soft flex items-center gap-1.5">
                  <i className="w-2 h-2 rounded-[2px] bg-orange inline-block" />Sequential AI
                </span>
                <div className="relative h-3 rounded-[3px] overflow-hidden bg-cream-2 [background-image:repeating-linear-gradient(90deg,var(--color-line-strong)_0,var(--color-line-strong)_1px,transparent_1px,transparent_20%)]">
                  <div
                    className="absolute inset-0 rounded-[3px] bg-orange transition-[width] duration-[1300ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
                    style={{ width: panelInView ? `${row.a.width}%` : 0 }}
                  />
                </div>
                <span className="font-mono text-[12.5px] text-right text-ink">{row.a.val}</span>
              </div>

              <div className="grid grid-cols-[112px_1fr_76px] items-center gap-3">
                <span className="font-mono text-[11.5px] text-ink-soft flex items-center gap-1.5">
                  <i className="w-2 h-2 rounded-[2px] bg-muted inline-block" />Single-Agent
                </span>
                <div className="relative h-3 rounded-[3px] overflow-hidden bg-cream-2 [background-image:repeating-linear-gradient(90deg,var(--color-line-strong)_0,var(--color-line-strong)_1px,transparent_1px,transparent_20%)]">
                  <div
                    className="absolute inset-0 rounded-[3px] bg-muted transition-[width] duration-[1300ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
                    style={{ width: panelInView ? `${row.b.width}%` : 0 }}
                  />
                </div>
                <span className="font-mono text-[12.5px] text-right text-ink">{row.b.val}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row mt-[22px] border border-line rounded-md overflow-hidden">
          <div className="flex-1 p-[18px] px-[22px] bg-white sm:border-r border-t sm:border-t-0 border-line first:border-t-0">
            <div className="font-mono text-[11px] text-muted uppercase mb-1">Worst case</div>
            <div className="font-display font-bold text-xl">2.9s <span className="font-mono font-medium text-xs text-muted ml-1.5">vs 11.4s</span></div>
          </div>
          <div className="flex-1 p-[18px] px-[22px] bg-white border-t sm:border-t-0 border-line">
            <div className="font-mono text-[11px] text-muted uppercase mb-1">Errors / 1,200</div>
            <div className="font-display font-bold text-xl">6 <span className="font-mono font-medium text-xs text-muted ml-1.5">vs 21</span></div>
          </div>
        </div>
      </div>
    </section>
  );
}
