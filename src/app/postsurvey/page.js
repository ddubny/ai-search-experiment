"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ProgressBar from "../../components/ProgressBar";

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

  const overallEvaluation = [
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

  const likertLabels = [
    "Strongly Disagree",
    "Disagree",
    "Slightly Disagree",
    "Neutral",
    "Slightly Agree",
    "Agree",
    "Strongly Agree",
  ];

  /* -------------------------------
     Handle response
  -------------------------------- */
  const handleChange = (question, value) => {
    setResponses((prev) => ({ ...prev, [question]: value }));
  };

  /* -------------------------------
     Submit
  -------------------------------- */
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
    } catch (err) {
      alert("Failed to save your responses. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  /* -------------------------------
     Render helpers
  -------------------------------- */
  const renderLikert = (questions) =>
    questions.map((q, i) => (
      <div key={i} className="grid grid-cols-[1.2fr_auto] gap-10 items-center border-b pb-6">
        <p className="text-gray-800 text-[17px] leading-relaxed">{q}</p>
        <div className="flex justify-between gap-10 bg-gray-50 rounded-lg px-6 py-4 w-[720px]">
          {[1, 2, 3, 4, 5, 6, 7].map((val) => (
            <label key={val} className="flex flex-col items-center cursor-pointer">
              <input
                type="radio"
                name={q}
                checked={responses[q] === val}
                onChange={() => handleChange(q, val)}
                className="w-7 h-7 accent-blue-600 hover:scale-110 transition-transform"
              />
            </label>
          ))}
        </div>
      </div>
    ));

  /* -------------------------------
     Render
  -------------------------------- */
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="w-full px-6 py-4 bg-gray-50 border-b sticky top-0 z-50">
        <ProgressBar progress={90} />
      </div>

      <div className="max-w-6xl mx-auto bg-white p-12 mt-8 rounded-2xl shadow-md">
        <h1 className="text-3xl font-semibold mb-10 text-center">
          Post-Survey
        </h1>

        <div className="flex justify-end pr-8 mb-6">
          <div className="flex justify-between gap-10 text-sm text-gray-600 font-medium w-[720px]">
            {likertLabels.map((l, i) => (
              <span key={i} className="text-center w-[90px]">
                {l}
              </span>
            ))}
          </div>
        </div>

        <form className="space-y-14">
          {renderLikert(serendipityQuestions)}
          {renderLikert(postSearchFamiliarity)}
          {renderLikert(overallEvaluation)}
          {renderLikert(selfEfficacyQuestions)}

          {/* Free text */}
          <div className="space-y-8 pt-8">
            <div>
              <p className="mb-3 font-medium">
                What keywords can you think of when you think about {topic}?
              </p>
              <textarea
                className="w-full border rounded-lg p-4 min-h-[120px]"
                onChange={(e) =>
                  handleChange("keywords_free_response", e.target.value)
                }
              />
            </div>

            <div>
              <p className="mb-3 font-medium">
                You conducted a search to broadly explore information on the given topic.
                Among the information you found, was there any that you considered meaningful
                to your daily life or that you wanted to remember?
              </p>
              <textarea
                className="w-full border rounded-lg p-4 min-h-[140px]"
                onChange={(e) =>
                  handleChange("meaningful_information_free_response", e.target.value)
                }
              />
            </div>
          </div>
        </form>

        <div className="mt-16 text-center">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-10 py-4 bg-blue-600 text-white font-semibold rounded-lg text-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Submitting..." : "Submit Survey"}
          </button>
        </div>
      </div>
    </div>
  );
}
