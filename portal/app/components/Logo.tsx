/** Handoff Hub mark: a hollow shard (source context) handing off to a solid shard (target). */
export default function Logo({ size = 32, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Handoff Hub"
    >
      <rect x="0.5" y="0.5" width="31" height="31" rx="9" fill="#0a0a0a" stroke="#ffffff" strokeOpacity="0.14" />
      <rect x="7" y="7" width="12" height="12" rx="3.5" stroke="#4ddcc6" strokeWidth="1.8" />
      <rect x="13" y="13" width="12" height="12" rx="3.5" fill="#3ecf8e" />
      <path d="M17.8 16.6 L20.6 19 L17.8 21.4" stroke="#002112" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
