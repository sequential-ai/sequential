const CARDS = [
  {
    barCls: 'bg-orange',
    tag: 'QA',
    title: 'Task quality',
    body: 'A 250-question sample of real developer research queries, human-graded pass/fail on cited accuracy and end-to-end usefulness.',
  },
  {
    barCls: 'bg-lime',
    tag: 'LAT',
    title: 'Production latency',
    body: 'A 1,200-query production sample. p50, p99, and worst-case timed under identical concurrent load for both approaches.',
  },
  {
    barCls: 'bg-gradient-to-r from-[#C23DBE] to-[#6B3DFF]',
    tag: 'COV',
    title: 'Source coverage',
    body: 'A 45-URL benchmark measuring how many assigned sources actually resolve to live, on-topic, citable content.',
  },
];

export default function Benchmarks() {
  return (
    <section className="py-[90px] bg-cream-2" id="benchmarks">
      <div className="max-w-[1180px] mx-auto px-8">
        <div className="max-w-[540px] mb-10">
          <span className="eyebrow flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.08em] text-muted mb-3">How we tested</span>
          <h2 className="font-display font-bold text-[clamp(26px,3.6vw,36px)] mb-3.5">Benchmarks, not adjectives.</h2>
          <p className="text-ink-soft text-[15.5px]">Every number on this page comes from a reproducible test. Same inputs, same harness, scored the same way.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-px bg-line-strong border border-line-strong rounded-lg overflow-hidden">
          {CARDS.map((c) => (
            <div key={c.tag} className="relative bg-white p-7 px-6">
              <div className={`absolute top-0 left-0 w-full h-[3px] ${c.barCls}`} />
              <span className="inline-block font-mono text-[10.5px] font-semibold tracking-[0.06em] px-[9px] py-1 rounded-[5px] bg-cream-2 text-ink-soft mb-4">{c.tag}</span>
              <h3 className="text-[16.5px] font-display font-semibold mb-[9px]">{c.title}</h3>
              <p className="text-[13.6px] text-ink-soft leading-[1.65]">{c.body}</p>
            </div>
          ))}
        </div>
        <a href="#" className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink mt-[30px]">
          See the full benchmark methodology →
        </a>
      </div>
    </section>
  );
}
