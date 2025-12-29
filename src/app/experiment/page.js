"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ProgressBar from "../../components/ProgressBar";
import ReactMarkdown from "react-markdown";

const REQUIRED_TIME = 240; // 4 minutes

export default function Experiment() {
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [participantId, setParticipantId] = useState(null);

  const [scenario, setScenario] = useState("");
  const [task, setTask] = useState("");
  const [systemType, setSystemType] = useState(null);

  // Search Engine
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);

  // GenAI Chat
  const [chatHistory, setChatHistory] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);

  // Common
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

    // Load task assignment from TaskPage
    const storedCase = localStorage.getItem("search_case");
    const storedTask = localStorage.getItem("search_task");

    if (storedCase) setScenario(storedCase);
    if (storedTask) setTask(storedTask);

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
     SEARCH ENGINE HANDLER
  ========================= */
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    try {
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
      setSearchQuery("");
    } catch (err) {
      console.error(err);
    }
  };

  /* =========================
     GENAI HANDLER (CHAT)
  ========================= */
  const handleGenAISubmit = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim() || isGenerating) return;

    const userInput = searchQuery;

    setChatHistory((prev) => [
      ...prev,
      { role: "user", content: userInput },
      { role: "assistant", content: "Generating response...", loading: true },
    ]);

    setSearchQuery("");
    setIsGenerating(true);

    try {
      const prompt = `
      Please answer briefly in plain text.
      Use clear headings, bullet points, and formatting to organize the information.

      Scenario:
      ${scenario}
      
      Task:
      ${task}
      
      User:
      ${userInput}
      `.trim();

      const res = await fetch("/api/llm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          maxTokens: 80,
        }),
      });

      const data = await res.json();

      setChatHistory((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: "assistant",
          content: data.text || "No response generated.",
        };
        return updated;
      });
    } catch (err) {
      console.error(err);
      setChatHistory((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: "assistant",
          content: "An error occurred while generating the response.",
        };
        return updated;
      });
    } finally {
      setIsGenerating(false);
    }
  };

  /* =========================
     SCRAPBOOK
  ========================= */
  const handleDrop = (e) => {
    e.preventDefault();
    const raw = e.dataTransfer.getData("text/plain");
    if (!raw) return;
    try {
      const dropped = JSON.parse(raw);
      setScraps([...scraps, { ...dropped, comment: "" }]);
    } catch {}
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
     STEP 1
  ========================= */
  if (step === 1) {
    return (
      <div className="flex flex-col min-h-screen">
        <ProgressBar progress={25} />

        <div className="flex flex-1 items-center justify-center">
          <div className="max-w-2xl w-full text-center space-y-6">
            <h1 className="text-3xl font-bold">Now you will start a search</h1>

            <div className="bg-gray-100 p-6 rounded-lg text-left space-y-2">
              <p className="font-semibold">Scenario</p>
              <p className="text-base">{scenario}</p>

              <p className="font-semibold pt-2">Search Task</p>
              <p className="text-base">{task}</p>
            </div>

            <p className="text-red-600 font-medium text-sm">
              You must search for at least four minutes before proceeding.
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
     STEP 2
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
        {/* Left Panel */}
        <div
          className={`${
            taskOpen ? "w-1/5 min-w-[220px]" : "w-12"
          } bg-gray-100 border-r transition-all duration-300 flex flex-col`}
        >
          <button
            onClick={() => setTaskOpen(!taskOpen)}
            className="p-2 text-sm font-medium hover:bg-gray-200"
          >
            {taskOpen ? (
              <span className="italic text-gray-600">
                Click the button to collapse the panel
              </span>
            ) : (
              "▶"
            )}
          </button>

          {taskOpen && (
            <div className="p-4 overflow-y-auto space-y-4">
              {/* Researcher Notes */}
              <div className="bg-white border rounded-lg p-3 text-sm italic text-gray-600 leading-relaxed">
                <p>
                  Please feel free to search freely regarding the search task
                  below. You can also use the scrapbook to save anything you want
                  to keep for later.
                </p>
                <p className="mt-2">
                  You should spend at least four minutes searching and make
                  multiple meaningful search attempts during that time.
                </p>
                <p className="mt-2">
                  If the conditions are met, a button to proceed will appear in
                  the bottom right corner.
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-1 text-base">
                  Search Scenario
                </h3>
                <p className="text-base">{scenario}</p>
              </div>

              <div>
                <h3 className="font-semibold mb-1 text-base">Search Task</h3>
                <p className="text-base">{task}</p>
              </div>
            </div>
          )}
        </div>

        {/* Main Area */}
        <div className="flex-1 border-r overflow-hidden">
          {systemType === "search" ? (
            /* Search Engine UI */
            <div className="flex flex-col h-full">
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
                      e.dataTransfer.setData(
                        "text/plain",
                        JSON.stringify(r)
                      )
                    }
                    className="bg-white border p-3 mb-3 rounded cursor-grab"
                  >
                    <h3 className="font-semibold text-blue-700 hover:underline">
                      <a
                        href={r.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {r.title}  
                      </a>
                    </h3>
                    <p className="text-sm mt-1">{r.snippet}</p>
                    <a
                       href={r.link}
                       target="_blank"
                       rel="noopener noreferrer"
                       className="text-xs text-green-700 break-all hover:underline mt-1 inline-block"
                       onClick={(e) => e.stopPropagation()}
                    >
                      {r.link}
                    </a>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* GenAI Chat UI */
            <div className="flex flex-col h-full bg-gray-50">
              <div className="flex-1 p-4 overflow-y-auto space-y-4">
                {chatHistory.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`max-w-[80%] p-3 rounded-lg text-sm ${
                      msg.role === "user"
                        ? "bg-blue-600 text-white ml-auto"
                        : msg.loading
                        ? "bg-gray-200 text-gray-500 italic"
                        : "bg-white border text-gray-800"
                    }`}
                  >
                    <ReactMarkdown>
                      {msg.content}
                    </ReactMarkdown>
                  </div>
                ))}
              </div>

              <form
                onSubmit={handleGenAISubmit}
                className="border-t p-3 bg-white"
              >
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={
                    isGenerating
                      ? "Generating response..."
                      : "Ask anything"
                  }
                  disabled={isGenerating}
                  className={`w-full border rounded-full px-4 py-2 ${
                    isGenerating
                      ? "bg-gray-100 cursor-not-allowed"
                      : ""
                  }`}
                />

              </form>
            </div>
          )}
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
