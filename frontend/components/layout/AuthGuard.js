"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { isPublicRoute, useSession } from "@/lib/data/session";

export default function AuthGuard({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { hydrated, token } = useSession();

  const publicRoute = isPublicRoute(pathname);

  useEffect(() => {
    if (!publicRoute && hydrated && !token) {
      // Signed-out visitors to the home route meet the welcome page first.
      router.replace(pathname === "/" ? "/welcome" : "/sign-in");
    }
  }, [publicRoute, hydrated, token, router]);

  if (publicRoute) {
    return children;
  }

  if (!hydrated || !token) {
    return (
      <div className="flex min-h-[45vh] items-center justify-center">
        <div className="rounded-lg border border-line bg-surface px-6 py-5 text-center">
          <p className="text-sm font-medium text-primary">
            {!hydrated ? "Checking crew session..." : "Redirecting to sign in..."}
          </p>
        </div>
      </div>
    );
  }

  return children;
}
