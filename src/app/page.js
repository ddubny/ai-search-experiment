"use client";

import { useRouter } from "next/navigation";
import { WelcomePage } from "../welcome/page";

export default function HomePage() {
  const router = useRouter();

  return (
    <WelcomePage
      onNext={() => router.push("/consent")}
    />
  );
}
