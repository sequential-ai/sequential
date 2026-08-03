import { Layers3, Ban, CheckCircle2 } from 'lucide-react';

const DIFF_PAIRS = [
  { add: <><b>Task API</b> — free, 1,000 calls / mo</>, rm: 'Task API — $0.02–0.05 per call' },
  { add: <><b>Monitor API</b> — included, free</>, rm: 'Monitor API — build it yourself' },
  { add: <><b>Parallel workers</b> — up to 20 concurrent</>, rm: 'Single-agent loop — one worker at a time' },
  { add: <><b>Trace tree</b> — every plan, search, scrape logged</>, rm: 'Trace tree — partial logs only' },
  { add: <><b>Persistent memory</b> — scoped per agent or org</>, rm: 'Persistent memory — not available' },
  { add: <><b>Failed requests</b> — $0, always</>, rm: 'Failed requests — billed anyway' },
];

const HIGHLIGHTS = [
  {
    barCls: 'bg-orange',
    icon: <Layers3 size={16} />,
    num: '20x',
    label: 'concurrent workers on a single task, instead of one loop working through sources alone.',
  },
  {
    barCls: 'bg-lime',
    icon: <Ban size={16} />,
    num: '$0',
    label: "charged for failed requests, always — a single-agent loop bills you even when a source doesn't load.",
  },
  {
    barCls: 'bg-gradient-to-b from-[#C23DBE] to-[#6B3DFF]',
    icon: <CheckCircle2 size={16} />,
    num: '100%',
    label: 'of plan, search, and scrape steps land in the trace tree — nothing runs off the record.',
  },
];

export default function Compare() {
  return (
    <section className="pt-16 pb-[90px]" id="compare">
      <div className="max-w-[1180px] mx-auto px-8">
        <div className="max-w-[560px] mb-[38px]">
          <h2 className="font-display font-bold text-[clamp(24px,3.4vw,32px)] mb-2.5">
            What changes when the run is parallel.
          </h2>
          <p className="text-ink-soft text-[15px]">
            Every line below is a real capability difference, laid out the way our own trace log
            looks — a diff between what ships with each approach.
          </p>
        </div>

        <div className="grid md:grid-cols-[1.7fr_1fr] gap-6 items-start">
          <div className="bg-dark rounded-lg overflow-hidden border border-dark-line shadow-[0_30px_60px_-32px_rgba(23,20,15,0.5),inset_0_1px_0_rgba(255,255,255,0.04)]">
            <div className="flex items-center justify-between gap-2.5 px-5 py-3.5 border-b border-dark-line">
              <div className="flex items-center gap-3">
                <div className="flex gap-[5px]">
                  <i className="w-2 h-2 rounded-full bg-dark-line inline-block" />
                  <i className="w-2 h-2 rounded-full bg-dark-line inline-block" />
                  <i className="w-2 h-2 rounded-full bg-dark-line inline-block" />
                </div>
                <span className="font-mono text-[11.5px] text-cream-on-dark">capabilities.diff</span>
                <span className="font-mono text-[10px] text-muted-on-dark border border-dark-line rounded px-[7px] py-0.5 uppercase tracking-[0.04em]">diff</span>
              </div>
              <span className="font-mono text-[11px] text-muted-on-dark">
                <b className="text-lime font-semibold">+6</b> &nbsp;<b className="text-muted-on-dark font-semibold">−6</b>
              </span>
            </div>
            <div className="py-2 pb-4">
              {DIFF_PAIRS.map((pair, i) => (
                <div key={i}>
                  <div className="flex items-start bg-lime/[0.06] border-l-2 border-lime">
                    <div className="w-[34px] shrink-0 text-right font-mono text-[11px] text-white/[0.18] py-[5px] pr-2.5 select-none">{i * 2 + 1}</div>
                    <div className="w-[22px] shrink-0 text-center font-mono text-[12.5px] py-[5px] text-lime">+</div>
                    <div className="flex-1 font-mono text-[12.5px] py-[5px] pr-5 pl-0.5 text-cream-on-dark [&_b]:text-lime [&_b]:font-semibold">{pair.add}</div>
                  </div>
                  <div className="flex items-start border-l-2 border-transparent">
                    <div className="w-[34px] shrink-0 text-right font-mono text-[11px] text-white/[0.18] py-[5px] pr-2.5 select-none">{i * 2 + 2}</div>
                    <div className="w-[22px] shrink-0 text-center font-mono text-[12.5px] py-[5px] text-muted-on-dark">−</div>
                    <div className="flex-1 font-mono text-[12.5px] py-[5px] pr-5 pl-0.5 text-muted-on-dark">{pair.rm}</div>
                  </div>
                  {i < DIFF_PAIRS.length - 1 && <div className="h-px bg-dark-line my-2 mx-5 ml-14" />}
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3.5">
            {HIGHLIGHTS.map((h) => (
              <div key={h.num} className="relative bg-white border border-line rounded-md overflow-hidden py-5 px-5 pl-[22px]">
                <div className={`absolute left-0 top-0 bottom-0 w-[3px] ${h.barCls}`} />
                <div className="w-[30px] h-[30px] rounded-lg bg-cream-2 flex items-center justify-center mb-3.5 text-ink-soft">{h.icon}</div>
                <div className="font-display font-extrabold text-[28px] leading-none mb-1.5">{h.num}</div>
                <div className="text-[13.5px] text-ink-soft leading-[1.5]">{h.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
