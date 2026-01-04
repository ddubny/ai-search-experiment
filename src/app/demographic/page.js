"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ProgressBar from "../../components/ProgressBar";

export default function DemographicSurvey() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    age: "",
    gender: "",
    gender_other: "",
    education: "",
    race: [],
    hispanic: "",
  });

  const [participantId, setParticipantId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [showWarningModal, setShowWarningModal] = useState(false);

  const requiredFields = ["age", "gender", "education", "hispanic"];

  /* -----------------------------
     participant_id 불러오기
  ------------------------------*/
  useEffect(() => {
    const id = localStorage.getItem("participant_id");
    if (!id) {
      window.location.href = "/check";
      return;
    }
    setParticipantId(id);
  }, []);

  /* -----------------------------
     formData 복원 (새로고침/뒤로가기)
  ------------------------------*/
  useEffect(() => {
    const saved = localStorage.getItem("demographic_form");
    if (saved) {
      setFormData(JSON.parse(saved));
    }
  }, []);

  /* -----------------------------
     formData 자동 저장
  ------------------------------*/
  useEffect(() => {
    localStorage.setItem("demographic_form", JSON.stringify(formData));
  }, [formData]);

  /* -----------------------------
     필수 문항 미응답 체크
  ------------------------------*/
  const hasUnansweredRequired = () => {
    return requiredFields.some((field) => {
      if (field === "gender") {
        return !formData.gender;
      }
      return !formData[field];
    });
  };

  /* -----------------------------
     입력 변경 핸들러
  ------------------------------*/
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (type === "checkbox") {
      setFormData((prev) => ({
        ...prev,
        race: checked
          ? [...prev.race, value]
          : prev.race.filter((r) => r !== value),
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  /* -----------------------------
     실제 저장 로직 (Airtable)
  ------------------------------*/
  const submitData = async () => {
    if (!participantId) {
      setMessage("Participant ID missing. Please restart the study.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/airtable/demographic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          participant_id: participantId,
          age: formData.age,
          gender:
            formData.gender === "Not listed (please state)"
              ? formData.gender_other
              : formData.gender,
          education: formData.education,
          race: formData.race,
          hispanic: formData.hispanic,
        }),
      });

      if (!res.ok) throw new Error("Save failed");

      localStorage.removeItem("demographic_form");
      router.push("/thankyou");
    } catch (err) {
      console.error("❌ Error inserting demographic data:", err);
      setMessage("There was an error submitting your response. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  /* -----------------------------
     Submit 핸들러
  ------------------------------*/
  const handleSubmit = (e) => {
    e.preventDefault();

    if (hasUnansweredRequired()) {
      setShowWarningModal(true);
      return;
    }

    setLoading(true);
    setMessage("");
    submitData();
  };

  return (
    <div className="w-full h-screen flex flex-col bg-gray-50">
      <ProgressBar progress={100} />

      <div className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-2xl bg-white shadow-lg rounded-2xl p-10 overflow-y-auto max-h-[85vh]">
          <h1 className="text-2xl font-bold mb-6 text-center">
            Demographic Questions
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Age */}
            <div>
              <label className="block mb-2 font-medium">What is your age?</label>
              <input
                type="text"
                name="age"
                value={formData.age}
                onChange={handleChange}
                className="w-full border rounded-lg p-2"
                placeholder="Enter your age"
                required
              />
            </div>

            {/* Gender */}
            <div>
              <label className="block mb-2 font-medium">
                What is your gender identity?
              </label>
              {["Male", "Female", "Non-binary", "Not listed (please state)"].map(
                (option) => (
                  <div key={option} className="flex items-center mb-1">
                    <input
                      type="radio"
                      name="gender"
                      value={option}
                      checked={formData.gender === option}
                      onChange={handleChange}
                      className="mr-2"
                      required
                    />
                    <label>{option}</label>
                  </div>
                )
              )}
              {formData.gender === "Not listed (please state)" && (
                <input
                  type="text"
                  name="gender_other"
                  value={formData.gender_other}
                  onChange={handleChange}
                  placeholder="Please specify"
                  className="w-full border rounded-lg p-2 mt-2"
                />
              )}
            </div>

            {/* Education */}
            <div>
              <label className="block mb-2 font-medium">
                What is the highest level of school you completed, or the highest degree you received?
              </label>
              <select
                name="education"
                value={formData.education}
                onChange={handleChange}
                className="w-full border rounded-lg p-2"
                required
              >
                <option value="">Select one</option>
                <option>Never Attended School or Only Attended Kindergarten</option>
                <option>Elementary (Grades 1 through 8)</option>
                <option>Some High School (Grades 9 through 11)</option>
                <option>High School Diploma or Equivalent (Grade 12 or GED)</option>
                <option>Some College or Technical School (College 1 year to 3 years)</option>
                <option>Bachelor&apos;s Degree</option>
                <option>Master&apos;s Degree</option>
                <option>Professional School (JD, MD, etc.) or Doctorate Degree (PhD, EdD)</option>
              </select>
            </div>

            {/* Race */}
            <div>
              <label className="block mb-2 font-medium">
                Which of the following would you say best describes your race? (Check all that apply)
              </label>
              {[
                "White",
                "Black",
                "Asian",
                "American Indian or Alaska Native",
                "Native Hawaiian or Other Pacific Islander",
              ].map((race) => (
                <div key={race} className="flex items-center mb-1">
                  <input
                    type="checkbox"
                    value={race}
                    checked={formData.race.includes(race)}
                    onChange={handleChange}
                    className="mr-2"
                  />
                  <label>{race}</label>
                </div>
              ))}
            </div>

            {/* Hispanic */}
            <div>
              <label className="block mb-2 font-medium">
                Are you Hispanic or Latino/a/x?
              </label>
              {["Yes", "No"].map((option) => (
                <div key={option} className="flex items-center mb-1">
                  <input
                    type="radio"
                    name="hispanic"
                    value={option}
                    checked={formData.hispanic === option}
                    onChange={handleChange}
                    className="mr-2"
                    required
                  />
                  <label>{option}</label>
                </div>
              ))}
            </div>

            <div className="text-center pt-4">
              <button
                type="submit"
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
                disabled={loading}
              >
                {loading ? "Submitting..." : "Submit"}
              </button>
              {message && <p className="text-red-600 mt-3">{message}</p>}
            </div>
          </form>
        </div>
      </div>

      {/* Warning Modal */}
      {showWarningModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full text-center space-y-6">
            <p>
              There is an unanswered question on this page.
              <br />
              Would you like to continue?
            </p>

            <div className="flex gap-4">
              <button
                onClick={() => {
                  setShowWarningModal(false);
                  setLoading(true);
                  submitData();
                }}
                className="flex-1 border rounded-lg py-2"
              >
                Continue Without Answering
              </button>

              <button
                onClick={() => setShowWarningModal(false)}
                className="flex-1 bg-blue-600 text-white rounded-lg py-2"
              >
                Answer the Question
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
