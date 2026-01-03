"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ProgressBar from "../../components/ProgressBar";

/* -------------------------------
   Likert Row (Pre-survey style)
-------------------------------- */
function LikertRow({ index, question, labels, value, onChange }) {
  return (
    <div className="border-b py-10">
      <p className="font-medium text-[18px] mb-8">
        {index}. {question}
      </p>

      <div className="flex justify-between max-w-[760px] mx-auto text-sm text-gray-700">
        {labels.map((label, i) => (
          <label
            key={label}
            className="flex flex-col items-center gap-2 cursor-pointer w-[120px]"
          >
            <input
              type="radio"
              checked={value === i + 1}
              onChange={() => onChange(i + 1)}
              className="accent-blue-600 scale-125"
            />
            <span className="text-center">{label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

export default function PostSurvey() {
  const router = useRouter();

  const [participantId, setParticipantId] = useState(null);
  const [topic, setTopic] = useState("");
  const [responses, setResponses] = useState({});
  const [loading, setLoading] = useState(false);

  /* -------------------------------
     Load participant + topic
  -------------------------------- */
  useEffect(() => {
    const id = localStorage.getItem("participant_id");
    if (!id) {
      router.push("/check");
      return;
    }
    setParticipantId(id);

    const storedTopic =
      localStorage.getItem("search_case") ||
      localStorage.getItem("topic") ||
      "the topic";
    setTopic(storedTopic);
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
    `After completing the search task, how familiar are you with ${topic}?`,
    `How many keywords can you think of when you think about ${topic}?`,
    `How would you rate your current understanding of the basic concepts of ${topic}?`,
    `How much understanding do you now have of the scientific aspects of ${topic}?`,
    `How familiar are you now with ongoing debates or controversies related to ${topic}?`,
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

  const fivePointLabels = [
    "Not at all",
    "Slightly",
    "Moderately",
    "Very",
    "Extremely",
  ];

  /* -------------------------------
     Handlers
  -------------------------------- */
  const handleChange = (question, value) => {
    setResponses((prev) => ({ ...prev, [question]: value }));
  };

  const handleSubmit = async () => {
    if (loading) return;

    try {
      setLoading(true);

      const res = await fetch("/api/airtable/post-survey", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          participant_id: participantId,
          topic,
          responses,
        }),
      });

      if (!res.ok) throw new Error(await res.text());

      router.push("/demographic");
    } catch {
      alert("Failed to save your responses. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  /* -------------------------------
     Render
  -------------------------------- */
  let qIndex = 1;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="sticky top-0 z-40 bg-white border-b">
        <ProgressBar progress={90} />
      </div>

      <div className="max-w-[900px] mx-auto bg-white px-8 py-12">
        <h1 className="text-3xl font-semibold mb-12 text-center">
          Post-Survey
        </h1>

        {/* Serendipity */}
        {serendipityQuestions.map((q) => (
          <LikertRow
            key={q}
            index={qIndex++}
            question={q}
            labels={fivePointLabels}
            value={responses[q]}
            onChange={(v) => handleChange(q, v)}
          />
        ))}

        {/* Post-search familiarity */}
        {postSearchFamiliarity.map((q) => (
          <LikertRow
            key={q}
            index={qIndex++}
            question={q}
            labels={fivePointLabels}
            value={responses[q]}
            onChange={(v) => handleChange(q, v)}
          />
        ))}

        {/* Evaluation */}
        {evaluationQuestions.map((q) => (
          <LikertRow
            key={q}
            index={qIndex++}
            question={q}
            labels={fivePointLabels}
            value={responses[q]}
            onChange={(v) => handleChange(q, v)}
          />
        ))}

        {/* Self-efficacy */}
        {selfEfficacyQuestions.map((q) => (
          <LikertRow
            key={q}
            index={qIndex++}
            question={q}
            labels={fivePointLabels}
            value={responses[q]}
            onChange={(v) => handleChange(q, v)}
          />
        ))}

        {/* Free text */}
        <div className="border-b py-10">
          <p className="font-medium text-[18px] mb-4">
            What keywords can you think of when you think about {topic}?
          </p>
          <textarea
            className="w-full border rounded-md p-4 min-h-[120px]"
            onChange={(e) =>
              handleChange("keywords_free_response", e.target.value)
            }
          />
        </div>

        <div className="border-b py-10">
          <p className="font-medium text-[18px] mb-4">
            You conducted a search to broadly explore information on the given topic.
            Among the information you found, was there any that you considered meaningful
            to your daily life or that you wanted to remember?
          </p>
          <textarea
            className="w-full border rounded-md p-4 min-h-[140px]"
            onChange={(e) =>
              handleChange("meaningful_information_free_response", e.target.value)
            }
          />
        </div>

        <div className="mt-16 text-center">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-10 py-4 bg-blue-600 text-white rounded-lg font-semibold text-lg disabled:opacity-50"
          >
            {loading ? "Submitting..." : "Submit Survey"}
          </button>
        </div>
      </div>
    </div>
  );
}
