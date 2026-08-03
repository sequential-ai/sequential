import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const QUESTIONS = [
  {
    idx: '01',
    q: 'Is Sequential AI faster than a single-agent loop for research?',
    a: "Across 1,200 production queries, Sequential AI is 3.5x faster at p50 (556ms vs 1,970ms) and 4.8x faster at p99. A single-agent loop's worst-case query takes nearly 11 seconds — fan-out execution is what keeps the tail latency down.",
    featured: true,
  },
  {
    idx: '02',
    q: 'How does parallel execution change cost, not just speed?',
    a: "Running cheap models across many parallel workers, with one expensive model reserved for final synthesis, keeps the average cost per task low even as source count scales — the cost profile doesn't degrade the way sequential re-prompting does.",
  },
  {
    idx: '03',
    q: 'Do I need my own scraping infrastructure?',
    a: 'No. Search, scraping, extraction, and retries are handled on our side. You send a query through the Task API and get back structured, cited output.',
  },
  {
    idx: '04',
    q: 'What happens when a source fails mid-task?',
    a: 'Failed sources are retried once and, if still unreachable, excluded and flagged in the trace rather than silently guessed at — you never pay for a failed request.',
  },
];

export default function FAQ() {
  const [openIdx, setOpenIdx] = useState('01');

  return (
    <section className="pb-[110px]" id="faq">
      <div className="max-w-[1180px] mx-auto px-8">
        <div className="mb-[30px]">
          <span className="eyebrow flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.08em] text-muted mb-3">FAQ</span>
          <h2 className="font-display font-bold text-[clamp(24px,3.4vw,32px)]">Common questions.</h2>
        </div>
        <div className="max-w-[760px] border-t border-line">
          {QUESTIONS.map((item) => {
            const isOpen = openIdx === item.idx;
            return (
              <div className="border-b border-line" key={item.idx}>
                <button
                  className="w-full flex items-center gap-4 py-5 px-1 text-left text-[15px] font-semibold"
                  onClick={() => setOpenIdx(isOpen ? null : item.idx)}
                  aria-expanded={isOpen}
                >
                  <span className={`font-mono text-[11px] shrink-0 w-[22px] ${item.featured ? 'text-orange' : 'text-muted'}`}>
                    {item.idx}
                  </span>
                  <span className={`flex-1 ${item.featured ? 'text-orange' : ''}`}>{item.q}</span>
                  <ChevronDown
                    size={16}
                    className={`shrink-0 text-ink-soft transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                <div
                  className="overflow-hidden transition-[max-height] duration-[350ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
                  style={{ maxHeight: isOpen ? '400px' : '0px' }}
                >
                  <div className="pb-[22px] pl-[42px] pr-1 text-ink-soft text-[14.5px] max-w-[620px] leading-[1.7]">
                    {item.a}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
