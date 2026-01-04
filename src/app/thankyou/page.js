"use client";

import { useEffect, useState } from "react";
import ProgressBar from "../../components/ProgressBar";

const COMPLETION_CODE = "C1P8TZBS";
const COMPLETION_URL =
  "https://app.prolific.com/submissions/complete?cc=C1P8TZBS";

export default function Thankyou() {
  const [copied, setCopied] = useState("");

  useEffect(() => {
    const id = localStorage.getItem("participant_id");
    if (!id) {
      window.location.href = "/check";
    }
  }, []);

  const handleCopy = async (text, type) => {
    await navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(""), 2000);
  };

  return (
    <main className="flex flex-col min-h-screen">
      {/* Progress Bar */}
      <div className="w-full fixed top-0 left-0 z-50">
        <ProgressBar progress={100} />
      </div>

      {/* Content */}
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="text-center max-w-lg space-y-6">
          <h1 className="text-2xl font-bold">
            Thank you for participating!
          </h1>
          <p className="text-gray-600">
            You have successfully completed the study.
          </p>

          {/* Completion URL */}
          <div className="border rounded-lg p-4 bg-gray-50">
            <p className="text-lg font-semibold mb-2">
              Prolific Completion Link
            </p>
            <div className="flex items-center gap-2">
              <input
                readOnly
                value={COMPLETION_URL}
                className="flex-1 border border-gray-300 rounded-lg p-2 text-lg text-gray-700 bg-white"
              />
              <button
                onClick={() => handleCopy(COMPLETION_URL, "url")}
                className="px-3 py-2 bg-blue-600 text-white rounded-lg text-lg hover:bg-blue-700"
              >
                Copy
              </button>
            </div>
            {copied === "url" && (
              <p className="text-xs text-green-600 mt-1">
                Link copied to clipboard
              </p>
            )}
          </div>

          {/* Completion Code */}
          <div className="border rounded-lg p-4 bg-gray-50">
            <p className="text-lg font-semibold mb-2">
              Completion Code
            </p>
            <div className="flex items-center gap-2">
              <input
                readOnly
                value={COMPLETION_CODE}
                className="flex-1 border border-gray-300 rounded-lg p-2 text-lg text-gray-700 bg-white text-center font-mono"
              />
              <button
                onClick={() => handleCopy(COMPLETION_CODE, "code")}
                className="px-3 py-2 bg-blue-600 text-white rounded-lg text-lg hover:bg-blue-700"
              >
                Copy
              </button>
            </div>
            {copied === "code" && (
              <p className="text-xs text-green-600 mt-1">
                Code copied to clipboard
              </p>
            )}
          </div>

          {/* Explanation */}
          <div className="text-center text-sm text-gray-600 leading-relaxed">
            <p>
              To receive credit for your participation on Prolific, you need to
              confirm that you have completed this study.
            </p>
            <p className="mt-2">
              You can do this in one of two ways: either by clicking the
              completion link above, which will automatically redirect you back
              to Prolific, or by copying and pasting the completion code into
              Prolific manually.
            </p>
            <p className="mt-2 font-medium">
              Please make sure to complete one of these steps to ensure your
              submission is recorded correctly.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
