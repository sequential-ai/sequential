const SIZES_A = [34, 29, 40, 22, 31, 26, 36, 24, 30, 38, 27, 33, 25, 29, 32];
const FILLED_A = 15;
const SIZES_B = [34, 29, 40, 22, 31, 26, 20, 18, 24, 16, 22, 19, 17, 20, 18];
const FILLED_B = 6;

function BubbleField({ sizes, filledCount }) {
  return (
    <div className="bubble-field">
      {sizes.map((size, i) => (
        <div
          key={i}
          className={`bubble ${i < filledCount ? 'filled' : 'empty'}`}
          style={{ width: size, height: size }}
        />
      ))}
    </div>
  );
}

export default function Reach() {
  return (
    <section className="reach-section">
      <div className="wrap">
        <div className="speed-head reveal in">
          <h2>Sequential AI reaches more live sources than single-agent loops.</h2>
          <p>
            A single-agent loop's own tools work fine — it's the volume that breaks it. In our
            45-URL benchmark, every source came back with usable content for Sequential AI, with
            full source-and-timestamp reporting.
          </p>
        </div>

        <div className="reach-hero reveal in">
          <div className="reach-a">
            <div className="lbl">Sequential AI coverage</div>
            <div className="big">93%</div>
            <div className="sub">42 / 45 URLs returned usable content</div>
          </div>
          <div className="reach-b">
            <div className="lbl">Single-Agent coverage</div>
            <div className="big">54%</div>
            <div className="diff">−39 points</div>
          </div>
        </div>

        <div className="footnote reveal in" style={{ marginBottom: 12 }}>
          Each bubble is one monitored domain · size = share of content actually usable
        </div>
        <div className="bubble-compare reveal in">
          <div className="bubble-block">
            <h4>Sequential AI <span className="score">15/15 reached</span></h4>
            <div className="caption">Median signal ratio 90.5%</div>
            <BubbleField sizes={SIZES_A} filledCount={FILLED_A} />
          </div>
          <div className="bubble-block dim">
            <h4>Single-Agent <span className="score">6/15 reached</span></h4>
            <div className="caption">Median signal ratio 71.3%</div>
            <BubbleField sizes={SIZES_B} filledCount={FILLED_B} />
          </div>
        </div>
      </div>
    </section>
  );
}
