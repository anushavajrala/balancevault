"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the login page on the client side
    router.replace("/login");
  }, [router]);

  // Return a minimal, valid React component while redirecting
  return (
    <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center text-emerald-500 font-mono">
      Loading Vault...
    </div>
  );
}