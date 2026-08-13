const TONES = {
  neutral: "bg-surface-muted text-foreground-muted",
  accent: "bg-accent-soft text-accent-hover",
  success: "bg-success-soft text-success",
  danger: "bg-danger-soft text-danger",
} as const;

export default function Badge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: keyof typeof TONES;
}) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${TONES[tone]}`}>
      {children}
    </span>
  );
}
