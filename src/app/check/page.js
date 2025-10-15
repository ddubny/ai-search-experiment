"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ProgressBar from "../../components/ProgressBar";
import { v4 as uuidv4 } from "uuid";

export default function CheckPage() {
  const router = useRouter();
  const [alreadyParticipated, setAlreadyParticipated] = useState(false);

  // ✅ 1. participant_id 생성 및 저장
  useEffect(() => {
    let participantId = localStorage.getItem("participant_id");
    if (!participantId) {
      participantId = uuidv4();
      localStorage.setItem("participant_id", participantId);
    }
  }, []);

  // ✅ 2. 중복 참여 여부 확인
  useEffect(() => {
    const hasParticipated = localStorage.getItem("hasParticipated");

    if (hasParticipated === "true") {
      // 이미 참여한 경우
      setAlreadyParticipated(true);
    } else {
      // 새 참가자일 경우
      localStorage.setItem("hasParticipated", "true");
      router.push("/consent");
    }
  }, [router]);

  // ✅ 이미 참여한 경우
  if (alreadyParticipated) {
    return (
      <main className="relative flex flex-col items-center justify-center min-h-screen bg-gray-100 text-gray-800">
        {/* Progress bar */}
        <div className="absolute top-0 left-0 w-full">
          <ProgressBar progress={0} />
        </div>

        <h1 className="text-2xl font-semibold mb-4">
          You have already participated.
        </h1>
        <p className="text-sm text-gray-600">
          Duplicate participation is not allowed. Thank you for your interest.
        </p>
      </main>
    );
  }

  // ✅ 로딩 중 (참여 확인 중)
  return (
    <main className="relative flex flex-col items-center justify-center min-h-screen bg-gray-50 text-gray-800">
      {/* Progress bar */}
      <div className="absolute top-0 left-0 w-full">
        <ProgressBar progress={0} />
      </div>

      <h1 className="text-xl font-medium">Checking your participation...</h1>
      <p className="text-sm text-gray-500 mt-2">Please wait...</p>
    </main>
  );
}
