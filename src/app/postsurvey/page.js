"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import ProgressBar from "../../components/ProgressBar";

/* -------------------------------
   Likert Row (Pre-survey style)
-------------------------------- */
function LikertRow({
  index,
  question,
  labels,
  value,
  onChange,
  highlightRef,
  highlight,
}) {
  return (
    <div
      ref={highlightRef}
      className={`border-b pb-8 space-y-4 transition-all
        ${highlight ? "animate-flash border-2 border-red-500 rounded-lg p-4" : ""}`}
    >
      <p className="font-medium text-[18px]">
        {index}. {question}
      </p>

      <div className="flex justify-between text-sm text-gray-600">
        {labels.map((label, i) => (
          <label
            key={label}
            className="flex flex-col items-center w-[110px] cursor-pointer"
          >
            <input
              type="radio"
              checked={value === i + 1}
              onChange={() => onChange(i + 1)}
              className="w-7 h-7 accent-blue-600 hover:scale-110 transition-transform"
            />
            <span className="mt-1 text-center">{label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

export default function PostSurvey() {
  const router = useRouter();
  const questionRefs = useRef({});

  const [participantId, setParticipantId] = useState(null);
  const [taskType, setTaskType] = useState("");

  // section-based states
  const [serendipityResponses, setSerendipityResponses] = useState({});
  const [postFamiliarityResponses, setPostFamiliarityResponses] = useState({});
  const [emotionResponses, setEmotionResponses] = useState({});
  const [selfEfficacyResponses, setSelfEfficacyResponses] = useState({});
  const [openEndedResponses, setOpenEndedResponses] = useState({});

  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const [showWarningModal, setShowWarningModal] = useState(false);
  const [highlightQuestion, setHighlightQuestion] = useState(null);

  /* -------------------------------
     Load participant + task type
  -------------------------------- */
  useEffect(() => {
    const id = localStorage.getItem("participant_id");
    if (!id) {
      router.push("/check");
      return;
    }
    setParticipantId(id);

    setTaskType(localStorage.getItem("task_type") || "the topic");
  }, [router]);

  /* -------------------------------
     Question Sets
  -------------------------------- */
  const serendipityQuestions = [
    "I obtained unexpected insights.",
    "I made connections that I had not thought of before.",
    "I had unexpected revelations about old ideas.",
    "I found things that surprised me.",
    "I was able to see the ordinary in new ways.",
  ];

  const postSearchFamiliarity = [
    `After completing the search task, how familiar are you with ${taskType}?`,
    `How many keywords can you think of when you think about ${taskType}?`,
    `How would you rate your current understanding of the basic concepts of ${taskType}?`,
    `How much understanding do you now have of the scientific aspects of ${taskType}?`,
    `How familiar are you now with ongoing debates or controversies related to ${taskType}?`,
  ];

  const evaluationQuestions = [
    "My overall experience with search (bad / good)",
    "Degree of information provided to users (complete / incomplete)",
    "Your understanding of information (insufficient / sufficient)",
    "Your feelings of participating in search (negative / positive)",
    "Attitude of search engines/chat AI (cooperative / belligerent)",
    "Communication with the search engines/chat AI (destructive / productive)",
    "Reliability of output information (high / low)",
    "Relevancy of output information (relevant / irrelevant)",
    "Accuracy of output information (inaccurate / accurate)",
    "Precision of output information (definite / uncertain)",
    "Completeness of the output information (adequate / inadequate)",
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

  const sevenPointLabels = [
    "Strongly Disagree",
    "Disagree",
    "Slightly Disagree",
    "Neutral",
    "Slightly Agree",
    "Agree",
    "Strongly Agree",
  ];

  const pages = [
    { title: "Serendipity Experience", questions: serendipityQuestions, section: "serendipity" },
    { title: "Post-Search Familiarity", questions: postSearchFamiliarity, section: "postFamiliarity" },
    { title: "Evaluation of Search Experience", questions: evaluationQuestions, section: "emotion" },
    { title: "Search Self-Efficacy", questions: selfEfficacyQuestions, section: "selfEfficacy" },
    { title: "Reflection", questions: [], section: "openEnded" },
  ];

  const sectionSetters = {
    serendipity: setSerendipityResponses,
    postFamiliarity: setPostFamiliarityResponses,
    emotion: setEmotionResponses,
    selfEfficacy: setSelfEfficacyResponses,
    openEnded: setOpenEndedResponses,
  };

  const sectionResponses = {
    serendipity: serendipityResponses,
    postFamiliarity: postFamiliarityResponses,
    emotion: emotionResponses,
    selfEfficacy: selfEfficacyResponses,
    openEnded: openEndedResponses,
  };

  const handleChange = (section, question, value) => {
    sectionSetters[section]((prev) => ({
      ...prev,
      [question]: value,
    }));
  };

  const handleFinalSubmit = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/airtable/post-survey", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          participant_id: participantId,
          serendipity_responses: serendipityResponses,
          post_familiarity_responses: postFamiliarityResponses,
          emotion_responses: emotionResponses,
          post_self_efficacy_responses: selfEfficacyResponses,
          open_ended: openEndedResponses,
        }),
      });

    if (!res.ok) {
      const errText = await res.text();
      let err;
      try {
        err = JSON.parse(errText);
      } catch {
        err = { raw: errText };
      }
      alert("SAVE FAILED:\n\n" + JSON.stringify(err, null, 2));
      return;
    }

    router.push("/demographic");
  } catch (e) {
    alert("SAVE FAILED (network/runtime):\n\n" + (e?.message || String(e)));
  } finally {
    setLoading(false);
  }
};

  const handleNext = () => {
    const { questions, section } = pages[page - 1];
    const currentResponses = sectionResponses[section];

    const unanswered = questions.filter(
      (q) => currentResponses[q] === undefined
    );

    if (unanswered.length > 0) {
      setShowWarningModal(true);
      return;
    }

    if (page < pages.length) {
      setPage(page + 1);
      window.scrollTo(0, 0);
    } else {
      handleFinalSubmit();
    }
  };

  /* -------------------------------
     Render
  -------------------------------- */
  let qIndex = 1;
  const { questions, section } = pages[page - 1];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="sticky top-0 z-40 bg-white border-b">
        <ProgressBar progress={60 + page * 8} />
      </div>

      <div className="max-w-[900px] mx-auto bg-white px-8 py-12">
        <h1 className="text-3xl font-semibold mb-4 text-center">Post-Survey</h1>
        <h2 className="text-xl font-semibold mb-10 text-center">
          {pages[page - 1].title}
        </h2>

        {questions.length > 0 && (
          <div className="space-y-8">
            {questions.map((q) => (
              <LikertRow
                key={q}
                index={qIndex++}
                question={q}
                labels={sevenPointLabels}
                value={sectionResponses[section][q]}
                onChange={(v) => handleChange(section, q, v)}
                highlightRef={(el) => (questionRefs.current[q] = el)}
                highlight={highlightQuestion === q}
              />
            ))}
          </div>
        )}

        {page === 5 && (
          <div className="space-y-10">
            <textarea
              className="w-full border rounded-md p-4 min-h-[120px]"
              placeholder="Keywords you can think of"
              onChange={(e) =>
                handleChange("openEnded", "keywords_free_response", e.target.value)
              }
            />
            <textarea
              className="w-full border rounded-md p-4 min-h-[140px]"
              placeholder="Any information meaningful to you?"
              onChange={(e) =>
                handleChange(
                  "openEnded",
                  "meaningful_information_free_response",
                  e.target.value
                )
              }
            />
          </div>
        )}

        <div className="mt-16 text-center">
          <button
            onClick={handleNext}
            disabled={loading}
            className="px-10 py-4 bg-blue-600 text-white rounded-lg font-semibold text-lg disabled:opacity-50"
          >
            {loading ? "Submitting..." : page < pages.length ? "Next" : "Submit"}
          </button>
        </div>
      </div>

      {/* Warning Modal (Pre-survey style) */}
      {showWarningModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full text-center space-y-6">
            <p>
              There is an unanswered question on this page.
              <br />
              Would you like to continue?
            </p>

            <div className="flex gap-4">
              <button
                onClick={() => {
                  setShowWarningModal(false);
                  page < pages.length ? setPage(page + 1) : handleFinalSubmit();
                }}
                className="flex-1 border rounded-lg py-2"
              >
                Continue Without Answering
              </button>

              <button
                onClick={() => {
                  const firstUnanswered = questions.find(
                    (q) => sectionResponses[section][q] === undefined
                  );
                  if (firstUnanswered && questionRefs.current[firstUnanswered]) {
                    questionRefs.current[firstUnanswered].scrollIntoView({
                      behavior: "smooth",
                      block: "center",
                    });
                    setHighlightQuestion(firstUnanswered);
                    setTimeout(() => setHighlightQuestion(null), 2000);
                  }
                  setShowWarningModal(false);
                }}
                className="flex-1 bg-blue-600 text-white rounded-lg py-2"
              >
                Answer the Question
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
