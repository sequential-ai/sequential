const CARDS = [
  {
    className: 'a',
    tag: 'QA',
    title: 'Task quality',
    body: 'A 250-question sample of real developer research queries, human-graded pass/fail on cited accuracy and end-to-end usefulness.',
  },
  {
    className: 'b',
    tag: 'LAT',
    title: 'Production latency',
    body: 'A 1,200-query production sample. p50, p99, and worst-case timed under identical concurrent load for both approaches.',
  },
  {
    className: 'c',
    tag: 'COV',
    title: 'Source coverage',
    body: 'A 45-URL benchmark measuring how many assigned sources actually resolve to live, on-topic, citable content.',
  },
];

export default function Benchmarks() {
  return (
    <section className="test-section" id="benchmarks">
      <div className="wrap">
        <div className="test-head reveal in">
          <span className="eyebrow">How we tested</span>
          <h2>Benchmarks, not adjectives.</h2>
          <p>Every number on this page comes from a reproducible test. Same inputs, same harness, scored the same way.</p>
        </div>
        <div className="test-grid reveal in">
          {CARDS.map((c) => (
            <div className={`test-card ${c.className}`} key={c.tag}>
              <span className="test-tag">{c.tag}</span>
              <h3>{c.title}</h3>
              <p>{c.body}</p>
            </div>
          ))}
        </div>
        <a href="#" className="test-link reveal in">See the full benchmark methodology →</a>
      </div>
    </section>
  );
}
