interface ProgressBarProps {
  current: number;
  total: number;
}

export function ProgressBar({ current, total }: ProgressBarProps) {
  const pct = total ? ((current + 1) / total) * 100 : 0;

  return (
    <div
      className="w-full"
      role="progressbar"
      aria-valuenow={current + 1}
      aria-valuemin={1}
      aria-valuemax={total}
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-bold text-muted-foreground">
          Section {current + 1} of {total}
        </span>
        <span className="text-sm font-bold text-muted-foreground">
          {Math.round(pct)}%
        </span>
      </div>
      <div className="h-3 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
