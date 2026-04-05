"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="relative w-10 h-10">
          <div className="absolute inset-0 rounded-full border-2 border-[#252545]" />
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-[#4fc3f7] animate-spin" />
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") return null;

  return <>{children}</>;
}
