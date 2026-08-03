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
    { label: 'T', bg: 'var(--color-peach)', color: 'var(--color-orange)', delay: '0.30s' },
    { label: 'R', bg: 'var(--color-lime)', color: 'var(--color-lime-ink)', delay: '0.38s' },
    { label: 'D', bg: 'var(--color-dark-line)', color: 'var(--color-cream-on-dark)', delay: '0.46s' },
  ]},
  { delay: '0.12s', q: 'recent fusion startups', badges: [
    { label: 'C', bg: 'var(--color-lime)', color: 'var(--color-lime-ink)', delay: '0.40s' },
    { label: 'T', bg: 'var(--color-peach)', color: 'var(--color-orange)', delay: '0.48s' },
  ]},
  { delay: '0.22s', q: 'government fusion grants', badges: [
    { label: 'D', bg: 'var(--color-dark-line)', color: 'var(--color-cream-on-dark)', delay: '0.50s' },
    { label: 'A', bg: 'var(--color-peach)', color: 'var(--color-orange)', delay: '0.58s' },
  ]},
  { delay: '0.32s', q: 'private fusion investors', badges: [
    { label: 'C', bg: 'var(--color-lime)', color: 'var(--color-lime-ink)', delay: '0.60s' },
    { label: 'R', bg: 'var(--color-dark-line)', color: 'var(--color-cream-on-dark)', delay: '0.68s' },
  ]},
  { delay: '0.42s', q: 'fusion news this week', badges: [
    { label: 'T', bg: 'var(--color-peach)', color: 'var(--color-orange)', delay: '0.70s' },
    { label: 'A', bg: 'var(--color-lime)', color: 'var(--color-lime-ink)', delay: '0.78s' },
  ]},
];

const BROWSER_CARDS = [
  { delay: '0s', site: 'techcrunch.com', wide: false, lines: [
    { w: 'w-4/5', delay: '0.1s' }, { w: 'w-3/5', delay: '0.2s' }, { w: 'w-2/5', delay: '0.3s' },
  ]},
  { delay: '0.1s', site: 'reuters.com', wide: false, lines: [
    { w: 'w-3/5', delay: '0.2s' }, { w: 'w-4/5', delay: '0.3s' }, { w: 'w-2/5', delay: '0.4s' },
  ]},
  { delay: '0.2s', site: 'doe.gov', wide: false, lines: [
    { w: 'w-2/5', delay: '0.3s' }, { w: 'w-4/5', delay: '0.4s' }, { w: 'w-3/5', delay: '0.5s' },
  ]},
  { delay: '0.3s', site: 'crunchbase.com', wide: false, lines: [
    { w: 'w-3/5', delay: '0.4s' }, { w: 'w-2/5', delay: '0.5s' }, { w: 'w-4/5', delay: '0.6s' },
  ]},
  { delay: '0.4s', site: 'arxiv.org', wide: true, lines: [
    { w: 'w-4/5', delay: '0.5s' }, { w: 'w-3/5', delay: '0.6s' },
  ]},
];

const FACT_TAGS = [
  { delay: '0.05s', text: '$2.4B raised' },
  { delay: '0.20s', text: 'DOE grants $180M' },
  { delay: '0.35s', text: 'Helion Series F' },
  { delay: '0.50s', text: '3 new entrants' },
  { delay: '0.65s', text: '+40% YoY' },
];

