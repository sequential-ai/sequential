import { useEffect, useRef, useState } from 'react';
import { Search, ArrowRight, Check, RotateCw } from 'lucide-react';

const QUERY = 'latest funding rounds in fusion energy';
const STEP_NAMES = [
  'Type the query',
  'Decompose into sub-queries',
  'Search the web',
  'Scrape each source',
  'Extract facts with LLM',
  'Synthesize final answer',
];

const TREE_CHIPS = [
  { y: 4, delay: '0.55s', label: 'funding 2026' },
  { y: 48, delay: '0.63s', label: 'new startups' },
  { y: 95, delay: '0.71s', label: 'govt. grants' },
  { y: 142, delay: '0.79s', label: 'private investors' },
  { y: 186, delay: '0.87s', label: "this week's news" },
];

const TREE_LINES = [
  { y: 14, delay: '0s' },
  { y: 58, delay: '0.08s' },
  { y: 105, delay: '0.16s' },
  { y: 152, delay: '0.24s' },
  { y: 196, delay: '0.32s' },
];

const SEARCH_ROWS = [
  { delay: '0.02s', q: 'fusion funding 2026', badges: [
    { label: 'T', bg: 'var(--peach)', color: 'var(--orange)', delay: '0.30s' },
    { label: 'R', bg: 'var(--lime)', color: 'var(--lime-ink)', delay: '0.38s' },
    { label: 'D', bg: 'var(--dark-line)', color: 'var(--cream-on-dark)', delay: '0.46s' },
  ]},
  { delay: '0.12s', q: 'recent fusion startups', badges: [
    { label: 'C', bg: 'var(--lime)', color: 'var(--lime-ink)', delay: '0.40s' },
    { label: 'T', bg: 'var(--peach)', color: 'var(--orange)', delay: '0.48s' },
  ]},
  { delay: '0.22s', q: 'government fusion grants', badges: [
    { label: 'D', bg: 'var(--dark-line)', color: 'var(--cream-on-dark)', delay: '0.50s' },
    { label: 'A', bg: 'var(--peach)', color: 'var(--orange)', delay: '0.58s' },
  ]},
  { delay: '0.32s', q: 'private fusion investors', badges: [
    { label: 'C', bg: 'var(--lime)', color: 'var(--lime-ink)', delay: '0.60s' },
    { label: 'R', bg: 'var(--dark-line)', color: 'var(--cream-on-dark)', delay: '0.68s' },
  ]},
  { delay: '0.42s', q: 'fusion news this week', badges: [
    { label: 'T', bg: 'var(--peach)', color: 'var(--orange)', delay: '0.70s' },
    { label: 'A', bg: 'var(--lime)', color: 'var(--lime-ink)', delay: '0.78s' },
  ]},
];

const BROWSER_CARDS = [
  { delay: '0s', site: 'techcrunch.com', wide: false, lines: [
    { w: 'w80', delay: '0.1s' }, { w: 'w60', delay: '0.2s' }, { w: 'w40', delay: '0.3s' },
  ]},
  { delay: '0.1s', site: 'reuters.com', wide: false, lines: [
    { w: 'w60', delay: '0.2s' }, { w: 'w80', delay: '0.3s' }, { w: 'w40', delay: '0.4s' },
  ]},
  { delay: '0.2s', site: 'doe.gov', wide: false, lines: [
    { w: 'w40', delay: '0.3s' }, { w: 'w80', delay: '0.4s' }, { w: 'w60', delay: '0.5s' },
  ]},
  { delay: '0.3s', site: 'crunchbase.com', wide: false, lines: [
    { w: 'w60', delay: '0.4s' }, { w: 'w40', delay: '0.5s' }, { w: 'w80', delay: '0.6s' },
  ]},
  { delay: '0.4s', site: 'arxiv.org', wide: true, lines: [
    { w: 'w80', delay: '0.5s' }, { w: 'w60', delay: '0.6s' },
  ]},
];

const FACT_TAGS = [
  { delay: '0.05s', text: '$2.4B raised' },
  { delay: '0.20s', text: 'DOE grants $180M' },
  { delay: '0.35s', text: 'Helion Series F' },
  { delay: '0.50s', text: '3 new entrants' },
  { delay: '0.65s', text: '+40% YoY' },
];

