const METRICS = [
  { label: 'P50 LATENCY', value: '556ms', vs: 'vs 1,970ms' },
  { label: 'SOURCE COVERAGE', value: '93%', vs: 'vs 54%' },
  { label: 'DOMAINS REACHED', value: '15/15', vs: 'vs 6/15' },
  { label: 'TOP-SOURCE ACCURACY', value: '91.2%', vs: 'vs 68.4%' },
  { label: 'FAILED REQUESTS BILLED', value: '$0', vs: 'vs billed anyway' },
];

// Duplicated once so the CSS scroll-left keyframe (translateX -50%) loops seamlessly.
const TRACK_ITEMS = [...METRICS, ...METRICS];

export default function Ticker() {
  return (
    <section className="ticker-section">
      <div className="ticker-mask">
        <div className="ticker-track">
          {TRACK_ITEMS.map((m, i) => (
            <span className="ticker-item" key={i}>
              {m.label} &nbsp;<b>{m.value}</b> <span className="vs">{m.vs}</span>
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
