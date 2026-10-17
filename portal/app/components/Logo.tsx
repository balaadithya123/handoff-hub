/**
 * Axon mark — clean geometric spark, in the spirit of Claude / Gemini / Grok.
 * Static only. No motion graphics.
 */
export default function Logo({
  size = 32,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Axon"
    >
      <rect width="32" height="32" rx="8" fill="#0f0f0f" />
      {/* Four-point spark — balanced, readable at 16–48px */}
      <path
        d="M16 6.5
           C16.55 11.2 17.8 13.8 20.9 15.05
           C17.8 16.3 16.55 18.9 16 23.5
           C15.45 18.9 14.2 16.3 11.1 15.05
           C14.2 13.8 15.45 11.2 16 6.5Z"
        fill="#f6f5f2"
      />
      {/* Subtle inner core for depth at larger sizes */}
      <circle cx="16" cy="15.05" r="1.35" fill="#0f0f0f" opacity="0.35" />
    </svg>
  );
}
