"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ProgressBar from "../../components/ProgressBar";

export default function PreSurvey() {
  const router = useRouter();

  const [scenario, setScenario] = useState("");
  const [participantId, setParticipantId] = useState(null);
  const [responses, setResponses] = useState({});
  const [loading, setLoading] = useState(false);

  const [showTask, setShowTask] = useState(true);
  const [showGuide, setShowGuide] = useState(true);
  const [showPopupTask, setShowPopupTask] = useState(true);

  useEffect(() => {
    const id = localStorage.getItem("participant_id");
    if (!id) {
      window.location.href = "/check";
      return;
    }
    setParticipantId(id);

    const storedScenario = localStorage.getItem("scenario");
    if (storedScenario) setScenario(storedScenario);
  }, []);

  const familiarityQuestions = [
    "How familiar are you with the topic?",
    "How would you rate your understanding of the basic concepts of the topic?",
    "How much prior knowledge did you have about the scientific aspects of the topic?",
    "How familiar were you with ongoing debates or controversies related to the topic?",
  ];

  const selfEfficacyQuestions = [
    "I am usually able to think up creative and effective search strategies to find interesting and valuable information.",
    "I have the ability to find answers, even when I have no immediate or prior knowledge of the subject.",
    "The concept is too complex for me to understand through online searches.",
    "I can do a good search and feel confident it will lead me to interesting information.",
    "When I plan how to search for scientific information, I am almost certain I can find what I need.",
    "Given enough time and effort, I believe I can find information that interests me.",
    "When faced with unfamiliar information, I have confidence that I can search effectively for information that connects to me personally.",
    "I trust my ability to find new and interesting information.",
    "After finishing a search, the information I expected usually emerges during the search process.",
    "When confronted with difficult tasks, I am unsure whether I can find insightful information.",
  ];

  const handleChange = (q, v) =>
    setResponses((p) => ({ ...p, [q]: v }));

  const handleSubmit = async () => {
    const all = [...familiarityQuestions, ...selfEfficacyQuestions];
    if (all.some((q) => responses[q] === undefined)) {
      alert("Please answer all questions.");
      return;
    }

    const familiarity = {};
    familiarityQuestions.forEach((q) => (familiarity[q] = responses[q]));

    const selfEff = {};
    selfEfficacyQuestions.forEach((q) => (selfEff[q] = responses[q]));

    try {
      setLoading(true);

      const res = await fetch("/api/airtable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          table: "pre_survey",
          fields: {
            participant_id: participantId,
            scenario,
            familiarity_responses: JSON.stringify(familiarity),
            self_efficacy_responses: JSON.stringify(selfEff),
            created_at: new Date().toISOString(),
          },
        }),
      });

      if (!res.ok) throw new Error("Save failed");

      router.push("/experiment");
    } catch (e) {
      console.error(e);
      alert("Error saving responses.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 relative">
      {/* Progress */}
      <div className="sticky top-0 z-40 bg-gray-50 border-b">
        <div className="max-w-[1100px] mx-auto px-6 py-4">
          <ProgressBar progress={50} />
        </div>
      </div>

      <div className="flex">
        {/* Search Task Panel */}
        <div className="w-[22%] bg-gray-50 border-r p-6">
          <button
            onClick={() => setShowTask(!showTask)}
            className="flex justify-between w-full font-semibold"
          >
            Your Search Task <span>{showTask ? "▾" : "▸"}</span>
          </button>
          {showTask && (
            <pre className="mt-4 whitespace-pre-wrap text-sm">
              {scenario}
            </pre>
          )}
        </div>

        {/* Survey */}
        <div className="flex-1 flex justify-center bg-white">
          <div className="max-w-[1100px] w-full px-10 py-12">
            {/* questions */}
            {[...familiarityQuestions, ...selfEfficacyQuestions].map(
              (q, i) => (
                <div
                  key={i}
                  className="grid grid-cols-[1.3fr_auto] gap-8 border-b py-4"
                >
                  <p>{q}</p>
                  <div className="flex gap-4">
                    {[1, 2, 3, 4, 5, 6].map((v) => (
                      <input
                        key={v}
                        type="radio"
                        name={q}
                        onChange={() => handleChange(q, v)}
                      />
                    ))}
                  </div>
                </div>
              )
            )}

            <div className="text-center mt-12">
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="px-8 py-3 bg-blue-600 text-white rounded-lg"
              >
                {loading ? "Submitting..." : "Next"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Popup */}
      {showGuide && (
        <>
          {/* SVG curved arrow */}
          <svg className="fixed inset-0 pointer-events-none z-50">
            <path
              d="M 600 200 C 300 200, 200 350, 120 420"
              stroke="white"
              strokeWidth="6"
              strokeDasharray="10 8"
              fill="none"
            />
          </svg>

          {/* Popup */}
          <div className="fixed top-24 right-24 z-50 bg-white shadow-xl rounded-lg w-[420px]">
            <button
              onClick={() => setShowPopupTask(!showPopupTask)}
              className="w-full text-left px-4 py-2 font-semibold border-b"
            >
              Search Task {showPopupTask ? "▾" : "▸"}
            </button>

            {showPopupTask && (
              <div className="p-4 max-h-[300px] overflow-y-auto text-sm">
                <pre className="whitespace-pre-wrap">
                  {scenario}
                </pre>
              </div>
            )}

            <div className="p-4 text-right">
              <button
                onClick={() => setShowGuide(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded"
              >
                Got it
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
