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
     Keyword Highlight Helper
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
     Airtable helpers
     ========================= */
  const getConsentRecordId = async (participantId) => {
    const response = await fetch(
      `https://api.airtable.com/v0/${process.env.NEXT_PUBLIC_AIRTABLE_BASE_ID}/consent?filterByFormula=${encodeURIComponent(
        `{participant_id}='${participantId}'`
      )}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.AIRTABLE_API_KEY}`,
        },
      }
    );

    const data = await response.json();
    return data.records?.[0]?.id || null;
  };

  const updateTaskType = async (recordId, taskType) => {
    await fetch(
      `https://api.airtable.com/v0/${process.env.NEXT_PUBLIC_AIRTABLE_BASE_ID}/consent/${recordId}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${process.env.AIRTABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fields: {
            task_type: taskType,
            task_assigned_at: new Date().toISOString(),
          },
        }),
      }
    );
  };

  /* =========================
     2. Assign scenario + update consent
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

    const randomScenario =
      scenarios[Math.floor(Math.random() * scenarios.length)];

    setAssignedScenario(randomScenario);

    // localStorage (UI & 다음 페이지 전달용)
    localStorage.setItem("condition", randomScenario.condition);
    localStorage.setItem("search_case", randomScenario.searchCase);
    localStorage.setItem("search_task", randomScenario.searchTask);

    const saveTaskToConsent = async () => {
      try {
        const recordId = await getConsentRecordId(participantId);

        if (!recordId) {
          console.error(
            "Consent record not found for participant:",
            participantId
          );
          setLoading(false);
          return;
        }

        await updateTaskType(recordId, randomScenario.condition);
      } catch (err) {
        console.error("Failed to update task_type:", err);
      } finally {
        setLoading(false);
      }
    };

    saveTaskToConsent();
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
            Please read the task carefully. You will next complete a short
            pre-task survey, followed by the main search task.
          </p>

          {/* Search Case */}
          <div className="bg-gray-50 border border-gray-200 rounded-2xl shadow-sm p-8 mb-6 text-left">
            <h2 className="font-semibold mb-2">Search Case</h2>
            <p
              className="text-gray-800 leading-relaxed"
              dangerouslySetInnerHTML={{
                __html: highlightKeywords(
                  assignedScenario.searchCase,
                  assignedScenario.condition
                ),
              }}
            />
          </div>

          {/* Search Task */}
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
