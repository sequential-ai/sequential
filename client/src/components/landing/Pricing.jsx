const ROWS = [
  { label: 'Task API', a: 'Free', b: '$0.02–0.05 / call' },
  { label: 'Monitor API', a: 'Free', b: '— build it yourself' },
  { label: 'Parallel workers', a: 'Included', b: 'up to 20,000 credits' },
  { label: 'Free tier', a: '1,000 free credits / mo', b: 'none' },
  { label: 'Failed requests', a: '$0', b: 'billed anyway' },
];

export default function Pricing() {
  return (
    <section className="cost-section" id="pricing">
      <div className="wrap">
        <div className="cost-head reveal in">
          <span className="eyebrow">Pricing</span>
          <h2>Task and Monitor are free.</h2>
          <p>Usage-based pricing on everything else, billed only for what actually ran.</p>
        </div>

        <div className="ledger reveal in">
          <div className="ledger-row head"><div>Capability</div><div className="col-a">Sequential AI</div><div>Single-Agent</div></div>
          {ROWS.map((row) => (
            <div className="ledger-row" key={row.label}>
              <div>{row.label}</div>
              <div className="col-a">{row.a}</div>
              <div>{row.b}</div>
            </div>
          ))}
        </div>

        <div className="receipt reveal in">
          <div className="txt">At 10,000 tasks and 10,000 monitor checks per month, the bill speaks for itself.</div>
          <div className="receipt-nums">
            <div className="n a"><div className="who">Sequential AI</div><div className="amt">$0</div></div>
            <span className="arrow">/</span>
            <div className="n b"><div className="who">Self-built stack</div><div className="amt">~$340</div></div>
          </div>
        </div>
      </div>
    </section>
  );
}
