type ResultCountProps = {
  label: string;
  value: number;
  tone?: "default" | "success" | "warning" | "danger";
};

export function ResultCount({ label, value, tone = "default" }: ResultCountProps) {
  return (
    <div className={`metric-card metric-${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
