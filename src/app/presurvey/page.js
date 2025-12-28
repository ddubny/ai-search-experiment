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

  /* -------------------------------
     Load participant & scenario
  -------------------------------- */
  useEffect(() => {
    const id = localStorage.getItem("participant_id");
    if (!id) {
      window.location.href = "/check";
      return;
    }
    setParticipantId(id);

    const storedScenario = localStorage.getItem("scenario");
    if (storedScenario) {
      setScenario(storedScenario);
    }
  }, []);

  /* -------------------------------
     Question sets
  -------------------------------- */
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

  const familiarityLabels = [
    "Not at all",
    "Slightly",
    "Moderately",
    "Very",
    "Extremely",
  ];

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
     Submit → Airtable (pre_survey)
  -------------------------------- */
  const handleSubmit = async () => {
    const allQuestions = [
      ...familiarityQuestions,
      ...selfEfficacyQuestions,
    ];

    const unanswered = allQuestions.filter(
      (q) => responses[q] === undefined
    );
    if (unanswered.length > 0) {
      alert("Please answer all questions before continuing.");
      return;
    }

    // 🔹 responses 분리
    const familiarityResponses = {};
    familiarityQuestions.forEach((q) => {
      familiarityResponses[q] = responses[q];
    });

    const selfEfficacyResponses = {};
    selfEfficacyQuestions.forEach((q) => {
      selfEfficacyResponses[q] = responses[q];
    });

    try {
      setLoading(true);

      const res = await fetch("/api/airtable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          table: "pre_survey",               // ✅ 테이블 분리
          participant_id: participantId,
          scenario,
          familiarity_responses: JSON.stringify(familiarityResponses),
          self_efficacy_responses: JSON.stringify(selfEfficacyResponses),
          created_at: new Date().toISOString(),
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to save pre-survey data");
      }

      router.push("/experiment");
    } catch (err) {
      console.error("PreSurvey save error:", err);
      alert("Error saving responses. Please try again.");
    } finally {
      setLoading(false);
    }
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
        {/* Left: Search Task */}
        <div className="w-[20%] bg-gray-50 border-r border-gray-200 p-6">
          <button
            onClick={() => setShowTask(!showTask)}
            className="flex items-center justify-between w-full"
          >
            <h2 className="text-lg font-semibold text-gray-700">
              Your Search Task
            </h2>
            <span className="text-gray-500">
              {showTask ? "▾" : "▸"}
            </span>
          </button>

          {showTask && (
            <p className="mt-4 text-gray-800 leading-relaxed whitespace-pre-wrap">
              {scenario}
            </p>
          )}
        </div>

        {/* Right: Survey */}
        <div className="flex-1 bg-white flex justify-center overflow-y-auto">
          <div className="w-full max-w-[1000px] px-8 py-12">
            <h1 className="text-3xl font-semibold mb-10 text-center">
              Pre-Survey
            </h1>

            {/* Familiarity */}
            <h2 className="text-xl font-semibold mb-4">
              About the given search task
            </h2>

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
                  className="grid grid-cols-[1fr_auto] gap-8 items-center border-b pb-4"
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
            <h2 className="text-xl font-semibold mb-4">
              Pre-Search Self-Efficacy (Heppner & Petersen, 1982)
            </h2>

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
                  className="grid grid-cols-[1fr_auto] gap-8 items-center border-b pb-4"
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

      {/* Guide overlay */}
      {showGuide && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-xl max-w-[600px] p-8 relative">
            <h2 className="text-2xl font-semibold mb-4">
              Before You Begin
            </h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              On the left, you will see your assigned search task. You may
              expand or collapse it at any time. Please read the task carefully
              before answering the following questions.
            </p>
            <div className="text-right">
              <button
                onClick={() => setShowGuide(false)}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold"
              >
                Got it
              </button>
            </div>
            <div className="absolute -left-6 top-24 text-4xl text-blue-600">
              ←
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
