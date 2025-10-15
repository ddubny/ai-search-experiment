"use client";

import { usePathname } from "next/navigation";

export default function ProgressBar({ progress }) {
  const pathname = usePathname();

  const steps = [
    "/check",
    "/consent",
    "/presurvey",
    "/experiment",
    "/post-survey",
    "/thankyou",
  ];

  const currentStep = steps.indexOf(pathname);
  const totalSteps = steps.length - 1;

  // automatically calculated value (percentage)
  const autoProgress =
    currentStep === -1 ? 0 : Math.max(0, (currentStep / totalSteps) * 100);

  // If I want to change the percentage manually !!
  const progressPercent =
    typeof progress === "number" ? progress : autoProgress;

  return (
    <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
      <div
        className="bg-blue-600 h-2 transition-all duration-700 ease-in-out"
        style={{ width: `${progressPercent}%` }}
      ></div>
    </div>
  );
}
