const styles: Record<string, string> = {
  ACTIVE: "border-moss text-moss",
  PLANNING: "border-gold text-gold",
  OPEN: "border-stamp text-stamp",
};

export default function StampBadge({ status }: { status: keyof typeof styles }) {
  return (
    <span
      className={`inline-block -rotate-6 rounded-sm border-2 px-2 py-0.5 font-mono text-[10px] font-medium uppercase tracking-[0.2em] ${styles[status]}`}
      style={{ borderStyle: "double" }}
    >
      {status}
    </span>
  );
}
