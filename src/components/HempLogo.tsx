interface HempLogoProps {
  className?: string;
}

export function HempLogo({ className = 'h-7 w-7' }: HempLogoProps) {
  return <img src="/whale-svgrepo-com.svg" alt="World of Xpilar" className={className} />;
}
