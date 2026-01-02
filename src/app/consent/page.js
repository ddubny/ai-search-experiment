"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ProgressBar from "../../components/ProgressBar";

export default function ConsentPage() {
  const router = useRouter();
  const [checked, setChecked] = useState(false);
  const [participantId, setParticipantId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load participant UUID
  useEffect(() => {
    const id = localStorage.getItem("participant_id");
    if (!id) {
      window.location.href = "/check";
    } else {
      setParticipantId(id);
    }
  }, []);

  const canContinue = checked;

  const handleContinue = async () => {
    if (!participantId || isSubmitting) return;
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/airtable/consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          participant_id: participantId,
          consent: "yes",
        }),
      });

      const data = await res.json();
      if (!data.success) throw new Error("Save failed");

      router.push("/task");
    } catch (err) {
      console.error("Consent save error:", err);
      alert("Error saving consent. Please try again.");
      setIsSubmitting(false);
    }
  };

  const handleDecline = async () => {
    if (!participantId) return;

    try {
      await fetch("/api/airtable/consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          participant_id: participantId,
          consent: "no",
        }),
      });

      router.push("/thankyou?status=declined");
    } catch (err) {
      console.error("Consent decline error:", err);
    }
  };

  if (!participantId) {
    return (
      <main className="flex items-center justify-center min-h-screen text-gray-700">
        <p>Loading participant information...</p>
      </main>
    );
  }

  return (
    <main className="min-h-[100svh] bg-white text-gray-900">
      {/* Progress Bar */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <ProgressBar progress={5} />
      </div>

      <div className="mx-auto max-w-3xl px-6 py-12">
        {/* ===== Welcome Section ===== */}
        <header className="mb-12 space-y-4">
          <h1 className="text-4xl font-bold tracking-tight">
            Welcome to the Study!
          </h1>

          <div className="text-base text-gray-700 space-y-2 leading-relaxed">
            <p>
              Hello, my name is Subin Seo. I am a master’s student at the
              University of Maryland, College Park. I am conducting a research
              project about how people search online.
            </p>
            <p>
              Please read the following information carefully before deciding
              whether to participate.
            </p>
          </div>
        </header>

        {/* ===== Informed Consent Title ===== */}
        <section className="mb-8">
          <h2 className="text-3xl font-bold tracking-tight">
            Informed Consent
          </h2>
        </section>

        {/* ===== Consent Content ===== */}
        <section className="space-y-6">
          <div>
            <h3 className="text-xl font-semibold">Study Title</h3>
            <p className="mt-1">
              Serendipity and Information Seeking in Search Engines vs.
              Generative AI
            </p>
          </div>

          <div>
            <h3 className="text-xl font-semibold">Purpose of the Study</h3>
            <p className="mt-1">
              The purpose of this research is to understand how users experience
              serendipity and problem-solving when using search engines compared
              to generative AI systems.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-semibold">Procedures</h3>
            <p className="mt-1">
              If you agree to participate, you will complete a short pre-survey,
              perform an information-seeking task using either a search engine
              or a generative AI system, and then complete a post-survey about
              your experience. The study typically takes about 10–20 minutes.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-semibold">Risks and Discomforts</h3>
            <p className="mt-1">
              Risks are minimal and no greater than those encountered during
              typical online browsing. You may skip any question you prefer not
              to answer.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-semibold">Benefits</h3>
            <p className="mt-1">
              While there may be no direct personal benefit, your participation
              will help researchers better understand human–AI interaction and
              information-seeking behaviors.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-semibold">Confidentiality & Data</h3>
            <p className="mt-1">
              We will not collect personally identifying information unless
              explicitly stated. Responses will be stored securely and analyzed
              anonymously.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-semibold">Voluntary Participation</h3>
            <p className="mt-1">
              Participation is entirely voluntary. You may withdraw at any time
              without penalty by closing this browser window.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-semibold">Contact Information</h3>
            <p className="mt-1">
              If you have questions about this research, please contact the
              research team at{" "}
              <span className="font-mono">example@university.edu</span>. For
              questions about your rights as a participant, you may contact the
              IRB at{" "}
              <span className="font-mono">irb@university.edu</span>.
            </p>
          </div>
        </section>

        <hr className="my-10 border-gray-200" />

        {/* ===== Consent Checkbox ===== */}
        <div className="flex items-start gap-3">
          <input
            id="agree"
            type="checkbox"
            className="mt-1 h-5 w-5 rounded border-gray-300"
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
          />
          <label htmlFor="agree" className="text-sm leading-6">
            I have read and understood the information above. I am at least 18
            years old and voluntarily agree to participate in this study.
          </label>
        </div>

        {/* ===== Action Buttons ===== */}
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={handleDecline}
            className="rounded-xl border border-gray-300 px-4 py-2 text-sm"
          >
            Decline
          </button>

          <button
            type="button"
            onClick={handleContinue}
            disabled={!canContinue || isSubmitting}
            className={`rounded-xl px-4 py-2 text-sm font-semibold text-white ${
              canContinue && !isSubmitting
                ? "bg-gray-900 hover:bg-black"
                : "bg-gray-400 cursor-not-allowed"
            }`}
          >
            {isSubmitting ? "Saving consent…" : "Continue"}
          </button>
        </div>

        <p className="mt-4 text-xs text-gray-500">
          By selecting “Continue,” you indicate your electronic consent and
          agree to participate in this study.
        </p>
      </div>
    </main>
  );
}
