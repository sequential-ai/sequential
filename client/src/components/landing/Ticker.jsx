const METRICS = [
  { label: 'P50 LATENCY', value: '556ms', vs: 'vs 1,970ms' },
  { label: 'SOURCE COVERAGE', value: '93%', vs: 'vs 54%' },
  { label: 'DOMAINS REACHED', value: '15/15', vs: 'vs 6/15' },
  { label: 'TOP-SOURCE ACCURACY', value: '91.2%', vs: 'vs 68.4%' },
  { label: 'FAILED REQUESTS BILLED', value: '$0', vs: 'vs billed anyway' },
];

// Duplicated once so the animate-scroll-left keyframe (translateX -50%) loops seamlessly.
const TRACK_ITEMS = [...METRICS, ...METRICS];

export default function Ticker() {
  return (
    <section className="bg-ink overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_5%,black_95%,transparent)] motion-reduce:[mask-image:none]">
      <div className="flex w-max animate-scroll-left motion-reduce:animate-none">
        {TRACK_ITEMS.map((m, i) => (
          <span
            key={i}
            className="flex items-center gap-2.5 px-[30px] py-[13px] font-mono text-[12.5px] text-cream whitespace-nowrap border-r border-dark-line"
          >
            {m.label} &nbsp;<b className="text-orange-2 font-semibold">{m.value}</b>{' '}
            <span className="text-muted-on-dark">{m.vs}</span>
          </span>
        ))}
      </div>
    </section>
  );
}
