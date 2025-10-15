"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabaseClient";
import ProgressBar from "../../components/ProgressBar";

export default function Thankyou() {
  const [email, setEmail] = useState("");
  const [participantId, setParticipantId] = useState(null); // ✅ 추가
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // ✅ localStorage에서 participant_id 불러오기
  useEffect(() => {
    const id = localStorage.getItem("participant_id");
    if (!id) {
      window.location.href = "/check"; // ID 없을 시 초기화
      return;
    }
    setParticipantId(id);
  }, []);

  // ✅ Supabase에 이메일 + participant_id 저장
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const { error } = await supabase.from("thankyou").insert([
        {
          participant_id: participantId, // ✅ 추가됨
          email,
          created_at: new Date().toISOString(),
        },
      ]);

      if (error) throw error;

      setMessage("Thank you! Your email has been submitted.");
      setEmail("");
    } catch (err) {
      console.error("❌ Error saving email:", err);
      setMessage("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex flex-col min-h-screen">
      {/* ✅ Progress Bar */}
      <div className="w-full fixed top-0 left-0 z-50">
        <ProgressBar progress={100} />
      </div>

      {/* ✅ Content */}
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold mb-2">Thank you for participating!</h1>
          <h1 className="text-2xl font-bold mb-2">Your responses are recorded.</h1>
          <p className="text-gray-600 mb-6">
            The experiment has been completed. <br />
            You will receive your gift card within <br />
            <span className="font-semibold">7 business days</span> after participation.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="email"
              required
              placeholder="Enter your email for the gift card"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white font-semibold py-2 rounded-lg hover:bg-blue-700 transition duration-300"
            >
              {loading ? "Submitting..." : "Submit"}
            </button>
          </form>

          {message && (
            <p className="mt-4 text-sm text-gray-700">{message}</p>
          )}
        </div>
      </div>
    </main>
  );
}
