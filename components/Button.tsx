import Link from "next/link";

const base =
  "inline-flex min-h-[44px] items-center justify-center rounded-xl px-6 py-3 text-base font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2";

const variants = {
  primary:
    "bg-foreground text-background hover:opacity-90",
  secondary:
    "border-2 border-foreground bg-transparent hover:bg-foreground/5",
  tertiary:
    "border border-foreground/30 bg-transparent hover:bg-foreground/5",
};

type ButtonProps = {
  variant?: keyof typeof variants;
  href?: string;
  children: React.ReactNode;
  className?: string;
  type?: "button" | "submit";
  onClick?: () => void;
  "aria-label"?: string;
};

export function Button({
  variant = "primary",
  href,
  children,
  className = "",
  type = "button",
  onClick,
  "aria-label": ariaLabel,
}: ButtonProps) {
  const classes = `${base} ${variants[variant]} ${className}`.trim();

  if (href) {
    return (
      <Link href={href} className={classes} aria-label={ariaLabel}>
        {children}
      </Link>
    );
  }

  return (
    <button
      type={type}
      className={classes}
      onClick={onClick}
      aria-label={ariaLabel}
    >
      {children}
    </button>
  );
}
