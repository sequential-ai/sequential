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
    <section className="speed-section">
      <div className="wrap">
        <div className="speed-head reveal in">
          <h2>Sequential AI research is faster than single-agent loops.</h2>
          <p>
            3.5x faster at p50, 4.8x faster at p99. Single-agent loops read sources one at a time,
            so tail latency compounds fast — the user's experience gets worse exactly when the
            task gets harder.
          </p>
        </div>

        <div className={`runway-panel reveal ${panelInView ? 'in' : ''}`} ref={panelRef}>
          {ROWS.map((row) => (
            <div className="runway-item" key={row.label}>
              <div className="top">
                <span className="lbl">{row.label}</span>
                <span className="win-badge">{row.win}</span>
              </div>
              <div className="lane a">
                <span className="who"><i></i>Sequential AI</span>
                <div className="ruler">
                  <div className="ruler-fill" style={{ width: panelInView ? `${row.a.width}%` : 0 }} />
                </div>
                <span className="val">{row.a.val}</span>
              </div>
              <div className="lane b">
                <span className="who"><i></i>Single-Agent</span>
                <div className="ruler">
                  <div className="ruler-fill" style={{ width: panelInView ? `${row.b.width}%` : 0 }} />
                </div>
                <span className="val">{row.b.val}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="split-stats reveal in">
          <div className="split-stat"><div className="k">Worst case</div><div className="v">2.9s <span className="sub">vs 11.4s</span></div></div>
          <div className="split-stat"><div className="k">Errors / 1,200</div><div className="v">6 <span className="sub">vs 21</span></div></div>
        </div>
      </div>
    </section>
  );
}
