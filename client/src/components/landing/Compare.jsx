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
    className: 'c1',
    icon: <Layers3 size={16} />,
    num: '20x',
    label: 'concurrent workers on a single task, instead of one loop working through sources alone.',
  },
  {
    className: 'c2',
    icon: <Ban size={16} />,
    num: '$0',
    label: "charged for failed requests, always — a single-agent loop bills you even when a source doesn't load.",
  },
  {
    className: 'c3',
    icon: <CheckCircle2 size={16} />,
    num: '100%',
    label: 'of plan, search, and scrape steps land in the trace tree — nothing runs off the record.',
  },
];

export default function Compare() {
  return (
    <section className="compare-section" id="compare">
      <div className="wrap">
        <div className="compare-head reveal in">
          <h2>What changes when the run is parallel.</h2>
          <p>
            Every line below is a real capability difference, laid out the way our own trace log
            looks — a diff between what ships with each approach.
          </p>
        </div>

        <div className="compare-grid">
          <div className="diff-panel reveal in">
            <div className="diff-head">
              <div className="left">
                <div className="dots"><i></i><i></i><i></i></div>
                <span className="filename">capabilities.diff</span>
                <span className="lang">diff</span>
              </div>
              <span className="stat"><b className="plus">+6</b> &nbsp;<b className="minus">−6</b></span>
            </div>
            <div className="diff-body">
              {DIFF_PAIRS.map((pair, i) => (
                <div key={i}>
                  <div className="diff-row add">
                    <div className="lineno">{i * 2 + 1}</div>
                    <div className="gutter">+</div>
                    <div className="content">{pair.add}</div>
                  </div>
                  <div className="diff-row rm">
                    <div className="lineno">{i * 2 + 2}</div>
                    <div className="gutter">−</div>
                    <div className="content">{pair.rm}</div>
                  </div>
                  {i < DIFF_PAIRS.length - 1 && <div className="diff-divider"></div>}
                </div>
              ))}
            </div>
          </div>

          <div className="highlight-stack reveal in">
            {HIGHLIGHTS.map((h) => (
              <div className={`highlight-card ${h.className}`} key={h.num}>
                <div className="icon">{h.icon}</div>
                <div className="num">{h.num}</div>
                <div className="lbl">{h.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
