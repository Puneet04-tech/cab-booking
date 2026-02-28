"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import LoadingScreen from "./LoadingScreen";

export default function LoadingProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true); // Start with loading on initial load
  const pathname = usePathname();

  // Handle route changes (including initial load)
  useEffect(() => {
    // Show loading screen
    setIsLoading(true);

    // Hide loading screen after 3 seconds
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, [pathname]); // Trigger on pathname changes

  return (
    <>
      <LoadingScreen isLoading={isLoading} />
      <div className={isLoading ? "pointer-events-none opacity-0" : "opacity-100 transition-opacity duration-500"}>
        {children}
      </div>
    </>
  );
}
