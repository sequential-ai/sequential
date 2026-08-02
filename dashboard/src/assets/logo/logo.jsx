// Sequential AI Logo SVG component
export default function Logo() {
  return (
    <div className="flex items-center gap-2">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <path d="M3 12h5"/>
        <path d="M8 12c0-4 3-7 4-7s4 3 4 7-3 7-4 7-4-3-4-7z" stroke="#F2541B"/>
        <path d="M16 12h5"/>
      </svg>
      <span className="font-semibold text-base" style={{ fontFamily: 'var(--font-display)' }}>
        Sequential
      </span>
    </div>
  )
}
