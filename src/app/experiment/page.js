"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ProgressBar from "../../components/ProgressBar";

export default function Experiment() {
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [participantId, setParticipantId] = useState(null);
  const [scenario, setScenario] = useState("");
  const [systemType, setSystemType] = useState(""); // "search" | "genai"

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);

  const [scraps, setScraps] = useState([]);
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

    const storedScenario = localStorage.getItem("scenario");
    const storedSystem = localStorage.getItem("systemType");
    if (storedScenario) setScenario(storedScenario);
    if (storedSystem) setSystemType(storedSystem);

    const savedScraps = localStorage.getItem("scrapbook");
    if (savedScraps) setScraps(JSON.parse(savedScraps));

    setLoading(false);
  }, []);

  useEffect(() => {
    localStorage.setItem("scrapbook", JSON.stringify(scraps));
  }, [scraps]);

  /* =========================
     SEARCH HANDLER (핵심)
  ========================= */
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    try {
      // -----------------------
      // CASE 1: Search Engine
      // -----------------------
      if (systemType === "search") {
        const res = await fetch(
          `/api/SearchEngine?q=${encodeURIComponent(searchQuery)}&start=1`
        );
        const data = await res.json();

        const items = (data.items || []).map((item, idx) => ({
          id: `search-${idx}`,
          title: item.title,
          snippet: item.snippet,
          link: item.link,
        }));

        setSearchResults(items);
      }

      // -----------------------
      // CASE 2: Generative AI
      // -----------------------
      if (systemType === "genai") {
        const prompt = `
Scenario:
${scenario}

User query:
${searchQuery}

Please provide an informative response to help the user make an informed decision.
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
            snippet: data.text,
            link: "",
          },
        ]);
      }
    } catch (err) {
      console.error("Search error:", err);
      alert("An error occurred while searching. Please try again.");
    }

    setSearchQuery("");
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
     STEP 1
  ========================= */
  if (step === 1) {
    return (
      <div className="flex flex-col min-h-screen">
        <ProgressBar progress={25} />
        <div className="flex flex-1 items-center justify-center">
          <div className="max-w-3xl text-center">
            <h1 className="text-3xl font-bold mb-6">
              Now you will start a search
            </h1>

            <div className="bg-gray-100 p-6 rounded-lg mb-6 text-left">
              <strong>Scenario:</strong>
              <p>{scenario}</p>
            </div>

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

      <div className="flex flex-1 overflow-hidden">
        {/* Task panel */}
        <div
          className={`${
            taskOpen ? "w-72" : "w-12"
          } bg-gray-100 border-r transition-all`}
        >
          <button
            onClick={() => setTaskOpen(!taskOpen)}
            className="p-2 w-full text-left"
          >
            {taskOpen ? "◀ Search Task" : "▶"}
          </button>
          {taskOpen && <p className="p-3 text-sm">{scenario}</p>}
        </div>

        {/* Main */}
        <div className="flex-1 p-6 grid grid-cols-1 md:grid-cols-[60%_40%] gap-6">
          {/* Search */}
          <div className="border rounded-lg flex flex-col">
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

            <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
              {searchResults.length === 0 ? (
                <p className="italic text-gray-500">No results yet.</p>
              ) : (
                searchResults.map((r) => (
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
                ))
              )}
            </div>
          </div>

          {/* Scrapbook */}
          <div
            className="border-2 border-dashed rounded-lg p-4 bg-gray-50 overflow-y-auto"
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
          >
            <h2 className="font-semibold mb-3">Scrapbook</h2>
            {scraps.map((item, i) => (
              <div key={i} className="bg-white p-3 mb-3 rounded border">
                <p>{item.snippet}</p>
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
          </div>
        </div>
      </div>

      <button
        onClick={handleNext}
        className="absolute top-4 right-6 bg-green-600 text-white px-6 py-3 rounded-lg"
      >
        Next →
      </button>
    </div>
  );
}
