"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import ProgressBar from "../../components/ProgressBar";

const STORAGE_KEY = "presurvey_responses";
const GUIDE_SEEN_KEY = "presurvey_guide_seen";

export default function PreSurvey() {
  const router = useRouter();
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [incompleteWarningCount, setIncompleteWarningCount] = useState(0);

  const [participantId, setParticipantId] = useState(null);
  const [taskType, setTaskType] = useState("");
  const [searchCase, setSearchCase] = useState("");
  const [searchTask, setSearchTask] = useState("");

  const [responses, setResponses] = useState({});
  const [loading, setLoading] = useState(false);

  /* -------------------------------
     UI state
  -------------------------------- */
  const [panelOpen, setPanelOpen] = useState(true);
  const [showGuide, setShowGuide] = useState(true);

  /* -------------------------------
     Arrow refs
  -------------------------------- */
  const taskPanelAnchorRef = useRef(null);
  const guideCardRef = useRef(null);
  const [arrowPath, setArrowPath] = useState("");

  /* -------------------------------
     Load participant + task
  -------------------------------- */
  useEffect(() => {
    const id = localStorage.getItem("participant_id");
    if (!id) {
      router.push("/check");
      return;
    }
    setParticipantId(id);

    const type = localStorage.getItem("task_type");
    const scase = localStorage.getItem("search_case");
    const stask = localStorage.getItem("search_task");

    if (!type || !scase || !stask) {
      router.push("/task");
      return;
    }

    setTaskType(type);
    setSearchCase(scase);
    setSearchTask(stask);

    // restore saved responses
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setResponses(JSON.parse(saved));
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }

    const guideSeen = localStorage.getItem(GUIDE_SEEN_KEY);
    if (guideSeen === "true") {
      setShowGuide(false);
    }
  }, [router]);

  /* -------------------------------
     Questions
  -------------------------------- */
  const familiarityQuestions = useMemo(
    () => [
      "How familiar are you with the topic?",
      "To what extent do you know about the topic?",
      "How much do you know about the topic?",
      "How well do you know about the topic?",
    ],
    []
  );

  const selfEfficacyQuestions = useMemo(
    () => [
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
    ],
    []
  );

  const familiarityLabels = ["Not at all", "Slightly", "Moderately", "Very", "Extremely"];
  const selfEfficacyLabels = [
    "Strongly Disagree",
    "Disagree",
    "Slightly Disagree",
    "Slightly Agree",
    "Agree",
    "Strongly Agree",
  ];

  /* -------------------------------
     Handle response (persist)
  -------------------------------- */
  const handleChange = (question, value) => {
    setResponses((prev) => {
      const updated = { ...prev, [question]: value };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  /* -------------------------------
     Submit
  -------------------------------- */
  const handleSubmit = async () => {
    if (loading) return;

    const allQuestions = [...familiarityQuestions, ...selfEfficacyQuestions];
    const unanswered = allQuestions.filter((q) => responses[q] === undefined);

    if (unanswered.length > 0 && incompleteWarningCount < 2) {
      setShowWarningModal(true);
      setIncompleteWarningCount((c) => c + 1);
      return;
    }

    const familiarityResponses = {};
    familiarityQuestions.forEach((q) => (familiarityResponses[q] = responses[q]));

    const selfEfficacyResponses = {};
    selfEfficacyQuestions.forEach((q) => (selfEfficacyResponses[q] = responses[q]));

    try {
      setLoading(true);

      const res = await fetch("/api/airtable/pre-survey", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          participant_id: participantId,
          Task_type: taskType,
          familiarity_responses: familiarityResponses,
          self_efficacy_responses: selfEfficacyResponses,
        }),
      });

      if (!res.ok) throw new Error(await res.text());

      localStorage.removeItem(STORAGE_KEY);
      router.push("/experiment");
    } catch (err) {
      alert("Failed to save pre-survey responses. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  /* -------------------------------
     Render
  -------------------------------- */
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Full-width Progress Bar */}
      <div className="sticky top-0 z-40 bg-white border-b">
        <ProgressBar progress={50} />
      </div>

      <div className="flex">
        {/* Left task panel */}
        <div
          className={`border-r bg-gray-50 sticky top-[56px] h-[calc(100vh-56px)]
          transition-all ${panelOpen ? "w-[22%]" : "w-[64px]"}`}
        >
          <div className="p-4">
            <button
              onClick={() => setPanelOpen((v) => !v)}
              className="mb-4 w-10 h-10 rounded border bg-white shadow"
            >
              {panelOpen ? "←" : "→"}
            </button>

            {panelOpen && (
              <div ref={taskPanelAnchorRef} className="bg-white p-4 rounded border text-sm space-y-3">
                <div>
                  <strong>Search Case</strong>
                  <p className="mt-1 whitespace-pre-wrap">{searchCase}</p>
                </div>
                <div>
                  <strong>Search Task</strong>
                  <p className="mt-1 whitespace-pre-wrap">{searchTask}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Survey */}
        <div className="flex-1 flex justify-center overflow-y-auto">
          <div className="max-w-[900px] w-full px-8 py-12 bg-white">
            <h1 className="text-3xl font-semibold mb-12 text-center">Pre-Survey</h1>

            <h2 className="text-xl font-semibold mb-6">About the given search task</h2>

            <div className="space-y-8 mb-16">
              {familiarityQuestions.map((q, idx) => (
                <div key={q} className="border-b pb-8 space-y-4">
                  <p className="font-medium text-[18px]">
                    {idx + 1}. {q}
                  </p>
                  <div className="flex justify-between text-sm text-gray-600">
                    {familiarityLabels.map((label, i) => (
                      <label key={label} className="flex flex-col items-center w-[100px]">
                        <input
                          type="radio"
                          checked={responses[q] === i + 1}
                          onChange={() => handleChange(q, i + 1)}
                          className="mb-2 accent-blue-600 scale-125"
                        />
                        <span>{label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <h2 className="text-xl font-semibold mb-6">
              Pre-Search Self-Efficacy (Heppner & Petersen, 1982)
            </h2>

            <div className="space-y-8">
              {selfEfficacyQuestions.map((q, idx) => (
                <div key={q} className="border-b pb-8 space-y-4">
                  <p className="font-medium text-[18px]">
                    {idx + 1}. {q}
                  </p>
                  <div className="flex justify-between text-sm text-gray-600">
                    {selfEfficacyLabels.map((label, i) => (
                      <label key={label} className="flex flex-col items-center w-[110px]">
                        <input
                          type="radio"
                          checked={responses[q] === i + 1}
                          onChange={() => handleChange(q, i + 1)}
                          className="mb-2 accent-blue-600 scale-125"
                        />
                        <span>{label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-16 text-center">
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="px-10 py-4 bg-blue-600 text-white rounded-lg font-semibold text-lg"
              >
                {loading ? "Submitting..." : "Next"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Guide */}
      {showGuide && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <div ref={guideCardRef} className="bg-white p-8 rounded-lg shadow-xl max-w-[720px]">
            <h2 className="text-2xl font-semibold mb-4">Before You Begin</h2>
            <p className="mb-6 text-gray-700">
              You can review your assigned search task on the left at any time.
              Your responses will be saved automatically.
            </p>
            <button
              onClick={() => {
                localStorage.setItem(GUIDE_SEEN_KEY, "true");
                setShowGuide(false);
              }}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold"
            >
              Got it
            </button>
          </div>
        </div>
      )}
            {/* Incomplete warning modal */}
      {showWarningModal && (
        <div className="fixed inset-0 bg-black/40 z-[60] flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full text-center">
            <h3 className="text-lg font-semibold mb-3">
              ⚠️ Incomplete Responses
            </h3>
            <p className="text-gray-700 mb-6 leading-relaxed">
              {incompleteWarningCount === 1
                ? "Please answer all questions before continuing."
                : "You may proceed, but unanswered questions will be recorded as missing."}
            </p>
            <button
              onClick={() => setShowWarningModal(false)}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
