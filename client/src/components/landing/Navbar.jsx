import LogoMark from './LogoMark';

export default function Navbar() {
  return (
    <>
      <div className="grad-bar text-center font-mono text-[12.5px] font-medium tracking-[0.01em] text-white px-4 py-[9px]">
        Task and Monitor are free on every plan —{' '}
        <a href="#pricing" className="underline underline-offset-2 font-semibold">see pricing</a>
      </div>

      <header className="sticky top-0 z-[100] bg-cream border-b border-line">
        <nav className="max-w-[1180px] mx-auto flex items-center justify-between px-8 py-4">
          <a href="#" className="flex items-center gap-[9px] font-display font-bold text-[16.5px]">
            <LogoMark />
            Sequential AI
          </a>
          <div className="hidden md:flex items-center gap-[30px]">
            <a href="#compare" className="text-sm font-medium text-ink-soft hover:text-ink transition-colors">Compare</a>
            <a href="#benchmarks" className="text-sm font-medium text-ink-soft hover:text-ink transition-colors">Benchmarks</a>
            <a href="#pricing" className="text-sm font-medium text-ink-soft hover:text-ink transition-colors">Pricing</a>
            <a href="#faq" className="text-sm font-medium text-ink-soft hover:text-ink transition-colors">FAQ</a>
          </div>
          <div className="flex items-center gap-2.5">
            <a href="#" className="hidden md:inline-flex items-center justify-center gap-2 rounded-full border border-line-strong text-ink text-[13px] font-semibold px-[17px] py-[9px] whitespace-nowrap hover:bg-ink/[0.04] transition-colors">
              Log in
            </a>
            <a href="#" className="inline-flex items-center justify-center gap-2 rounded-full bg-ink text-cream text-[13px] font-semibold px-[17px] py-[9px] whitespace-nowrap transition-transform hover:-translate-y-0.5 hover:shadow-[0_10px_24px_-8px_rgba(23,20,15,0.4)]">
              Sign up
            </a>
          </div>
        </nav>
      </header>
    </>
  );
}
