export default function LogoMark({ className = 'w-6 h-6' }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    >
      <path d="M3 12h5" />
      <path d="M8 12c0-4 3-7 4-7s4 3 4 7-3 7-4 7-4-3-4-7z" stroke="var(--orange)" />
      <path d="M16 12h5" />
    </svg>
  );
}
