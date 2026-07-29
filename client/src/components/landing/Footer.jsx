import LogoMark from './LogoMark';

const COLUMNS = [
  { title: 'Product', links: ['Task API', 'Monitor API', 'Memory API', 'Observability'] },
  { title: 'Developers', links: ['Documentation', 'SDKs', 'API reference', 'Status'] },
  { title: 'Company', links: ['About', 'Blog', 'Careers'] },
  { title: 'Legal', links: ['Privacy', 'Terms', 'Security'] },
];

export default function Footer() {
  return (
    <footer>
      <div className="wrap">
        <div className="footer-grid">
          <div className="footer-brand">
            <a href="#" className="logo">
              <LogoMark />
              Sequential AI
            </a>
            <p>The execution layer for AI agents — parallel research, monitoring, and memory, built for developers.</p>
          </div>
          {COLUMNS.map((col) => (
            <div className="footer-col" key={col.title}>
              <h4>{col.title}</h4>
              <ul>
                {col.links.map((link) => (
                  <li key={link}><a href="#">{link}</a></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="footer-bottom">
          <span>© 2026 Sequential AI. All rights reserved.</span>
          <span>All benchmark data reproducible · see methodology</span>
        </div>
      </div>
    </footer>
  );
}
