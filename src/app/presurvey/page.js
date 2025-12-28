"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import ProgressBar from "../../components/ProgressBar";

export default function PreSurvey() {
  const router = useRouter();

  const [scenario, setScenario] = useState("");
  const [participantId, setParticipantId] = useState(null);
  const [responses, setResponses] = useState({});
  const [loading, setLoading] = useState(false);

  // Left “wing panel”
  const [panelOpen, setPanelOpen] = useState(true);

  // Guide modal + its task “wing”
  const [showGuide, setShowGuide] = useState(true);
  const [expandGuideTask, setExpandGuideTask] = useState(false);

  // Assigned tasks (show all previously assigned)
  const [assignedTasks, setAssignedTasks] = useState([]);

  // Arrow (auto-calculated)
  const taskPanelAnchorRef = useRef(null); // point near the “Your Search Task” title
  const guideCardRef = useRef(null); // modal card
  const [arrowPath, setArrowPath] = useState("");

  /* -------------------------------
     Load participant & scenario/tasks
  -------------------------------- */
  useEffect(() => {
    const id = localStorage.getItem("participant_id");
    if (!id) {
      window.location.href = "/check";
      return;
    }
    setParticipantId(id);

    const storedScenario = localStorage.getItem("scenario") || "";
    setScenario(storedScenario);

    // Try to load all previously assigned tasks
    // Recommended storage key: assigned_tasks (JSON array of strings)
    // Fallback: use scenario if no array exists.
    try {
      const raw = localStorage.getItem("assigned_tasks");
      const arr = raw ? JSON.parse(raw) : null;
      if (Array.isArray(arr) && arr.length > 0) {
        setAssignedTasks(arr.filter((x) => typeof x === "string" && x.trim().length > 0));
      } else if (storedScenario?.trim()) {
        setAssignedTasks([storedScenario]);
      } else {
        setAssignedTasks([]);
      }
    } catch {
      if (storedScenario?.trim()) setAssignedTasks([storedScenario]);
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

  const familiarityLabels = useMemo(() => ["Not at all", "Slightly", "Moderately", "Very", "Extremely"], []);
  const selfEfficacyLabels = useMemo(
    () => ["Strongly Disagree", "Disagree", "Slightly Disagree", "Slightly Agree", "Agree", "Strongly Agree"],
    []
  );

  const handleChange = (question, value) => {
    setResponses((prev) => ({ ...prev, [question]: value }));
  };

  /* -------------------------------
     Submit → Airtable (pre_survey)
  -------------------------------- */
  const handleSubmit = async () => {
    if (loading) return; // prevent double submit

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

      const payload = {
        table: "pre_survey",
        participant_id: participantId,
        scenario,
        familiarity_responses: familiarityResponses,
        self_efficacy_responses: selfEfficacyResponses,
        created_at: new Date().toISOString(),
      };

      const res = await fetch("/api/airtable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        // Try to surface server response for debugging
        let detail = "";
        try {
          detail = await res.text();
        } catch {}
        console.error("PreSurvey save failed:", res.status, detail);
        throw new Error(`Failed to save pre-survey data (${res.status})`);
      }

      router.push("/experiment");
    } catch (err) {
      console.error("PreSurvey save error:", err);
      alert("Error saving responses. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  /* -------------------------------
     Auto-calc arrow path (responsive)
     - From guide modal card → left task panel anchor
  -------------------------------- */
  useEffect(() => {
    if (!showGuide) {
      setArrowPath("");
      return;
    }

    const compute = () => {
      const cardEl = guideCardRef.current;
      const anchorEl = taskPanelAnchorRef.current;

      if (!cardEl || !anchorEl) {
        setArrowPath("");
        return;
      }

      const card = cardEl.getBoundingClientRect();
      const anchor = anchorEl.getBoundingClientRect();

      // Start point: left-middle of the guide card
      const startX = Math.max(0, card.left);
      const startY = card.top + card.height * 0.55;

      // End point: near the task panel header area
      const endX = anchor.left + Math.min(anchor.width, 260) * 0.25;
      const endY = anchor.top + anchor.height * 0.6;

      // Smooth cubic bezier control points
      const dx = Math.abs(startX - endX);
      const c1X = startX - Math.max(120, dx * 0.35);
      const c1Y = startY + 40;
      const c2X = endX + Math.max(140, dx * 0.25);
      const c2Y = endY - 40;

      const d = `M ${startX} ${startY} C ${c1X} ${c1Y}, ${c2X} ${c2Y}, ${endX} ${endY}`;
      setArrowPath(d);
    };

    compute();

    const onResize = () => compute();
    window.addEventListener("resize", onResize);

    // Also recompute after layout settles (fonts, etc.)
    const t = window.setTimeout(compute, 60);

    return () => {
      window.removeEventListener("resize", onResize);
      window.clearTimeout(t);
    };
  }, [showGuide, panelOpen, expandGuideTask]);

  const closeGuide = () => {
    setShowGuide(false);
    setArrowPath("");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Progress bar */}
      <div className="bg-gray-50 border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-[1100px] mx-auto px-6 py-4">
          <ProgressBar progress={50} />
        </div>
      </div>

      <div className="flex">
        {/* Left: Search Task (Wing Panel) */}
        <div
          className={[
            "bg-gray-50 border-r border-gray-200",
            "sticky top-[72px] h-[calc(100vh-72px)]",
            "transition-all duration-300 ease-in-out",
            panelOpen ? "w-[22%] min-w-[280px]" : "w-[64px] min-w-[64px]",
          ].join(" ")}
        >
          <div className={panelOpen ? "p-6" : "p-3"}>
            <div className="flex items-center justify-between">
              <button
                onClick={() => setPanelOpen((v) => !v)}
                className={[
                  "flex items-center justify-center rounded-md border border-gray-200 bg-white",
                  "shadow-sm hover:bg-gray-50 transition-colors",
                  panelOpen ? "w-10 h-10" : "w-10 h-10",
                ].join(" ")}
                aria-label={panelOpen ? "Collapse task panel" : "Expand task panel"}
                title={panelOpen ? "Collapse" : "Expand"}
              >
                {panelOpen ? "←" : "→"}
              </button>

              {panelOpen && (
                <div className="ml-3 flex-1">
                  <div ref={taskPanelAnchorRef} className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-700">Your Search Task</h2>
                    <span className="text-gray-500 text-sm">Pinned</span>
                  </div>
                </div>
              )}
            </div>

            {!panelOpen && (
              <div ref={taskPanelAnchorRef} className="mt-4 flex flex-col items-center gap-2">
                <div className="text-xs text-gray-600 rotate-90 whitespace-nowrap">Search Task</div>
              </div>
            )}

            {panelOpen && (
              <div className="mt-4 overflow-y-auto pr-1">
                {assignedTasks.length === 0 ? (
                  <p className="text-gray-600 text-sm">No task found.</p>
                ) : (
                  <div className="space-y-5">
                    {assignedTasks.map((t, i) => (
                      <div key={i} className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                        <div className="text-xs font-semibold text-gray-600 mb-2">Task {i + 1}</div>
                        <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">{t}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right: Survey */}
        <div className="flex-1 bg-white flex justify-center overflow-y-auto">
          <div className="w-full max-w-[1000px] px-8 py-12">
            <h1 className="text-3xl font-semibold mb-10 text-center">Pre-Survey</h1>

            {/* Familiarity */}
            <h2 className="text-xl font-semibold mb-4">About the given search task</h2>

            <div className="flex justify-end mb-4">
              <div className="flex justify-between gap-6 text-sm text-gray-600 font-medium w-[600px]">
                {familiarityLabels.map((l, i) => (
                  <span key={i} className="text-center w-[100px]">
                    {l}
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-8 mb-14">
              {familiarityQuestions.map((q, i) => (
                <div
                  key={i}
                  className="grid grid-cols-[minmax(420px,1fr)_auto] gap-8 items-center border-b pb-4"
                >
                  <p className="text-gray-800">{q}</p>
                  <div className="flex justify-between gap-6 bg-gray-50 rounded-lg px-6 py-3 w-[600px]">
                    {[1, 2, 3, 4, 5].map((val) => (
                      <input
                        key={val}
                        type="radio"
                        name={q}
                        checked={responses[q] === val}
                        onChange={() => handleChange(q, val)}
                        className="w-5 h-5 accent-blue-600"
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Self-efficacy */}
            <h2 className="text-xl font-semibold mb-4">Pre-Search Self-Efficacy (Heppner & Petersen, 1982)</h2>

            <div className="flex justify-end mb-4">
              <div className="flex justify-between gap-6 text-sm text-gray-600 font-medium w-[720px]">
                {selfEfficacyLabels.map((l, i) => (
                  <span key={i} className="text-center w-[100px]">
                    {l}
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-8">
              {selfEfficacyQuestions.map((q, i) => (
                <div
                  key={i}
                  className="grid grid-cols-[minmax(420px,1fr)_auto] gap-8 items-center border-b pb-4"
                >
                  <p className="text-gray-800">{q}</p>
                  <div className="flex justify-between gap-6 bg-gray-50 rounded-lg px-6 py-3 w-[720px]">
                    {[1, 2, 3, 4, 5, 6].map((val) => (
                      <input
                        key={val}
                        type="radio"
                        name={q}
                        checked={responses[q] === val}
                        onChange={() => handleChange(q, val)}
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
                className="px-10 py-4 bg-blue-600 text-white font-semibold rounded-lg text-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? "Submitting..." : "Next"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Arrow overlay (responsive) */}
      {showGuide && arrowPath && (
        <svg
          className="fixed inset-0 z-[55] pointer-events-none"
          width="100%"
          height="100%"
          viewBox={`0 0 ${typeof window !== "undefined" ? window.innerWidth : 1440} ${
            typeof window !== "undefined" ? window.innerHeight : 900
          }`}
          preserveAspectRatio="none"
        >
          <defs>
            <marker id="arrowHeadWhite" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="white" />
            </marker>
          </defs>
          <path
            d={arrowPath}
            stroke="white"
            strokeWidth="6"
            strokeDasharray="12 10"
            fill="none"
            markerEnd="url(#arrowHeadWhite)"
          />
        </svg>
      )}

      {/* Guide overlay (modal) */}
      {showGuide && (
        <div className="fixed inset-0 bg-black/40 z-[60] flex items-center justify-center p-6">
          <div ref={guideCardRef} className="bg-white rounded-lg shadow-xl w-full max-w-[720px] p-8 relative">
            <h2 className="text-2xl font-semibold mb-4">Before You Begin</h2>

            <p className="text-gray-700 leading-relaxed mb-5">
              On this task, you will see your assigned search task. You may expand or collapse it at any time. Please
              read the task carefully before answering the following questions.
            </p>

            {/* Modal “wing” task (expand/collapse) */}
            <div className="border border-gray-200 rounded-lg bg-gray-50 p-4 mb-6">
              <button
                onClick={() => setExpandGuideTask((v) => !v)}
                className="w-full flex items-center justify-between"
              >
                <span className="font-semibold text-gray-800">Your Search Task</span>
                <span className="text-gray-600">{expandGuideTask ? "▾" : "▸"}</span>
              </button>

              <div
                className={[
                  "transition-all duration-300 ease-in-out overflow-hidden",
                  expandGuideTask ? "max-h-56 mt-3" : "max-h-0",
                ].join(" ")}
              >
                {assignedTasks.length === 0 ? (
                  <p className="text-sm text-gray-600">No task found.</p>
                ) : (
                  <div className="space-y-3">
                    {assignedTasks.map((t, i) => (
                      <div key={i} className="bg-white rounded-md border border-gray-200 p-3">
                        <div className="text-xs font-semibold text-gray-600 mb-1">Task {i + 1}</div>
                        <div className="text-sm text-gray-800 whitespace-pre-wrap max-h-36 overflow-y-auto">
                          {t}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="text-right">
              <button onClick={closeGuide} className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold">
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
