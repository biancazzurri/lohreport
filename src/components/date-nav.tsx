interface DateNavProps {
  date: string;
  onPrev: () => void;
  onNext: () => void;
}

function formatDate(dateStr: string): string {
  const today = new Date().toISOString().slice(0, 10);
  const d = new Date(`${dateStr}T00:00:00`);
  const day = d.toLocaleDateString("en-US", { weekday: "short" });
  const month = d.toLocaleDateString("en-US", { month: "short" });
  const date = d.getDate();

  if (dateStr === today) {
    return `Today, ${month} ${date}`;
  }
  return `${day}, ${month} ${date}`;
}

export function DateNav({ date, onPrev, onNext }: DateNavProps) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <button
        onClick={onPrev}
        className="text-gray-400 hover:text-gray-200 text-lg px-2"
        aria-label="Previous day"
      >
        ◀
      </button>
      <span className="text-sm font-medium text-gray-200">
        {formatDate(date)}
      </span>
      <button
        onClick={onNext}
        className="text-gray-400 hover:text-gray-200 text-lg px-2"
        aria-label="Next day"
      >
        ▶
      </button>
    </div>
  );
}
