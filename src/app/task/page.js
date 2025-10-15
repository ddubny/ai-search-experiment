"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient"; // ✅ Supabase 연결
import ProgressBar from "../../components/ProgressBar";

export default function TaskPage() {
  const router = useRouter();
  const [scenario, setScenario] = useState("");
  const [participantId, setParticipantId] = useState(null);
  const [loading, setLoading] = useState(true);

  // ✅ 1. participant_id 불러오기
  useEffect(() => {
    const id = localStorage.getItem("participant_id");
    if (!id) {
      window.location.href = "/check"; // 참가자 식별 불가능 시 다시 check로
    } else {
      setParticipantId(id);
    }
  }, []);

  // ✅ 2. 시나리오 랜덤 생성 및 Supabase 저장
  useEffect(() => {
    if (!participantId) return; // participantId가 로드된 후 실행

    const scenarios = [
      "You are planning a trip and need to find unique local spots that most tourists overlook.",
      "You are researching health information about how to manage mild insomnia.",
      "You are exploring possible graduate programs that align with your interests and skills.",
    ];

    const randomScenario = scenarios[Math.floor(Math.random() * scenarios.length)];
    setScenario(randomScenario);
    localStorage.setItem("scenario", randomScenario);

    // Supabase에 저장
    const saveTask = async () => {
      const { error } = await supabase.from("tasks").insert([
        {
          participant_id: participantId,
          assigned_task: randomScenario,
          created_at: new Date().toISOString(),
        },
      ]);

      if (error) {
        console.error("Supabase insert error:", error);
      }

      setLoading(false);
    };

    saveTask();
  }, [participantId]);

  const handleContinue = () => {
    router.push("/presurvey");
  };

  if (loading)
    return (
      <main className="flex items-center justify-center min-h-screen text-gray-700">
        <p>Loading your assigned task...</p>
      </main>
    );

  return (
    <main className="min-h-[100svh] flex flex-col bg-white text-gray-900">
      {/* ✅ Progress bar section */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <ProgressBar progress={20} />
      </div>

      {/* ✅ Main content */}
      <div className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="max-w-2xl text-center">
          <h1 className="text-3xl font-bold mb-8">Your Information-Seeking Task</h1>

          {/* 시나리오 카드 */}
          <div className="bg-gray-50 border border-gray-200 rounded-2xl shadow-sm p-8 mb-8">
            <p className="text-lg leading-relaxed text-gray-800 italic">“{scenario}”</p>
          </div>

          <p className="text-gray-600 text-base mb-12">
            Please read the task carefully.  
            You will next complete a short pre-task survey, followed by the main search task.
          </p>

          <button
            onClick={handleContinue}
            className="px-8 py-3 bg-blue-600 text-white text-sm font-semibold rounded-lg shadow-sm hover:bg-blue-700 focus:ring-2 focus:ring-blue-400 transition"
          >
            Continue to Pre-Task Survey
          </button>
        </div>
      </div>
    </main>
  );
}
