import LogoMark from './LogoMark';

export default function Navbar() {
  return (
    <>
      <div className="top-bar">
        Task and Monitor are free on every plan — <a href="#pricing">see pricing</a>
      </div>

      <header>
        <nav>
          <a href="#" className="logo">
            <LogoMark />
            Sequential AI
          </a>
          <div className="nav-links">
            <a href="#compare">Compare</a>
            <a href="#benchmarks">Benchmarks</a>
            <a href="#pricing">Pricing</a>
            <a href="#faq">FAQ</a>
          </div>
          <div className="nav-cta">
            <a href="#" className="btn btn-outline btn-sm">Log in</a>
            <a href="#" className="btn btn-dark btn-sm">Sign up</a>
          </div>
        </nav>
      </header>
    </>
  );
}
