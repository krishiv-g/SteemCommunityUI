interface AppLogoProps {
  className?: string;
}

export function AppLogo({ className = 'h-7 w-7' }: AppLogoProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="SteemDev"
    >
      <rect width="32" height="32" rx="7" fill="hsl(217 91% 60%)" />
      <path d="M7 11.5L3.5 16L7 20.5" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M25 11.5L28.5 16L25 20.5" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M20 9L12 23" stroke="white" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}
