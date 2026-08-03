const SIZES_A = [34, 29, 40, 22, 31, 26, 36, 24, 30, 38, 27, 33, 25, 29, 32];
const FILLED_A = 15;
const SIZES_B = [34, 29, 40, 22, 31, 26, 20, 18, 24, 16, 22, 19, 17, 20, 18];
const FILLED_B = 6;

function BubbleField({ sizes, filledCount }) {
  return (
    <div className="flex flex-wrap items-center gap-2 min-h-[120px] p-4 border border-line rounded-md bg-white">
      {sizes.map((size, i) => (
        <div
          key={i}
          className={`rounded-full flex items-center justify-center ${
            i < filledCount ? 'bg-orange' : 'bg-cream-2 border-[1.5px] border-dashed border-line-strong'
          }`}
          style={{ width: size, height: size }}
        />
      ))}
    </div>
  );
}

export default function Reach() {
  return (
    <section className="pb-[100px]">
      <div className="max-w-[1180px] mx-auto px-8">
        <div className="max-w-[600px] mb-[34px]">
          <h2 className="font-display font-bold text-[clamp(26px,3.8vw,38px)] mb-3.5">
            Sequential AI reaches more live sources than single-agent loops.
          </h2>
          <p className="text-ink-soft text-[15.5px]">
            A single-agent loop's own tools work fine — it's the volume that breaks it. In our
            45-URL benchmark, every source came back with usable content for Sequential AI, with
            full source-and-timestamp reporting.
          </p>
        </div>

        <div className="grid md:grid-cols-[1.3fr_1fr] border border-line-strong rounded-lg overflow-hidden mb-[34px]">
          <div className="bg-dark text-cream-on-dark p-[34px] px-8">
            <div className="font-mono text-[11.5px] text-muted-on-dark uppercase mb-2.5">Sequential AI coverage</div>
            <div className="font-display font-extrabold text-[54px] leading-none text-orange-2">93%</div>
            <div className="text-[13px] text-muted-on-dark mt-2.5">42 / 45 URLs returned usable content</div>
          </div>
          <div className="bg-white p-[34px] px-8 flex flex-col justify-center">
            <div className="font-mono text-[11.5px] text-muted uppercase mb-2.5">Single-Agent coverage</div>
            <div className="font-display font-extrabold text-[46px] leading-none text-muted">54%</div>
            <div className="font-mono text-xs text-orange font-semibold mt-2.5">−39 points</div>
          </div>
        </div>

        <div className="text-[12.5px] text-ink-soft mb-3">
          Each bubble is one monitored domain · size = share of content actually usable
        </div>
        <div className="grid md:grid-cols-2 gap-[26px]">
          <div>
            <h4 className="font-mono text-xs text-ink-soft mb-1 flex items-center gap-2">
              Sequential AI <span className="font-bold text-orange">15/15 reached</span>
            </h4>
            <div className="text-xs text-muted mb-3.5">Median signal ratio 90.5%</div>
            <BubbleField sizes={SIZES_A} filledCount={FILLED_A} />
          </div>
          <div className="opacity-70">
            <h4 className="font-mono text-xs text-ink-soft mb-1 flex items-center gap-2">
              Single-Agent <span className="font-bold text-muted">6/15 reached</span>
            </h4>
            <div className="text-xs text-muted mb-3.5">Median signal ratio 71.3%</div>
            <BubbleField sizes={SIZES_B} filledCount={FILLED_B} />
          </div>
        </div>
      </div>
    </section>
  );
}
