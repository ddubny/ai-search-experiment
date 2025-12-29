"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ProgressBar from "../../components/ProgressBar";

const REQUIRED_TIME = 240; // 4 minutes

export default function Experiment() {
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [participantId, setParticipantId] = useState(null);

  const [scenario, setScenario] = useState("");
  const [task, setTask] = useState("");
  const [systemType, setSystemType] = useState(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);

  const [scraps, setScraps] = useState([]);
  const [seconds, setSeconds] = useState(0);

  const [taskOpen, setTaskOpen] = useState(true);
  const [loading, setLoading] = useState(true);

  /* =========================
     Initial setup
  ========================= */
  useEffect(() => {
    const id = localStorage.getItem("participant_id");
    if (!id) {
      window.location.href = "/check";
      return;
    }
    setParticipantId(id);
    
    const storedCase = localStorage.getItem("search_case");
    const storedTask = localStorage.getItem("search_task");
    const taskType = localStorage.getItem("task_type");
    
    if (storedCase) {
      setScenario(storedCase);
    }
    
    if (storedTask) {
      setTask(storedTask);
    }

    const storedSystem = localStorage.getItem("systemType");
    if (storedSystem === "search" || storedSystem === "genai") {
      setSystemType(storedSystem);
    } else {
      const assignedType = Math.random() < 0.5 ? "search" : "genai";
      localStorage.setItem("systemType", assignedType);
      setSystemType(assignedType);
    }

    const savedScraps = localStorage.getItem("scrapbook");
    if (savedScraps) setScraps(JSON.parse(savedScraps));

    setLoading(false);
  }, []);

  useEffect(() => {
    localStorage.setItem("scrapbook", JSON.stringify(scraps));
  }, [scraps]);

  /* =========================
     TIMER (STEP 2)
  ========================= */
  useEffect(() => {
    if (step !== 2) return;
    const timer = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [step]);

  /* =========================
     SEARCH HANDLER
  ========================= */
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    try {
      if (systemType === "search") {
        const res = await fetch(
          `/api/SearchEngine?q=${encodeURIComponent(searchQuery)}&start=1`
        );
        const data = await res.json();

        const results =
          data.items?.map((item, idx) => ({
            id: `search-${idx}`,
            title: item.title,
            snippet: item.snippet,
            link: item.link,
          })) || [];

        setSearchResults(results);
      }

      if (systemType === "genai") {
        const prompt = `
Scenario:
${scenario}

Task:
${task}

User query:
${searchQuery}
        `.trim();

        const res = await fetch("/api/llm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt }),
        });

        const data = await res.json();

        setSearchResults([
          {
            id: "genai-1",
            title: "AI Response",
            snippet: data.text || "No response generated.",
            link: "",
          },
        ]);
      }

      setSearchQuery("");
    } catch (err) {
      console.error("Search error:", err);
    }
  };

  /* =========================
     SCRAPBOOK
  ========================= */
  const handleDrop = (e) => {
    e.preventDefault();
    const dropped = JSON.parse(e.dataTransfer.getData("text/plain"));
    setScraps([...scraps, { ...dropped, comment: "" }]);
  };

  const handleNext = () => {
    router.push("/postsurvey");
  };

  if (loading) {
    return (
      <main className="flex items-center justify-center min-h-screen">
        Loading experiment...
      </main>
    );
  }

  /* =========================
     STEP 1: START
  ========================= */
  if (step === 1) {
    return (
      <div className="flex flex-col min-h-screen">
        <ProgressBar progress={25} />

        <div className="flex flex-1 items-center justify-center">
          <div className="max-w-2xl w-full text-center space-y-6">
            <h1 className="text-3xl font-bold">
              Now you will start a search
            </h1>

            <div className="bg-gray-100 p-6 rounded-lg text-left space-y-2">
              <p className="font-semibold">Scenario</p>
              <p className="text-sm">{scenario}</p>

              <p className="font-semibold pt-2">Search Task</p>
              <p className="text-sm">{task}</p>
            </div>

            <p className="text-red-600 font-medium text-sm">
              You should search for at least 4 minutes.
            </p>

            <button
              onClick={() => setStep(2)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg"
            >
              Start Experiment →
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* =========================
     STEP 2: SEARCH
  ========================= */
  return (
    <div className="flex flex-col min-h-screen">
      <ProgressBar progress={40} />

      {/* Timer */}
      <div className="fixed top-4 right-6 bg-black text-white px-4 py-2 rounded-md text-sm z-50">
        Time: {Math.floor(seconds / 60)}:
        {(seconds % 60).toString().padStart(2, "0")}
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Task Panel */}
        <div
          className={`${
            taskOpen ? "w-1/4 min-w-[280px]" : "w-12"
          } bg-gray-100 border-r transition-all duration-300 flex flex-col`}
        >
          <button
            onClick={() => setTaskOpen(!taskOpen)}
            className="p-2 text-sm font-medium hover:bg-gray-200"
          >
            {taskOpen ? "◀ Search Task" : "▶"}
          </button>

          {taskOpen && (
            <div className="p-4 overflow-y-auto">
              <h3 className="font-semibold mb-2">Search Scenario</h3>
              <p className="text-sm mb-4">{scenario}</p>

              <h3 className="font-semibold mb-2">Search Task</h3>
              <p className="text-sm">{task}</p>
            </div>
          )}
        </div>

        {/* Search Area */}
        <div className="flex-1 flex flex-col border-r overflow-y-auto">
          <form onSubmit={handleSearch} className="flex p-3 border-b">
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 border px-3 py-2"
              placeholder="Type your query..."
            />
            <button className="bg-blue-600 text-white px-4">
              Search
            </button>
          </form>

          <div className="flex-1 p-4 bg-gray-50 overflow-y-auto">
            {searchResults.map((r) => (
              <div
                key={r.id}
                draggable
                onDragStart={(e) =>
                  e.dataTransfer.setData("text/plain", JSON.stringify(r))
                }
                className="bg-white border p-3 mb-3 rounded cursor-grab"
              >
                <h3 className="font-semibold">{r.title}</h3>
                <p className="text-sm">{r.snippet}</p>
                {r.link && (
                  <a
                    href={r.link}
                    target="_blank"
                    className="text-blue-600 text-sm"
                  >
                    {r.link}
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Scrapbook */}
        <div
          className="w-[18%] min-w-[220px] bg-gray-50 p-4 overflow-y-auto border-l"
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
        >
          <h2 className="font-semibold mb-3">Scrapbook</h2>

          {scraps.map((item, i) => (
            <div key={i} className="bg-white p-3 mb-3 rounded border">
              <p className="text-sm">{item.snippet}</p>
              <textarea
                className="w-full border mt-2 p-2 text-sm"
                placeholder="Your notes..."
                value={item.comment}
                onChange={(e) => {
                  const updated = [...scraps];
                  updated[i].comment = e.target.value;
                  setScraps(updated);
                }}
              />
            </div>
          ))}

          {seconds >= REQUIRED_TIME && (
            <button
              onClick={handleNext}
              className="w-full mt-4 bg-blue-600 text-white py-3 rounded-lg"
            >
              Proceed to Next Step →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