function wait(ms, reduced) {
  return new Promise((resolve) => setTimeout(resolve, reduced ? Math.min(ms, 80) : ms));
}

export default function Hero() {
  const [step, setStep] = useState(1);
  const [typed, setTyped] = useState('');
  const [pressed, setPressed] = useState(false);
  const [pulsing, setPulsing] = useState(false);
  const cancelledRef = useRef(false);

  useEffect(() => {
    cancelledRef.current = false;
    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    async function step1() {
      setStep(1);
      setTyped('');
      await wait(350, reduced);
      for (let i = 0; i < QUERY.length; i++) {
        if (cancelledRef.current) return;
        setTyped(QUERY.slice(0, i + 1));
        await wait(28, reduced);
      }
      await wait(400, reduced);
      setPressed(true);
      setPulsing(true);
      await wait(220, reduced);
      setPressed(false);
      await wait(200, reduced);
      setPulsing(false);
      await wait(500, reduced);
    }

    async function loop() {
      while (!cancelledRef.current) {
        await step1();
        if (cancelledRef.current) return;
        setStep(2); await wait(2000, reduced);
        if (cancelledRef.current) return;
        setStep(3); await wait(2200, reduced);
        if (cancelledRef.current) return;
        setStep(4); await wait(2200, reduced);
        if (cancelledRef.current) return;
        setStep(5); await wait(2400, reduced);
        if (cancelledRef.current) return;
        setStep(6); await wait(2800, reduced);
      }
    }

    loop();
    return () => { cancelledRef.current = true; };
  }, []);

  return (
    <section className="hero">
      <div className="wrap hero-grid">
        <div>
          <div className="prompt-line reveal in">
            <span className="tag">sequential-ai</span> ~ <span>fan-out vs single-agent loops</span>
            <span className="cursor"></span>
          </div>
          <h1 className="reveal in">
            The Future Runs on
            <br />
            <span className="fade">Intelligence.</span>
          </h1>
          <p className="lede reveal in">
            Sequential AI fans a task out across parallel research workers, covers 93% of assigned
            sources vs 54% for a single-agent loop, and keeps a full trace of every step. Task and
            Monitor are free to start.
          </p>
          <div className="hero-ctas reveal in">
            <a href="#compare" className="btn btn-dark">View the comparison</a>
          </div>
          <div className="trust-row reveal in">
            <span className="eyebrow">Trusted by</span>
            <div className="marks">
              <span>Northwind</span>
              <span>Cascade Labs</span>
              <span>Orbital</span>
              <span>Fieldstone</span>
            </div>
          </div>
        </div>

        <div className="fanout-wrap reveal in">
          <div className="fanout-glow"></div>
          <div className="fanout-card">
            <div className="cap">
              <span className="filetag">
                <span className="dots"><i></i><i></i><i></i></span>
                task.trace
              </span>
              <span className="live"><i></i>running</span>
            </div>

            <div className="step-label">
              <span>Step <b>{step}</b> / 6</span>
              <span className="name">{STEP_NAMES[step - 1]}</span>
            </div>
            <div className="stepper">
              {STEP_NAMES.map((_, i) => (
                <div
                  key={i}
                  className={`seg ${i < step - 1 ? 'done' : ''} ${i === step - 1 ? 'active' : ''}`}
                />
              ))}
            </div>

            <div className="stage">
              {/* Step 1: query */}
              <div className={`scene ${step === 1 ? 'active' : ''}`} data-step="1">
                <div className={`q-box ${pulsing ? 'pulse' : ''}`}>
                  <Search size={16} />
                  <div className="q-text">{typed}<span className="q-cursor"></span></div>
                  <button className={`q-btn ${pressed ? 'pressed' : ''}`}>
                    Run<ArrowRight size={14} strokeWidth={2.4} />
                  </button>
                </div>
                <div className="q-orbit"><i></i><i></i><i></i></div>
                <div className="q-hint">Client sends the query to the Task API</div>
              </div>

              {/* Step 2: decompose */}
              <div className={`scene ${step === 2 ? 'active' : ''}`} data-step="2">
                <svg className="tree-svg" viewBox="0 0 420 210" width="100%" height="210">
                  <circle className="tree-root-dot" cx="26" cy="105" r="4.5" />
                  <circle className="tree-root-ring" cx="26" cy="105" r="9" />
                  <text x="26" y="128" textAnchor="middle" className="tree-root-txt">query</text>

                  {TREE_LINES.map((line, i) => (
                    <path
                      key={i}
                      className="tree-line"
                      style={{ transitionDelay: line.delay }}
                      d={`M30,105 C110,105 110,${line.y}  200,${line.y}  C260,${line.y}  260,${line.y}  310,${line.y}`}
                    />
                  ))}

                  {TREE_CHIPS.map((chip, i) => (
                    <g key={i} className="tree-chip" style={{ transitionDelay: chip.delay }}>
                      <rect x="310" y={chip.y} width="106" height="20" rx="10" fill="var(--dark-surface)" stroke="var(--dark-line)" strokeWidth="1" />
                      <text x="363" y={chip.y + 11} textAnchor="middle" dominantBaseline="central" className="tree-node-txt">{chip.label}</text>
                    </g>
                  ))}
                </svg>
              </div>

              {/* Step 3: search */}
              <div className={`scene ${step === 3 ? 'active' : ''}`} data-step="3">
                <div className="search-rows">
                  {SEARCH_ROWS.map((row, i) => (
                    <div className="srow" style={{ transitionDelay: row.delay }} key={i}>
                      <div className="radar"></div><span className="q">{row.q}</span>
                      <div className="badge-row">
                        {row.badges.map((b, j) => (
                          <span className="badge" style={{ background: b.bg, color: b.color, transitionDelay: b.delay }} key={j}>{b.label}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Step 4: scrape */}
              <div className={`scene ${step === 4 ? 'active' : ''}`} data-step="4">
                <div className="browser-grid">
                  {BROWSER_CARDS.map((card, i) => (
                    <div className={`browser-card ${card.wide ? 'wide' : ''}`} style={{ transitionDelay: card.delay }} key={i}>
                      <div className="bc-top"><i></i><i></i><i></i><span>{card.site}</span></div>
                      <div className="bc-body">
                        {card.lines.map((line, j) => (
                          <div className={`bc-line ${line.w}`} key={j}><i style={{ transitionDelay: line.delay }}></i></div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Step 5: extract */}
              <div className={`scene ${step === 5 ? 'active' : ''}`} data-step="5">
                <div className="llm-flow">
                  <div className="flow-card">Scraped content</div>
                  <div className="flow-line">
                    <span className="flow-dot" style={{ animationDelay: '0s' }}></span>
                    <span className="flow-dot" style={{ animationDelay: '0.65s' }}></span>
                  </div>
                  <div className="flow-card llm">LLM extractor</div>
                </div>
                <div className="fact-tags">
                  {FACT_TAGS.map((tag, i) => (
                    <span className="fact-tag" style={{ transitionDelay: tag.delay }} key={i}><b>✓</b>{tag.text}</span>
                  ))}
                </div>
              </div>

              {/* Step 6: synthesize */}
              <div className={`scene ${step === 6 ? 'active' : ''}`} data-step="6">
                <div className="synth-top">
                  <div className="ring-wrap">
                    <svg viewBox="0 0 56 56" width="56" height="56">
                      <circle className="ring-bg" cx="28" cy="28" r="24" />
                      <circle
                        className="ring-fg"
                        cx="28" cy="28" r="24"
                        transform="rotate(-90 28 28)"
                      />
                    </svg>
                    <div className="ring-pct">91%</div>
                  </div>
                  <div className="ready-badge">
                    <Check size={16} strokeWidth={2.4} />
                    Answer ready
                  </div>
                </div>
                <div className="json-block">
                  {'{'}
                  <span className="k">"answer"</span>: <span className="s">"Fusion funding rose ~40% this quarter..."</span>,{' '}
                  <span className="k">"sources"</span>: <span className="p">14</span>,{' '}
                  <span className="k">"workers"</span>: <span className="p">5</span>,{' '}
                  <span className="k">"confidence"</span>: <span className="p">0.91</span>
                  {'}'}
                </div>
                <div className="loop-note">
                  <RotateCw size={16} />
                  starting next task
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
