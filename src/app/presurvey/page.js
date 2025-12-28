"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import ProgressBar from "../../components/ProgressBar";

export default function PreSurvey() {
  const router = useRouter();

  const [participantId, setParticipantId] = useState(null);
  const [taskType, setTaskType] = useState(""); // GMO / Nanotechnology / Cultivated meat
  const [responses, setResponses] = useState({});
  const [loading, setLoading] = useState(false);

  /* -------------------------------
     UI state (wing panel + guide)
  -------------------------------- */
  const [panelOpen, setPanelOpen] = useState(true);
  const [showGuide, setShowGuide] = useState(true);
  const [expandGuideTask, setExpandGuideTask] = useState(false);

  /* -------------------------------
     Assigned task text (UI only)
  -------------------------------- */
  const [assignedTasks, setAssignedTasks] = useState([]);

  /* -------------------------------
     Arrow calculation refs
  -------------------------------- */
  const taskPanelAnchorRef = useRef(null);
  const guideCardRef = useRef(null);
  const [arrowPath, setArrowPath] = useState("");

  /* -------------------------------
     Load participant + task type
  -------------------------------- */
  useEffect(() => {
    const id = localStorage.getItem("participant_id");
    if (!id) {
      window.location.href = "/check";
      return;
    }
    setParticipantId(id);

    // Task_type (must match Airtable single select exactly)
    const type = localStorage.getItem("task_type");
    if (!type) {
      alert("Task type not found. Please restart the study.");
      window.location.href = "/check";
      return;
    }
    setTaskType(type);

    // Assigned task text (for display only)
    try {
      const raw = localStorage.getItem("assigned_tasks");
      const arr = raw ? JSON.parse(raw) : null;
      if (Array.isArray(arr) && arr.length > 0) {
        setAssignedTasks(arr);
      } else {
        const fallback = localStorage.getItem("scenario");
        if (fallback) setAssignedTasks([fallback]);
      }
    } catch {
      const fallback = localStorage.getItem("scenario");
      if (fallback) setAssignedTasks([fallback]);
    }
  }, []);

  /* -------------------------------
     Question sets
  -------------------------------- */
  const familiarityQuestions = useMemo(
    () => [
      "How familiar are you with the topic?",
      "How would you rate your understanding of the basic concepts of the topic?",
      "How much prior knowledge did you have about the scientific aspects of the topic?",
      "How familiar were you with ongoing debates or controversies related to the topic?",
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

  const handleChange = (question, value) => {
    setResponses((prev) => ({ ...prev, [question]: value }));
  };

  /* -------------------------------
     Submit → /api/pre-survey
     (Airtable schema aligned)
  -------------------------------- */
  const handleSubmit = async () => {
    if (loading) return;

    const allQuestions = [...familiarityQuestions, ...selfEfficacyQuestions];
    const unanswered = allQuestions.filter((q) => responses[q] === undefined);

    if (unanswered.length > 0) {
      alert("Please answer all questions before continuing.");
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
          Task_type: taskType, // MUST match Airtable single select
          familiarity_responses: familiarityResponses,
          self_efficacy_responses: selfEfficacyResponses,
        }),
      });

      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg);
      }

      router.push("/experiment");
    } catch (err) {
      console.error("Pre-survey save error:", err);
      alert("Failed to save pre-survey responses. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  /* -------------------------------
     Arrow auto-calculation
  -------------------------------- */
  useEffect(() => {
    if (!showGuide) {
      setArrowPath("");
      return;
    }

    const compute = () => {
      const cardEl = guideCardRef.current;
      const anchorEl = taskPanelAnchorRef.current;
      if (!cardEl || !anchorEl) return;

      const card = cardEl.getBoundingClientRect();
      const anchor = anchorEl.getBoundingClientRect();

      const startX = card.left;
      const startY = card.top + card.height * 0.55;
      const endX = anchor.left + anchor.width * 0.3;
      const endY = anchor.top + anchor.height * 0.6;

      const dx = Math.abs(startX - endX);
      const d = `M ${startX} ${startY}
                 C ${startX - Math.max(120, dx * 0.35)} ${startY + 40},
                   ${endX + Math.max(140, dx * 0.25)} ${endY - 40},
                   ${endX} ${endY}`;

      setArrowPath(d);
    };

    compute();
    window.addEventListener("resize", compute);
    return () => window.removeEventListener("resize", compute);
  }, [showGuide, panelOpen, expandGuideTask]);

  /* -------------------------------
     Render
  -------------------------------- */
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Progress bar */}
      <div className="border-b bg-white sticky top-0 z-40">
        <div className="max-w-[1100px] mx-auto px-6 py-4">
          <ProgressBar progress={50} />
        </div>
      </div>

      <div className="flex">
        {/* Left wing panel */}
        <div
          className={`bg-gray-50 border-r border-gray-200 sticky top-[72px] h-[calc(100vh-72px)]
          transition-all duration-300 ${panelOpen ? "w-[22%]" : "w-[64px]"}`}
        >
          <div className="p-4">
            <button
              onClick={() => setPanelOpen((v) => !v)}
              className="mb-4 w-10 h-10 rounded border bg-white shadow"
            >
              {panelOpen ? "←" : "→"}
            </button>

            <div ref={taskPanelAnchorRef}>
              {panelOpen && (
                <>
                  <h2 className="text-lg font-semibold mb-3">Your Search Task</h2>
                  <div className="space-y-4">
                    {assignedTasks.map((t, i) => (
                      <div key={i} className="bg-white p-3 rounded border text-sm whitespace-pre-wrap">
                        <strong>Task {i + 1}</strong>
                        <div className="mt-1">{t}</div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Survey */}
        <div className="flex-1 flex justify-center overflow-y-auto">
          <div className="max-w-[1000px] w-full px-8 py-12 bg-white">
            <h1 className="text-3xl font-semibold mb-10 text-center">Pre-Survey</h1>

            {/* Familiarity */}
            <h2 className="text-xl font-semibold mb-4">About the given search task</h2>

            <div className="flex justify-end mb-4">
              <div className="flex justify-between w-[600px] text-sm text-gray-600">
                {familiarityLabels.map((l) => (
                  <span key={l} className="w-[100px] text-center">
                    {l}
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-8 mb-14">
              {familiarityQuestions.map((q) => (
                <div key={q} className="grid grid-cols-[minmax(420px,1fr)_auto] gap-8 border-b pb-4">
                  <p>{q}</p>
                  <div className="flex justify-between w-[600px] bg-gray-50 px-6 py-3 rounded">
                    {[1, 2, 3, 4, 5].map((v) => (
                      <input
                        key={v}
                        type="radio"
                        checked={responses[q] === v}
                        onChange={() => handleChange(q, v)}
                        className="w-5 h-5 accent-blue-600"
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Self-efficacy */}
            <h2 className="text-xl font-semibold mb-4">
              Pre-Search Self-Efficacy (Heppner & Petersen, 1982)
            </h2>

            <div className="flex justify-end mb-4">
              <div className="flex justify-between w-[720px] text-sm text-gray-600">
                {selfEfficacyLabels.map((l) => (
                  <span key={l} className="w-[100px] text-center">
                    {l}
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-8">
              {selfEfficacyQuestions.map((q) => (
                <div key={q} className="grid grid-cols-[minmax(420px,1fr)_auto] gap-8 border-b pb-4">
                  <p>{q}</p>
                  <div className="flex justify-between w-[720px] bg-gray-50 px-6 py-3 rounded">
                    {[1, 2, 3, 4, 5, 6].map((v) => (
                      <input
                        key={v}
                        type="radio"
                        checked={responses[q] === v}
                        onChange={() => handleChange(q, v)}
                        className="w-5 h-5 accent-blue-600"
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-14 text-center">
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

      {/* Arrow */}
      {showGuide && arrowPath && (
        <svg className="fixed inset-0 z-[55] pointer-events-none">
          <path
            d={arrowPath}
            stroke="white"
            strokeWidth="6"
            strokeDasharray="12 10"
            fill="none"
          />
        </svg>
      )}

      {/* Guide modal */}
      {showGuide && (
        <div className="fixed inset-0 bg-black/40 z-[60] flex items-center justify-center">
          <div ref={guideCardRef} className="bg-white p-8 rounded-lg shadow-xl max-w-[720px]">
            <h2 className="text-2xl font-semibold mb-4">Before You Begin</h2>
            <p className="mb-6 text-gray-700">
              On this task, you will see your assigned search task on the left.
              You may expand or collapse it at any time. Please read it carefully
              before answering the following questions.
            </p>

            <button
              onClick={() => setShowGuide(false)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
