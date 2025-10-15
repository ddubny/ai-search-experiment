"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";
import ProgressBar from "../../components/ProgressBar";

export default function Experiment() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [participantId, setParticipantId] = useState(null); // ✅ 추가
  const [scenario, setScenario] = useState("");
  const [systemType, setSystemType] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [scraps, setScraps] = useState([]);
  const [taskOpen, setTaskOpen] = useState(true);
  const [loading, setLoading] = useState(true);

  // ===== 초기 설정 =====
  useEffect(() => {
    const id = localStorage.getItem("participant_id");
    if (!id) {
      window.location.href = "/check"; // participant_id 없으면 초기화
      return;
    }
    setParticipantId(id);

    // 시나리오 및 시스템 불러오기
    const storedScenario = localStorage.getItem("scenario");
    const storedSystem = localStorage.getItem("systemType");
    if (storedScenario) setScenario(storedScenario);
    if (storedSystem) setSystemType(storedSystem);

    // 스크랩 불러오기
    const savedScraps = localStorage.getItem("scrapbook");
    if (savedScraps) setScraps(JSON.parse(savedScraps));

    setLoading(false);
  }, []);

  // ✅ 스크랩북 자동 저장 (로컬)
  useEffect(() => {
    localStorage.setItem("scrapbook", JSON.stringify(scraps));
  }, [scraps]);

  // ✅ 검색 수행 시 Supabase에 로그 저장
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    const newResult = { id: Date.now(), text: `Result for "${searchQuery}" from ${systemType}.` };
    setSearchResults([newResult]);

    try {
      await supabase.from("experiment_logs").insert([
        {
          participant_id: participantId,
          event_type: "search",
          query: searchQuery,
          system_type: systemType,
          scenario,
          timestamp: new Date().toISOString(),
        },
      ]);
    } catch (err) {
      console.error("❌ Error logging search:", err);
    }

    setSearchQuery("");
  };

  // ✅ 스크랩 추가 시 Supabase에 기록
  const handleDrop = async (e) => {
    e.preventDefault();
    const dropped = JSON.parse(e.dataTransfer.getData("text/plain"));
    const updatedScraps = [...scraps, { ...dropped, comment: "" }];
    setScraps(updatedScraps);

    try {
      await supabase.from("experiment_logs").insert([
        {
          participant_id: participantId,
          event_type: "scrap_add",
          content: dropped.text,
          system_type: systemType,
          scenario,
          timestamp: new Date().toISOString(),
        },
      ]);
    } catch (err) {
      console.error("❌ Error logging scrap:", err);
    }
  };

  // ✅ 실험 종료 시 (Next 버튼 클릭)
  const handleNext = async () => {
    try {
      await supabase.from("experiment_logs").insert([
        {
          participant_id: participantId,
          event_type: "experiment_end",
          system_type: systemType,
          scenario,
          scraps: scraps,
          timestamp: new Date().toISOString(),
        },
      ]);
    } catch (err) {
      console.error("❌ Error saving final logs:", err);
    }
    router.push("/postsurvey");
  };

  if (loading)
    return (
      <main className="flex items-center justify-center min-h-screen text-gray-700">
        <p>Loading experiment...</p>
      </main>
    );

  // ===== Step 1: Task view =====
  if (step === 1) {
    return (
      <div className="flex flex-col min-h-screen">
        <div className="w-full px-6 py-4 bg-gray-50 border-b border-gray-200">
          <ProgressBar progress={25} />
        </div>

        <div className="flex flex-col items-center justify-center flex-1 px-6">
          <div className="max-w-3xl text-center">
            <h1 className="text-3xl font-bold mb-6">Now you will start a search <br /> based on the given scenario</h1>

            <div className="bg-gray-100 p-6 rounded-lg shadow-sm mb-6 text-left">
              <p className="text-lg leading-relaxed">
                <strong>Scenario:</strong> {scenario}
              </p>
            </div>

            <p className="text-lg mb-8">
              You will perform this task using{" "}
              <span className="font-semibold text-blue-600">
                {systemType === "search" ? "a Search Engine" : "a Generative AI System"}
              </span>.
            </p>

            <button
              onClick={() => setStep(2)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
            >
              Start Experiment →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ===== Step 2: Experiment interface =====
  return (
    <div className="flex flex-col min-h-screen">
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <ProgressBar progress={40} />
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left task section */}
        <div
          className={`${
            taskOpen ? "w-72" : "w-12"
          } transition-all duration-300 bg-gray-100 border-r border-gray-300 flex flex-col`}
        >
          <div className="flex items-center justify-between px-3 py-2 border-b border-gray-300">
            <h2 className="font-semibold">{taskOpen ? "Search Task" : ""}</h2>
            <button
              onClick={() => setTaskOpen(!taskOpen)}
              className="text-gray-600 hover:text-black"
            >
              {taskOpen ? "◀" : "▶"}
            </button>
          </div>
          {taskOpen && (
            <div className="p-3 text-sm overflow-y-auto">
              <p>{scenario}</p>
            </div>
          )}
        </div>

        {/* Main + Scrapbook */}
        <div className="flex-1 flex flex-col bg-white">
          <div className="text-center py-4 border-b border-gray-300 bg-gray-50">
            <p className="text-lg">
              Find the best information you can to make an informed decision about the given task.
            </p>
          </div>

          <div className="flex-1 grid grid-cols-1 md:grid-cols-[60%_40%] gap-6 p-6 overflow-hidden">
            {/* Search section */}
            <div className="flex flex-col h-full border border-gray-300 rounded-lg shadow-sm">
              <form onSubmit={handleSearch} className="flex p-3 border-b border-gray-200">
                <input
                  type="text"
                  placeholder="Type your query..."
                  className="flex-1 border border-gray-300 rounded-l-md px-3 py-2 focus:outline-none text-lg"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 rounded-r-md hover:bg-blue-700 text-lg"
                >
                  Search
                </button>
              </form>

              <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
                {searchResults.length === 0 ? (
                  <p className="text-gray-500 italic text-center mt-6">
                    No results yet. Try typing something above.
                  </p>
                ) : (
                  searchResults.map((r) => (
                    <div
                      key={r.id}
                      draggable
                      onDragStart={(e) =>
                        e.dataTransfer.setData("text/plain", JSON.stringify(r))
                      }
                      className="p-3 mb-2 border border-gray-300 bg-white rounded-md shadow-sm cursor-grab hover:bg-blue-50"
                    >
                      {r.text}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Scrapbook */}
            <div
              className="border-2 border-dashed border-gray-400 rounded-lg p-4 bg-gray-50 overflow-y-auto"
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
            >
              <h2 className="text-xl font-semibold mb-3">Scrapbook</h2>
              {scraps.length === 0 ? (
                <p className="text-gray-500 italic">
                  Drag items from the left panel into this scrapbook.
                </p>
              ) : (
                scraps.map((item, i) => (
                  <div
                    key={i}
                    className="bg-white p-3 mb-4 rounded-md shadow-sm border border-gray-300"
                  >
                    <p className="font-medium mb-2">{item.text}</p>
                    <textarea
                      className="w-full border border-gray-300 rounded-md p-2 text-sm"
                      placeholder="Write your reflection..."
                      value={item.comment}
                      onChange={(e) => {
                        const updated = [...scraps];
                        updated[i].comment = e.target.value;
                        setScraps(updated);
                      }}
                    />
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Next button */}
      <button
        onClick={handleNext}
        className="absolute top-[15px] right-6 bg-green-600 text-white px-6 py-3 rounded-lg font-medium shadow-md hover:bg-green-700 transition"
      >
        Next →
      </button>
    </div>
  );
}
