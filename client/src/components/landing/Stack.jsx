import { AlertTriangle } from 'lucide-react';

const CARDS = [
  {
    title: 'Parallel workers',
    body: 'Fan a task out across up to 20 concurrent research workers, each with its own timeout and retry policy.',
    no: 'Single-Agent — not available',
  },
  {
    title: 'Full trace tree',
    body: 'Every plan, search, scrape, and model call gets its own logged step — so a bad output is a five-minute debug.',
    no: 'Single-Agent — partial logs',
  },
  {
    title: 'Persistent memory',
    body: 'Every completed task feeds a retrievable memory store, scoped per agent or org, with confidence-scored recall.',
    no: 'Single-Agent — not available',
  },
];

export default function Stack() {
  return (
    <section className="stack-section">
      <div className="wrap">
        <div className="stack-head reveal in">
          <span className="eyebrow">The full stack</span>
          <h2>Sequential AI adds coordination where single-agent loops stop.</h2>
          <p>
            A single-agent loop reads one source, decides what's next, reads the next one —
            sequentially. When a task needs ten sources cross-referenced, it's still reading them
            one at a time.
          </p>
        </div>

        <div className="stack-callout reveal in">
          <AlertTriangle size={18} />
          <span>
            A single-agent loop's product surface is search-then-read. When a task needs
            coordinated, parallel execution, there's no version of it that scales — Sequential AI
            was built for the fan-out.
          </span>
        </div>

        <div className="stack-grid reveal in">
          {CARDS.map((c) => (
            <div className="stack-card" key={c.title}>
              <h3>{c.title}</h3>
              <p>{c.body}</p>
              <div className="stack-compare">
                <span className="yes">✓ Sequential AI</span>
                <span className="no">{c.no}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
