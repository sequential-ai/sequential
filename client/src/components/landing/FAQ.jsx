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
    <section className="faq-section" id="faq">
      <div className="wrap">
        <div className="faq-head reveal in">
          <span className="eyebrow">FAQ</span>
          <h2>Common questions.</h2>
        </div>
        <div className="faq-list reveal in">
          {QUESTIONS.map((item) => {
            const isOpen = openIdx === item.idx;
            return (
              <div
                className={`faq-item ${item.featured ? 'featured' : ''} ${isOpen ? 'open' : ''}`}
                key={item.idx}
              >
                <button
                  className="faq-q"
                  onClick={() => setOpenIdx(isOpen ? null : item.idx)}
                  aria-expanded={isOpen}
                >
                  <span className="idx">{item.idx}</span>
                  <span className="qtxt">{item.q}</span>
                  <ChevronDown className="chev" size={16} />
                </button>
                <div className="faq-a" style={{ maxHeight: isOpen ? '400px' : '0px' }}>
                  <div className="faq-a-inner">{item.a}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