const RING_C = 2 * Math.PI * 24;

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

  const sceneCls = (n) =>
    `absolute inset-0 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
      step === n ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-2 pointer-events-none'
    }`;

  return (
    <section className="pt-16 pb-24 md:pt-20 md:pb-28">
      <div className="max-w-[1180px] mx-auto px-8 grid md:grid-cols-2 gap-14 items-center">
        <div>
          <div className="font-mono text-[13px] text-ink-soft flex items-center gap-1.5 mb-5">
            <span className="text-orange font-semibold">sequential-ai</span> ~{' '}
            <span>fan-out vs single-agent loops</span>
            <span className="inline-block w-[7px] h-[15px] bg-ink translate-y-px animate-blink" />
          </div>
          <h1 className="font-display font-bold text-[40px] md:text-[54px] leading-[1.06] tracking-tight mb-5">
            The Future Runs on
            <br />
            <span className="text-orange">Intelligence.</span>
          </h1>
          <p className="text-ink-soft text-[16.5px] leading-[1.6] max-w-[440px] mb-8">
            Sequential AI fans a task out across parallel research workers, covers 93% of assigned
            sources vs 54% for a single-agent loop, and keeps a full trace of every step. Task and
            Monitor are free to start.
          </p>
          <div className="mb-10">
            <a href="#compare" className="inline-flex items-center justify-center gap-2 rounded-full bg-ink text-cream text-sm font-semibold px-6 py-3.5 transition-transform hover:-translate-y-0.5 hover:shadow-[0_14px_28px_-10px_rgba(23,20,15,0.45)]">
              View the comparison
            </a>
          </div>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            <span className="eyebrow flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.08em] text-muted">Trusted by</span>
            <div className="flex flex-wrap gap-x-5 gap-y-2 font-display font-semibold text-[15px] text-ink-soft/70">
              <span>Northwind</span>
              <span>Cascade Labs</span>
              <span>Orbital</span>
              <span>Fieldstone</span>
            </div>
          </div>
        </div>

        <div className="relative">
          <div className="absolute -inset-10 bg-orange/20 blur-[80px] rounded-full -z-10" />
          <div className="bg-dark border border-dark-line rounded-lg overflow-hidden shadow-[0_40px_80px_-30px_rgba(20,17,10,0.6)]">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-dark-line">
              <span className="flex items-center gap-3 font-mono text-[11.5px] text-cream-on-dark">
                <span className="flex gap-[5px]">
                  <i className="w-2 h-2 rounded-full bg-dark-line inline-block" />
                  <i className="w-2 h-2 rounded-full bg-dark-line inline-block" />
                  <i className="w-2 h-2 rounded-full bg-dark-line inline-block" />
                </span>
                task.trace
              </span>
              <span className="flex items-center gap-1.5 font-mono text-[11px] text-lime">
                <i className="w-1.5 h-1.5 rounded-full bg-lime inline-block animate-pulse" />
                running
              </span>
            </div>

            <div className="flex items-center justify-between px-5 pt-4 font-mono text-[11.5px] text-muted-on-dark">
              <span>Step <b className="text-cream-on-dark">{step}</b> / 6</span>
              <span className="text-cream-on-dark">{STEP_NAMES[step - 1]}</span>
            </div>
            <div className="flex gap-1 px-5 pt-2.5">
              {STEP_NAMES.map((_, i) => (
                <div
                  key={i}
                  className={`h-[3px] flex-1 rounded-full transition-colors duration-300 ${
                    i < step - 1 ? 'bg-orange-2' : i === step - 1 ? 'bg-orange' : 'bg-dark-line'
                  }`}
                />
              ))}
            </div>

            <div className="relative h-[280px] mx-5 my-5">
              {/* Step 1: query */}
              <div className={sceneCls(1)}>
                <div
                  className={`flex items-center gap-3 bg-dark-surface border border-dark-line rounded-full px-4 py-3 text-cream-on-dark ${
                    pulsing ? 'animate-qpulse' : ''
                  }`}
                >
                  <Search size={16} className="text-muted-on-dark shrink-0" />
                  <div className="flex-1 font-mono text-[13px] whitespace-nowrap overflow-hidden">
                    {typed}
                    <span className="inline-block w-[7px] h-[14px] bg-orange-2 translate-y-px ml-0.5 animate-blink" />
                  </div>
                  <button
                    className={`flex items-center gap-1.5 rounded-full bg-orange text-white text-[12.5px] font-semibold px-3.5 py-2 shrink-0 transition-transform ${
                      pressed ? 'scale-90' : 'scale-100'
                    }`}
                  >
                    Run<ArrowRight size={14} strokeWidth={2.4} />
                  </button>
                </div>
                <div className="flex justify-center gap-1.5 mt-8">
                  <i className="w-1.5 h-1.5 rounded-full bg-muted-on-dark inline-block animate-bounce [animation-delay:0ms]" />
                  <i className="w-1.5 h-1.5 rounded-full bg-muted-on-dark inline-block animate-bounce [animation-delay:150ms]" />
                  <i className="w-1.5 h-1.5 rounded-full bg-muted-on-dark inline-block animate-bounce [animation-delay:300ms]" />
                </div>
                <div className="text-center font-mono text-[11.5px] text-muted-on-dark mt-6">
                  Client sends the query to the Task API
                </div>
              </div>

              {/* Step 2: decompose */}
              <div className={sceneCls(2)}>
                <svg viewBox="0 0 420 210" width="100%" height="210">
                  <circle cx="26" cy="105" r="4.5" fill="var(--color-cream-on-dark)" />
                  <circle cx="26" cy="105" r="9" fill="none" stroke="var(--color-cream-on-dark)" strokeOpacity="0.25" />
                  <text x="26" y="128" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="10.5" fill="var(--color-muted-on-dark)">query</text>

                  {TREE_LINES.map((line, i) => (
                    <path
                      key={i}
                      style={{ transitionDelay: line.delay }}
                      className={`fill-none stroke-dark-line transition-opacity duration-500 ${step === 2 ? 'opacity-100' : 'opacity-0'}`}
                      strokeWidth="1.5"
                      d={`M30,105 C110,105 110,${line.y}  200,${line.y}  C260,${line.y}  260,${line.y}  310,${line.y}`}
                    />
                  ))}

                  {TREE_CHIPS.map((chip, i) => (
                    <g
                      key={i}
                      style={{ transitionDelay: chip.delay }}
                      className={`transition-all duration-500 ${step === 2 ? 'opacity-100' : 'opacity-0'}`}
                    >
                      <rect x="310" y={chip.y} width="106" height="20" rx="10" fill="var(--color-dark-surface)" stroke="var(--color-dark-line)" strokeWidth="1" />
                      <text x="363" y={chip.y + 11} textAnchor="middle" dominantBaseline="central" fontFamily="var(--font-mono)" fontSize="10" fill="var(--color-cream-on-dark)">{chip.label}</text>
                    </g>
                  ))}
                </svg>
              </div>

              {/* Step 3: search */}
              <div className={sceneCls(3)}>
                <div className="flex flex-col gap-2">
                  {SEARCH_ROWS.map((row, i) => (
                    <div
                      key={i}
                      style={{ transitionDelay: row.delay }}
                      className={`flex items-center gap-3 bg-dark-surface border border-dark-line rounded-md px-3.5 py-2.5 transition-all duration-500 ${
                        step === 3 ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'
                      }`}
                    >
                      <div className="w-2.5 h-2.5 rounded-full border-2 border-orange-2 shrink-0 animate-ping" />
                      <span className="flex-1 font-mono text-[12px] text-cream-on-dark">{row.q}</span>
                      <div className="flex gap-1.5">
                        {row.badges.map((b, j) => (
                          <span
                            key={j}
                            style={{ background: b.bg, color: b.color, transitionDelay: b.delay }}
                            className={`w-5 h-5 rounded-full flex items-center justify-center font-mono text-[9.5px] font-bold transition-all duration-500 ${
                              step === 3 ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
                            }`}
                          >
                            {b.label}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Step 4: scrape */}
              <div className={sceneCls(4)}>
                <div className="grid grid-cols-2 gap-2.5">
                  {BROWSER_CARDS.map((card, i) => (
                    <div
                      key={i}
                      style={{ transitionDelay: card.delay }}
                      className={`bg-dark-surface border border-dark-line rounded-md overflow-hidden transition-all duration-500 ${
                        card.wide ? 'col-span-2' : ''
                      } ${step === 4 ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
                    >
                      <div className="flex items-center gap-1.5 px-2.5 py-1.5 border-b border-dark-line">
                        <i className="w-[5px] h-[5px] rounded-full bg-dark-line inline-block" />
                        <i className="w-[5px] h-[5px] rounded-full bg-dark-line inline-block" />
                        <i className="w-[5px] h-[5px] rounded-full bg-dark-line inline-block" />
                        <span className="font-mono text-[9.5px] text-muted-on-dark ml-1 truncate">{card.site}</span>
                      </div>
                      <div className="flex flex-col gap-1.5 p-2.5">
                        {card.lines.map((line, j) => (
                          <div key={j} className={`h-1.5 rounded-full bg-dark-line overflow-hidden ${line.w}`}>
                            <i
                              style={{ transitionDelay: line.delay }}
                              className={`block h-full bg-orange-2/50 transition-transform duration-500 origin-left ${
                                step === 4 ? 'scale-x-100' : 'scale-x-0'
                              }`}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Step 5: extract */}
              <div className={sceneCls(5)}>
                <div className="flex items-center justify-center gap-4 mb-7">
                  <div className="bg-dark-surface border border-dark-line rounded-md px-4 py-2.5 font-mono text-[11.5px] text-muted-on-dark">
                    Scraped content
                  </div>
                  <div className="relative w-14 h-px bg-dark-line overflow-hidden">
                    <span className="absolute top-0 -left-1 w-2 h-2 -translate-y-1/2 rounded-full bg-orange-2 animate-flowmove" style={{ animationDelay: '0s' }} />
                    <span className="absolute top-0 -left-1 w-2 h-2 -translate-y-1/2 rounded-full bg-orange-2 animate-flowmove" style={{ animationDelay: '0.65s' }} />
                  </div>
                  <div className="relative bg-orange/10 border border-orange/30 rounded-md px-4 py-2.5 font-mono text-[11.5px] text-orange-2 font-semibold">
                    LLM extractor
                    <span className="absolute inset-0 rounded-md bg-orange/20 animate-llmpulse -z-10" />
                  </div>
                </div>
                <div className="flex flex-wrap justify-center gap-2">
                  {FACT_TAGS.map((tag, i) => (
                    <span
                      key={i}
                      style={{ transitionDelay: tag.delay }}
                      className={`flex items-center gap-1.5 bg-lime/10 border border-lime/30 rounded-full px-3 py-1.5 font-mono text-[11px] text-lime transition-all duration-500 ${
                        step === 5 ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
                      }`}
                    >
                      <b>✓</b>{tag.text}
                    </span>
                  ))}
                </div>
              </div>

              {/* Step 6: synthesize */}
              <div className={sceneCls(6)}>
                <div className="flex items-center justify-between mb-5">
                  <div className="relative w-14 h-14">
                    <svg viewBox="0 0 56 56" width="56" height="56">
                      <circle cx="28" cy="28" r="24" fill="none" stroke="var(--color-dark-line)" strokeWidth="4" />
                      <circle
                        cx="28" cy="28" r="24"
                        fill="none"
                        stroke="var(--color-lime)"
                        strokeWidth="4"
                        strokeLinecap="round"
                        transform="rotate(-90 28 28)"
                        style={{
                          strokeDasharray: RING_C,
                          strokeDashoffset: step === 6 ? RING_C * (1 - 0.91) : RING_C,
                          transition: 'stroke-dashoffset 1s var(--ease-brand)',
                        }}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center font-mono text-[11px] font-bold text-cream-on-dark">91%</div>
                  </div>
                  <div className="flex items-center gap-2 bg-lime/10 border border-lime/30 rounded-full px-3.5 py-2 font-mono text-[12px] font-semibold text-lime">
                    <Check size={16} strokeWidth={2.4} />
                    Answer ready
                  </div>
                </div>
                <div className="bg-dark-surface border border-dark-line rounded-md p-4 font-mono text-[11.5px] leading-[1.7] text-muted-on-dark">
                  {'{'}
                  <span className="text-orange-2">"answer"</span>:{' '}
                  <span className="text-lime">"Fusion funding rose ~40% this quarter..."</span>,{' '}
                  <span className="text-orange-2">"sources"</span>: <span className="text-cream-on-dark">14</span>,{' '}
                  <span className="text-orange-2">"workers"</span>: <span className="text-cream-on-dark">5</span>,{' '}
                  <span className="text-orange-2">"confidence"</span>: <span className="text-cream-on-dark">0.91</span>
                  {'}'}
                </div>
                <div className="flex items-center justify-center gap-1.5 font-mono text-[11px] text-muted-on-dark mt-5">
                  <RotateCw size={13} className="animate-spin [animation-duration:2s]" />
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
