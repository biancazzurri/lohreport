import Link from "next/link";

export function AddButton() {
  return (
    <>
      {/* Training FAB — left */}
      <Link
        href="/add?type=training"
        className="fixed bottom-6 left-6 w-14 h-14 rounded-full bg-[#81c784] flex items-center justify-center shadow-lg text-[#1a1a2e] text-2xl font-bold hover:bg-[#66bb6a] transition-colors"
        aria-label="Add training"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <path d="M6.5 6.5v11M17.5 6.5v11M6.5 12h11M2 9v6M22 9v6" />
        </svg>
      </Link>

      {/* Meal FAB — right */}
      <Link
        href="/add"
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-[#4fc3f7] flex items-center justify-center shadow-lg text-[#1a1a2e] text-2xl font-bold hover:bg-[#38b2e0] transition-colors"
        aria-label="Add meal"
      >
        +
      </Link>
    </>
  );
}
