import Link from "next/link";

export function AddButton() {
  return (
    <Link
      href="/add"
      className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-[#4fc3f7] flex items-center justify-center shadow-lg text-[#1a1a2e] text-2xl font-bold hover:bg-[#38b2e0] transition-colors"
      aria-label="Add meal"
    >
      +
    </Link>
  );
}
