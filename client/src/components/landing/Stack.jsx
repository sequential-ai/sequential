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
    <section className="bg-dark text-cream-on-dark py-[100px]">
      <div className="max-w-[1180px] mx-auto px-8">
        <div className="max-w-[640px] mb-9">
          <span className="eyebrow flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.08em] text-muted-on-dark mb-3 [&::before]:bg-orange-2">
            The full stack
          </span>
          <h2 className="text-cream-on-dark font-display font-bold text-[clamp(26px,3.8vw,38px)] my-3.5">
            Sequential AI adds coordination where single-agent loops stop.
          </h2>
          <p className="text-muted-on-dark text-[15.5px]">
            A single-agent loop reads one source, decides what's next, reads the next one —
            sequentially. When a task needs ten sources cross-referenced, it's still reading them
            one at a time.
          </p>
        </div>

        <div className="border-l-[3px] border-orange-2 rounded-r-md bg-dark-surface p-5 px-6 mb-7 flex gap-3.5 items-start text-sm text-cream-on-dark">
          <AlertTriangle size={18} className="shrink-0 text-orange-2 mt-0.5" />
          <span>
            A single-agent loop's product surface is search-then-read. When a task needs
            coordinated, parallel execution, there's no version of it that scales — Sequential AI
            was built for the fan-out.
          </span>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {CARDS.map((c) => (
            <div
              key={c.title}
              className="border border-dark-line bg-dark-surface p-[26px]"
              style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 18px), calc(100% - 18px) 100%, 0 100%)' }}
            >
              <h3 className="text-cream-on-dark text-base font-display font-semibold mb-2.5">{c.title}</h3>
              <p className="text-muted-on-dark text-[13.5px] leading-[1.6] mb-[18px]">{c.body}</p>
              <div className="flex flex-col gap-[7px] font-mono text-[11.5px] pt-3.5 border-t border-dashed border-dark-line">
                <span className="text-lime">✓ Sequential AI</span>
                <span className="text-muted-on-dark">{c.no}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
