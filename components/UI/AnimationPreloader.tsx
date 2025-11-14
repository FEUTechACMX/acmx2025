"use client";

import Animation from "./Animation";
import { useRouter } from "next/navigation";

export default function AnimationPreloader() {
  const router = useRouter();

  return (
    <div className="flex items-center justify-center min-h-screen">
      <Animation onComplete={() => router.replace("/")} />
    </div>
  );
}
