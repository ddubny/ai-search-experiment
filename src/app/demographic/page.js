"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ProgressBar from "../../components/ProgressBar";
import { supabase } from "../../lib/supabaseClient";

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
  const [participantId, setParticipantId] = useState(null); // ✅ 추가
  const [scenario, setScenario] = useState(""); // ✅ 추가
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // ✅ localStorage에서 participant_id와 scenario 불러오기
  useEffect(() => {
    const id = localStorage.getItem("participant_id");
    if (!id) {
      window.location.href = "/check"; // ID가 없으면 초기 페이지로
      return;
    }
    setParticipantId(id);

    const storedScenario = localStorage.getItem("scenario");
    if (storedScenario) setScenario(storedScenario);
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === "checkbox") {
      setFormData((prev) => {
        const updated = checked
          ? [...prev.race, value]
          : prev.race.filter((r) => r !== value);
        return { ...prev, race: updated };
      });
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const { error } = await supabase.from("demographic").insert([
        {
          participant_id: participantId, // ✅ 추가
          scenario,                      // ✅ 추가
          age: formData.age,
          gender:
            formData.gender === "Not listed (please state)"
              ? formData.gender_other
              : formData.gender,
          education: formData.education,
          race: formData.race.join(", "),
          hispanic: formData.hispanic,
          created_at: new Date().toISOString(),
        },
      ]);

      if (error) throw error;

      setMessage("");
      router.push("/thankyou");
    } catch (err) {
      console.error("❌ Error inserting demographic data:", err);
      setMessage("There was an error submitting your response. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full h-screen flex flex-col bg-gray-50">
      {/* ✅ Progress Bar */}
      <div className="w-full">
        <ProgressBar progress={95} />
      </div>

      {/* ✅ Survey Form */}
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
                      id={option}
                      name="gender"
                      value={option}
                      checked={formData.gender === option}
                      onChange={handleChange}
                      className="mr-2"
                      required
                    />
                    <label htmlFor={option}>{option}</label>
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
                <option>Bachelor's Degree</option>
                <option>Master's Degree</option>
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
                    id={race}
                    name="race"
                    value={race}
                    checked={formData.race.includes(race)}
                    onChange={handleChange}
                    className="mr-2"
                  />
                  <label htmlFor={race}>{race}</label>
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
                    id={option}
                    name="hispanic"
                    value={option}
                    checked={formData.hispanic === option}
                    onChange={handleChange}
                    className="mr-2"
                    required
                  />
                  <label htmlFor={option}>{option}</label>
                </div>
              ))}
            </div>

            {/* Submit */}
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
    </div>
  );
}
