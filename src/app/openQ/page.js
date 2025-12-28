"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ProgressBar from "../../components/ProgressBar";

export default function OpenQPage() {
  const router = useRouter();

  const [keywords, setKeywords] = useState("");
  const [reflection, setReflection] = useState("");
  const [participantId, setParticipantId] = useState(null);

  // participant_id 확인 (다른 페이지들과 동일한 패턴)
  useEffect(() => {
    const id = localStorage.getItem("participant_id");
    if (!id) {
      router.push("/check");
      return;
    }
    setParticipantId(id);
  }, [router]);

  const handleNext = () => {
    // TODO: 이후 Supabase / DB 저장 로직 추가 가능
    router.push("/postsurvey");
  };

  return (
    <main className="flex flex-col min-h-screen">
      {/* Progress Bar */}
      <div className="w-full fixed top-0 left-0 z-50">
        <ProgressBar progress={70} />
      </div>

      {/* Content */}
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="max-w-2xl w-full space-y-8">

          <header className="space-y-2 text-center">
            <h1 className="text-2xl font-bold">
              Open-ended Questions
            </h1>
            <p className="text-gray-600">
              Please answer the questions below based on your search experience.
            </p>
          </header>

          {/* Question 1 */}
          <div className="space-y-3">
            <label className="font-semibold block">
              When you think about the topic, what keywords or ideas come to mind?
            </label>
            <p className="text-sm text-gray-600">
              You may list keywords, phrases, or short thoughts.
            </p>
            <textarea
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              rows={4}
              placeholder="Enter keywords or ideas here..."
              className="w-full border border-gray-300 rounded-lg p-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Question 2 */}
          <div className="space-y-3">
            <label className="font-semibold block">
              During your search, did you encounter any information that felt meaningful
              to your daily life or that you wanted to remember?
            </label>
            <p className="text-sm text-gray-600">
              Please briefly describe what stood out to you and why.
            </p>
            <textarea
              value={reflection}
              onChange={(e) => setReflection(e.target.value)}
              rows={5}
              placeholder="Enter your response here..."
              className="w-full border border-gray-300 rounded-lg p-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Navigation */}
          <div className="flex justify-end pt-4">
            <button
              onClick={handleNext}
              disabled={!keywords.trim() || !reflection.trim()}
              className="px-6 py-3 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:bg-gray-400 transition"
            >
              Next →
            </button>
          </div>

        </div>
      </div>
    </main>
  );
}
