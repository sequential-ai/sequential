import LogoMark from './LogoMark';

const COLUMNS = [
  { title: 'Product', links: ['Task API', 'Monitor API', 'Memory API', 'Observability'] },
  { title: 'Developers', links: ['Documentation', 'SDKs', 'API reference', 'Status'] },
  { title: 'Company', links: ['About', 'Blog', 'Careers'] },
  { title: 'Legal', links: ['Privacy', 'Terms', 'Security'] },
];

export default function Footer() {
  return (
    <footer className="bg-cream pt-14 pb-7">
      <div className="max-w-[1180px] mx-auto px-8">
        <div className="grid md:grid-cols-[1.6fr_1fr_1fr_1fr_1fr] sm:grid-cols-2 gap-8 mb-11">
          <div>
            <a href="#" className="flex items-center gap-[9px] font-display font-bold text-[16.5px]">
              <LogoMark />
              Sequential AI
            </a>
            <p className="text-muted text-[13px] mt-3 max-w-[220px]">
              The execution layer for AI agents — parallel research, monitoring, and memory, built for developers.
            </p>
          </div>
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h4 className="font-mono text-[11px] uppercase tracking-[0.05em] text-muted mb-3.5 font-medium">{col.title}</h4>
              <ul className="flex flex-col gap-2.5">
                {col.links.map((link) => (
                  <li key={link}>
                    <a href="#" className="text-[13.5px] text-ink-soft hover:text-ink transition-colors">{link}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="flex justify-between items-center pt-6 border-t border-line text-[12.5px] text-muted flex-wrap gap-3">
          <span>© 2026 Sequential AI. All rights reserved.</span>
          <span>All benchmark data reproducible · see methodology</span>
        </div>
      </div>
    </footer>
  );
}
