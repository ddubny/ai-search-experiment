"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";
import ProgressBar from "../../components/ProgressBar";

export default function PreSurvey() {
  const router = useRouter();
  const [scenario, setScenario] = useState("");
  const [taskType, setTaskType] = useState("");
  const [participantId, setParticipantId] = useState(null); // ✅ 추가
  const [responses, setResponses] = useState({});
  const [loading, setLoading] = useState(false);

  // ✅ localStorage에서 participant_id & scenario 불러오기
  useEffect(() => {
    const id = localStorage.getItem("participant_id");
    if (!id) {
      // 없으면 다시 check 페이지로 (유효성 확보)
      window.location.href = "/check";
      return;
    }
    setParticipantId(id);

    const storedScenario = localStorage.getItem("scenario");
    if (storedScenario) {
      setScenario(storedScenario);

      // ✅ 시나리오에 따라 task 분류
      const lower = storedScenario.toLowerCase();
      if (lower.includes("employment") || lower.includes("career")) {
        setTaskType("employment");
      } else if (lower.includes("health") || lower.includes("medical")) {
        setTaskType("health");
      } else if (lower.includes("trip") || lower.includes("environment")) {
        setTaskType("environment");
      } else {
        setTaskType("unknown");
      }
    } else {
      console.warn("⚠️ No scenario found in localStorage.");
    }
  }, []);

  // ✅ task별 문항 세트
  const taskSpecificQuestions = {
    employment: [
      "I am usually able to think up creative and effective search strategies to find information about different employment arrangements.",
      "I have the ability to find answers about employment types even though initially no solution is immediately apparent.",
      "The employment landscape is too complex for me to understand through online searches.",
      "I do good search and feel confident it leads me to helpful information.",
      "When I plan how to search for career information, I am almost certain I can find what I need.",
      "Given enough time and effort, I believe I can find reliable information about most employment options that interest me.",
      "When faced with unfamiliar career information, I have confidence that I can search effectively to understand it.",
      "I trust my ability to solve new and difficult situations on career arrangements.",
      "When I search for career information, I find what I expected to find.",
      "When confronted with finding employment information, I am unsure whether I can find trustworthy information online.",
    ],
    health: [
      "I am usually able to think up creative and effective search strategies to find information about different health treatments.",
      "I have the ability to find answers about medical conditions even though initially no solution is immediately apparent.",
      "The healthcare landscape is too complex for me to understand through online searches.",
      "I do good search and feel confident it leads me to helpful health information.",
      "When I plan how to search for health information, I am almost certain I can find what I need.",
      "Given enough time and effort, I believe I can find reliable information about most health options that interest me.",
      "When faced with unfamiliar medical information, I have confidence that I can search effectively to understand it.",
      "I trust my ability to solve new and difficult situations related to health issues.",
      "When I search for medical information, I find what I expected to find.",
      "When confronted with finding health information, I am unsure whether I can find trustworthy information online.",
    ],
    environment: [
      "I am usually able to think up creative and effective search strategies to find information about different environmental issues.",
      "I have the ability to find answers about environmental policies even though initially no solution is immediately apparent.",
      "Environmental topics are too complex for me to understand through online searches.",
      "I do good search and feel confident it leads me to helpful environmental information.",
      "When I plan how to search for environmental information, I am almost certain I can find what I need.",
      "Given enough time and effort, I believe I can find reliable information about most environmental topics that interest me.",
      "When faced with unfamiliar environmental information, I have confidence that I can search effectively to understand it.",
      "I trust my ability to solve new and difficult situations related to environmental issues.",
      "When I search for environmental information, I find what I expected to find.",
      "When confronted with finding environmental information, I am unsure whether I can find trustworthy information online.",
    ],
  };

  const likertLabels = [
    "Strongly Disagree",
    "Disagree",
    "Slightly Disagree",
    "Neutral",
    "Slightly Agree",
    "Agree",
    "Strongly Agree",
  ];

  const handleChange = (question, value) => {
    setResponses((prev) => ({ ...prev, [question]: value }));
  };

  // ✅ 제출 처리
  const handleSubmit = async () => {
    const currentQuestions = taskSpecificQuestions[taskType] || [];
    const unanswered = currentQuestions.filter((q) => !responses[q]);
    if (unanswered.length > 0) {
      alert("⚠️ Please answer all questions before continuing.");
      return;
    }

    if (!participantId) {
      alert("Participant ID not found. Please restart the study.");
      return;
    }

    try {
      setLoading(true);

      // ✅ Supabase에 participant_id 포함하여 저장
      const { error } = await supabase.from("pretask_survey").insert([
        {
          participant_id: participantId,
          scenario,
          task_type: taskType,
          responses,
          created_at: new Date().toISOString(),
        },
      ]);

      if (error) throw error;

      router.push("/experiment");
    } catch (err) {
      console.error("❌ Error saving data:", err);
      alert("Error saving your responses. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const questions = taskSpecificQuestions[taskType] || [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Progress bar */}
      <div className="w-full px-6 py-4 bg-gray-50 border-b border-gray-200 sticky top-0 z-50">
        <ProgressBar progress={50} />
      </div>

      <div className="flex flex-1">
        {/* 🟦 왼쪽 20% Task 패널 */}
        <div className="w-[20%] bg-gray-50 border-r border-gray-200 p-6">
          <h2 className="text-lg font-semibold mb-3 text-gray-700">
            Your Search Task
          </h2>
          <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
            {scenario || "No scenario assigned."}
          </p>
        </div>

        {/* 🟨 오른쪽 80% 설문 */}
        <div className="flex-1 overflow-y-auto p-12 bg-white">
          <h1 className="text-3xl font-semibold mb-10 text-center">
            Pre-Survey: Search Self-Efficacy ({taskType})
          </h1>

          {/* Likert scale labels */}
          <div className="flex justify-end pr-8 mb-4">
            <div className="flex justify-between gap-10 text-sm text-gray-600 font-medium w-[720px]">
              {likertLabels.map((label, idx) => (
                <span key={idx} className="text-center w-[90px]">
                  {label}
                </span>
              ))}
            </div>
          </div>

          {/* Questions */}
          <form className="space-y-10">
            {questions.map((q, i) => (
              <div
                key={i}
                className="grid grid-cols-[1.2fr_auto] gap-10 items-center border-b pb-6"
              >
                <p className="text-gray-800 text-[17px] leading-relaxed">{q}</p>
                <div className="flex justify-between gap-10 bg-gray-50 rounded-lg px-6 py-4 w-[720px]">
                  {[1, 2, 3, 4, 5, 6, 7].map((val) => (
                    <label
                      key={val}
                      className="flex flex-col items-center cursor-pointer"
                    >
                      <input
                        type="radio"
                        name={q}
                        value={val}
                        checked={responses[q] === val}
                        onChange={() => handleChange(q, val)}
                        className="w-7 h-7 accent-blue-600 hover:scale-110 transition-transform cursor-pointer"
                      />
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </form>

          {/* 버튼 */}
          <div className="mt-14 text-center">
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-10 py-4 bg-blue-600 text-white font-semibold rounded-lg text-lg hover:bg-blue-700 transition disabled:opacity-50"
            >
              {loading ? "Submitting..." : "Next"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
