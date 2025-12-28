"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ProgressBar from "../../components/ProgressBar";

export default function TaskPage() {
  const router = useRouter();
  const [assignedScenario, setAssignedScenario] = useState(null);
  const [participantId, setParticipantId] = useState(null);
  const [loading, setLoading] = useState(true);

  /* =========================
     Highlight helper
     (Search Task ONLY)
     ========================= */
  const highlightKeywords = (text, condition) => {
    const keywordMap = {
      Nanotechnology: ["nanotechnology", "nanoparticles"],
      GMO: ["genetically modified organisms", "GMOs", "GMO"],
      "Cultivated Meat": ["cultivated meat"],
    };

    const keywords = keywordMap[condition] || [];
    let highlightedText = text;

    keywords.forEach((keyword) => {
      const regex = new RegExp(`(${keyword})`, "gi");
      highlightedText = highlightedText.replace(
        regex,
        `<span class="bg-yellow-200 font-semibold px-1 rounded">$1</span>`
      );
    });

    return highlightedText;
  };

  /* =========================
     1. Load participant_id
     ========================= */
  useEffect(() => {
    const id = localStorage.getItem("participant_id");
    if (!id) {
      window.location.href = "/check";
    } else {
      setParticipantId(id);
    }
  }, []);

  /* =========================
     2. Assign scenario (ONCE)
     ========================= */
  useEffect(() => {
    if (!participantId) return;

    const scenarios = [
      {
        condition: "Nanotechnology",
        searchCase:
          "Your friend visited a grocery store. While your friend was standing in front of the fresh corner, your friend overheard some people passing by saying that these days, the nanoparticles used in packaging materials can also mix into the food. You want to check what scientific evidence actually says.",
        searchTask:
          "Perform a search to explore evidence about nanotechnology.",
      },
      {
        condition: "GMO",
        searchCase:
          "Your friend visited a grocery store. While your friend was standing in front of the cereal and snack section, your friend overheard some people talking about how some genetically modified organisms (GMOs) food may disrupt hormones or cause long-term health effects. You want to check what scientific evidence actually says.",
        searchTask:
          "Perform a search to explore evidence about GMO foods.",
      },
      {
        condition: "Cultivated Meat",
        searchCase:
          "Your friend visited a grocery store. While your friend was standing in front of the meat section, trying to decide which meat to buy, your friend overheard some people passing by saying that these days, some meat is cultivated meat but is often not labeled properly. You want to check what scientific evidence actually says.",
        searchTask:
          "Perform a search to explore evidence about cultivated meat.",
      },
    ];

    /* ===== 이미 할당된 경우 (새로고침 방지) ===== */
    const savedCondition = localStorage.getItem("assigned_task_type");

    if (savedCondition) {
      const existingScenario = scenarios.find(
        (s) => s.condition === savedCondition
      );

      if (existingScenario) {
        setAssignedScenario(existingScenario);
        setLoading(false);
        return;
      }
    }

    /* ===== 최초 방문: 랜덤 할당 ===== */
    const randomScenario =
      scenarios[Math.floor(Math.random() * scenarios.length)];

    setAssignedScenario(randomScenario);

    // localStorage에 고정 저장 (핵심)
    localStorage.setItem("task_type", randomScenario.condition);
    localStorage.setItem("search_case", randomScenario.searchCase);
    localStorage.setItem("search_task", randomScenario.searchTask);

    setLoading(false);
  }, [participantId]);

  const handleContinue = () => {
    router.push("/presurvey");
  };

  if (loading || !assignedScenario) {
    return (
      <main className="flex items-center justify-center min-h-screen text-gray-700">
        <p>Loading your assigned task...</p>
      </main>
    );
  }

  return (
    <main className="min-h-[100svh] flex flex-col bg-white text-gray-900">
      {/* Progress bar */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <ProgressBar progress={20} />
      </div>

      {/* Main content */}
      <div className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="max-w-2xl text-center">
          <h1 className="text-3xl font-bold mb-8">📋 Your Search Task</h1>

          <p className="text-gray-600 text-base mb-10">
            Please read the task carefully.
            <br />
            You will next respond to a pre-task survey, followed by the main
            search task.
            <br />
            You will be able to review your search task at any time during the session.
          </p>

          {/* Search Case (NO highlight) */}
          <div className="bg-gray-50 border border-gray-200 rounded-2xl shadow-sm p-8 mb-6 text-left">
            <h2 className="font-semibold mb-2">Search Case</h2>
            <p className="text-gray-800 leading-relaxed">
              {assignedScenario.searchCase}
            </p>
          </div>

          {/* Search Task (WITH highlight) */}
          <div className="bg-gray-50 border border-gray-200 rounded-2xl shadow-sm p-8 mb-10 text-left">
            <h2 className="font-semibold mb-2">Search Task</h2>
            <p
              className="text-gray-800 leading-relaxed"
              dangerouslySetInnerHTML={{
                __html: highlightKeywords(
                  assignedScenario.searchTask,
                  assignedScenario.condition
                ),
              }}
            />
          </div>

          <button
            onClick={handleContinue}
            className="px-8 py-3 bg-blue-600 text-white text-sm font-semibold rounded-lg shadow-sm hover:bg-blue-700 focus:ring-2 focus:ring-blue-400 transition"
          >
            Continue to Next
          </button>
        </div>
      </div>
    </main>
  );
}
