"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";
import ProgressBar from "../../components/ProgressBar";

export default function PostSurvey() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [taskType, setTaskType] = useState("");
  const [participantId, setParticipantId] = useState(null); // ✅ 추가
  const [scenario, setScenario] = useState(""); // ✅ 추가
  const [responses, setResponses] = useState({});
  const [loading, setLoading] = useState(false);

  // ✅ localStorage에서 participant_id, scenario, taskType 불러오기
  useEffect(() => {
    const id = localStorage.getItem("participant_id");
    if (!id) {
      window.location.href = "/check";
      return;
    }
    setParticipantId(id);

    const storedScenario = localStorage.getItem("scenario");
    if (storedScenario) setScenario(storedScenario);

    const storedTaskType = localStorage.getItem("taskType");
    setTaskType(storedTaskType || "employment");
  }, []);

  // ✅ 페이지별 진행률
  const progressValues = { 1: 60, 2: 70, 3: 80 };

  // ✅ 태스크별 문항 세트
  const taskSpecificQuestions = {
    employment: [
      "I am usually able to think up creative and effective search strategies to find information about different employment arrangements.",
      "I have the ability to find answers about employment types even though initially no solution is immediately apparent.",
      "The employment landscape is too complex for me to understand through online searches.",
      "I do good search and feel confident it lead me to helpful information.",
      "When I plan how to search for career information, I am almost certain I can find what I need.",
      "Given enough time and effort, I believe I can find reliable information about most employment options that interest me.",
      "When faced with unfamiliar career information, I have confidence that I can search effectively to understand it.",
      "I trust my ability to solve new and difficult situations on career arrangements.",
      "When I search for career information, I find what I expected to find.",
      "When confronted with finding employment information, I am unsure whether I can find trustworthy information online.",
    ],
    health: [
      "I am usually able to think up creative and effective search strategies to find information about different health treatments.",
      "I have the ability to find answers about medical conditions even though initially no solution is immediately apparent.",
      "The healthcare landscape is too complex for me to understand through online searches.",
      "I do good search and feel confident it leads me to helpful health information.",
      "When I plan how to search for health information, I am almost certain I can find what I need.",
      "Given enough time and effort, I believe I can find reliable information about most health options that interest me.",
      "When faced with unfamiliar medical information, I have confidence that I can search effectively to understand it.",
      "I trust my ability to solve new and difficult situations related to health issues.",
      "When I search for medical information, I find what I expected to find.",
      "When confronted with finding health information, I am unsure whether I can find trustworthy information online.",
    ],
    environment: [
      "I am usually able to think up creative and effective search strategies to find information about different environmental issues.",
      "I have the ability to find answers about environmental policies even though initially no solution is immediately apparent.",
      "Environmental topics are too complex for me to understand through online searches.",
      "I do good search and feel confident it leads me to helpful environmental information.",
      "When I plan how to search for environmental information, I am almost certain I can find what I need.",
      "Given enough time and effort, I believe I can find reliable information about most environmental topics that interest me.",
      "When faced with unfamiliar environmental information, I have confidence that I can search effectively to understand it.",
      "I trust my ability to solve new and difficult situations related to environmental issues.",
      "When I search for environmental information, I find what I expected to find.",
      "When confronted with finding environmental information, I am unsure whether I can find trustworthy information online.",
    ],
  };

  const pages = {
    1: [
      "I obtained unexpected insights.",
      "I made connections that I had not thought of before.",
      "I had unexpected revelations about old ideas.",
      "I found things that surprised me.",
      "I was able to see the ordinary in new ways.",
    ],
    2: taskSpecificQuestions[taskType],
    3: [
      "My overall experience with search (dissonant / harmonious)",
      "My overall experience with search (bad / good)",
      "My overall experience with search (fast / slow)",
      "My overall experience with search (untimely / timely)",
      "Degree of information provided to users (complete / incomplete)",
      "Your understanding of information (low / high)",
      "Your understanding of information (insufficient / sufficient)",
      "Your understanding of information (complete / incomplete)",
      "Your feelings of participating in search (positive / negative)",
      "Attitude of search engines/chat AI (cooperative / belligerent)",
      "Attitude of search engines/chat AI (negative / positive)",
      "Reliability of output information (high / low)",
      "Relevancy of output information (useful / useless)",
      "Relevancy of output information (relevant / irrelevant)",
      "Accuracy of output information (inaccurate / accurate)",
      "Precision of output information (low / high)",
      "Communication with the search engines/chat AI (dissonant / harmonious)",
      "Time required for decision making (unreasonable / reasonable)",
      "Completeness of the output information (sufficient / insufficient)",
      "Completeness of the output information (adequate / inadequate)",
    ],
  };

  const likertLabels = [
    "Strongly Disagree",
    "Disagree",
    "Slightly Disagree",
    "Neutral",
    "Slightly Agree",
    "Agree",
    "Strongly Agree",
  ];

  const handleChange = (question, value) => {
    setResponses((prev) => ({ ...prev, [question]: value }));
  };

  const totalPages = 3;

  // ✅ 다음 페이지 이동 또는 제출
  const handleNext = async () => {
    const currentQuestions = pages[page];
    const unanswered = currentQuestions.filter((q) => !responses[q]);

    if (unanswered.length > 0) {
      alert("⚠️ Please answer all questions before continuing.");
      return;
    }

    if (page < totalPages) {
      setPage(page + 1);
      window.scrollTo(0, 0);
    } else {
      // ✅ 최종 제출 시 Supabase 저장
      try {
        setLoading(true);

        const { error } = await supabase.from("postsurvey").insert([
          {
            participant_id: participantId, // ✅ 추가
            scenario,                      // ✅ 추가
            task_type: taskType,
            responses,
            created_at: new Date().toISOString(),
          },
        ]);

        if (error) throw error;
        router.push("/demographic");
      } catch (err) {
        console.error("❌ Error inserting data:", err);
        alert("Error saving your responses. Please try again.");
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ✅ 상단 ProgressBar */}
      <div className="w-full px-6 py-4 bg-gray-50 border-b border-gray-200 sticky top-0 z-50">
        <ProgressBar progress={progressValues[page]} />
      </div>

      <div className="max-w-6xl mx-auto bg-white p-12 mt-8 rounded-2xl shadow-md">
        <h1 className="text-3xl font-semibold mb-10 text-center">
          {page === 1 && "Post-Survey: Serendipity Experience"}
          {page === 2 && `Post-Survey: Search Self-Efficacy (${taskType})`}
          {page === 3 && "Post-Survey: Evaluation of Experience"}
        </h1>

        {/* ✅ Likert labels */}
        <div className="flex justify-end pr-8 mb-4">
          <div className="flex justify-between gap-10 text-sm text-gray-600 font-medium w-[720px]">
            {likertLabels.map((label, idx) => (
              <span key={idx} className="text-center w-[90px]">
                {label}
              </span>
            ))}
          </div>
        </div>

        {/* ✅ 질문 렌더링 */}
        <form className="space-y-10">
          {pages[page]?.map((q, i) => (
            <div
              key={i}
              className="grid grid-cols-[1.2fr_auto] gap-10 items-center border-b pb-6"
            >
              <p className="text-gray-800 text-[17px] leading-relaxed">{q}</p>
              <div className="flex justify-between gap-10 bg-gray-50 rounded-lg px-6 py-4 w-[720px]">
                {[1, 2, 3, 4, 5, 6, 7].map((val) => (
                  <label
                    key={val}
                    className="flex flex-col items-center cursor-pointer"
                  >
                    <input
                      type="radio"
                      name={q}
                      value={val}
                      checked={responses[q] === val}
                      onChange={() => handleChange(q, val)}
                      className="w-7 h-7 accent-blue-600 hover:scale-110 transition-transform cursor-pointer"
                    />
                  </label>
                ))}
              </div>
            </div>
          ))}
        </form>

        {/* ✅ 버튼 */}
        <div className="mt-14 text-center">
          <button
            onClick={handleNext}
            disabled={loading}
            className="px-10 py-4 bg-blue-600 text-white font-semibold rounded-lg text-lg hover:bg-blue-700 transition disabled:opacity-50"
          >
            {loading
              ? "Submitting..."
              : page < totalPages
              ? "Next"
              : "Submit Survey"}
          </button>
        </div>
      </div>
    </div>
  );
}
