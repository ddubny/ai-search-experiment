"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ProgressBar from "../../components/ProgressBar";

export default function ConsentPage() {
  const router = useRouter();
  const [checked, setChecked] = useState(false);
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [participantId, setParticipantId] = useState(null);

  // ✅ check 페이지에서 생성된 UUID 불러오기
  useEffect(() => {
    const id = localStorage.getItem("participant_id");
    if (!id) {
      // 만약 UUID가 없으면 check 페이지로 이동
      window.location.href = "/check";
    } else {
      setParticipantId(id);
    }
  }, []);

  const canContinue = checked && name.trim() !== "" && date.trim() !== "";
  const consentKey = participant_id & "_" & DATETIME_FORMAT(created_at, 'YYYY-MM-DD_HH:mm:ss');

  // ✅ 동의 버튼 클릭 시 데이터베이스에 저장 + 다음 단계 이동
  const handleContinue = async () => {
  if (!participantId) return;

  try {
    const res = await fetch("/api/consent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        consent_key: consentKey,
        participant_id: participantId,
        consent: "yes",
        name,
        date,
      }),
    });

    const data = await res.json();

    if (!data.success) {
      alert("Error saving consent. Please try again.");
      return;
    }

    localStorage.setItem(
      "irbConsent",
      JSON.stringify({
        participant_id: participantId,
        consent: "yes",
        name,
        date,
      })
    );

    router.push("/task");
  } catch (err) {
    console.error("Consent error:", err);
    alert("Unexpected error occurred.");
  }
};



  // ✅ 거부 버튼 클릭 시 데이터베이스 저장 + thankyou 이동
const handleDecline = async () => {
  if (!participantId) return;

  try {
    await fetch("/api/consent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        consent_key: consentKey,
        participant_id: participantId,
        consent: "no",
        name,
        date,
      }),
    });

    localStorage.setItem(
      "irbConsent",
      JSON.stringify({
        participant_id: participantId,
        consent: "no",
        name,
        date,
      })
    );

    router.push("/thankyou?status=declined");
  } catch (err) {
    console.error("Consent decline error:", err);
  }
};


  if (!participantId)
    return (
      <main className="flex items-center justify-center min-h-screen text-gray-700">
        <p>Loading participant information...</p>
      </main>
    );

  return (
    <main className="min-h-[100svh] bg-white text-gray-900">
      {/* ✅ Progress bar section */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <ProgressBar progress={5} />
      </div>

      <div className="mx-auto max-w-3xl px-6 py-10">
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Informed Consent</h1>
          <p className="mt-2 text-sm text-gray-600">
            Please read the following information carefully before deciding whether to participate.
          </p>
        </header>

        {/* --- 본문 섹션 동일 --- */}
        <section className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold">Study Title</h2>
            <p className="mt-1">
              Serendipity and Information Seeking in Search Engines vs. Generative AI
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold">Purpose of the Study</h2>
            <p className="mt-1">
              The purpose of this research is to understand how users experience serendipity and
              problem-solving when using search engines compared to generative AI systems.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold">Procedures</h2>
            <p className="mt-1">
              If you agree to participate, you will complete a short pre-survey, perform an
              information-seeking task using either a search engine or a generative AI system,
              and then complete a post-survey about your experience. The study typically takes
              about 10–20 minutes.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold">Risks and Discomforts</h2>
            <p className="mt-1">
              Risks are minimal and no greater than those encountered during typical online
              browsing. You may skip any question you prefer not to answer.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold">Benefits</h2>
            <p className="mt-1">
              While there may be no direct personal benefit, your participation will help researchers
              better understand human–AI interaction and information seeking behaviors.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold">Confidentiality & Data</h2>
            <p className="mt-1">
              We will not collect personally identifying information unless explicitly stated.
              Responses will be stored securely and analyzed anonymously.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold">Voluntary Participation</h2>
            <p className="mt-1">
              Participation is entirely voluntary. You may withdraw at any time without penalty by
              closing this browser window.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold">Contact Information</h2>
            <p className="mt-1">
              If you have questions about this research, please contact the research team at{" "}
              <span className="font-mono">example@university.edu</span>. For questions about your
              rights as a participant, you may contact the IRB at{" "}
              <span className="font-mono">irb@university.edu</span>.
            </p>
          </div>
        </section>

        <hr className="my-8 border-gray-200" />

        <div className="flex items-start gap-3">
          <input
            id="agree"
            type="checkbox"
            className="mt-1 h-5 w-5 rounded border-gray-300"
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
          />
          <label htmlFor="agree" className="text-sm leading-6">
            I have read and understood the information above. I am at least 18 years old and
            voluntarily agree to participate in this study.
          </label>
        </div>

        {/* Signature Section */}
        <div className="mt-6 space-y-4 border border-gray-200 rounded-xl p-4">
          <h3 className="font-semibold text-lg">Electronic Signature</h3>
          <p className="text-sm text-gray-600">
            Please type your full name as your electronic signature and provide today’s date.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:gap-6">
            <div className="flex flex-col flex-1">
              <label htmlFor="signature-name" className="text-sm font-medium text-gray-700">
                Full Name
              </label>
              <input
                id="signature-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Jane Doe"
                className="mt-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-700"
              />
            </div>
            <div className="flex flex-col flex-1">
              <label htmlFor="signature-date" className="text-sm font-medium text-gray-700">
                Date
              </label>
              <input
                id="signature-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="mt-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-700"
              />
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={handleDecline}
            className="inline-flex items-center justify-center rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50"
          >
            Decline
          </button>
          <button
            type="button"
            onClick={handleContinue}
            disabled={!canContinue}
            className={`inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold text-white ${
              canContinue
                ? "bg-gray-900 hover:bg-black"
                : "bg-gray-400 cursor-not-allowed"
            }`}
          >
            Continue
          </button>
        </div>

        <p className="mt-4 text-xs text-gray-500">
          By selecting “Continue,” you provide your electronic signature and agree to participate
          in this study.
        </p>
      </div>
    </main>
  );
}
