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
  const [scenario, setScenario] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const id = localStorage.getItem("participant_id");
    if (!id) {
      window.location.href = "/check";
      return;
    }
    setParticipantId(id);

    const storedScenario = localStorage.getItem("scenario");
    if (storedScenario) setScenario(storedScenario);
  }, []);

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
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const res = await fetch("/api/airtable/demographic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          participant_id: participantId,
          scenario,
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

      if (!res.ok) throw new Error("Failed to save demographic data");

      router.push("/thankyou");
    } catch (err) {
      console.error(err);
      setMessage("There was an error submitting your response. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full h-screen flex flex-col bg-gray-50">
      <ProgressBar progress={95} />

      <div className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-2xl bg-white shadow-lg rounded-2xl p-10 overflow-y-auto max-h-[85vh]">
          <h1 className="text-2xl font-bold mb-6 text-center">
            Demographic Questions
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Age */}
            <input
              name="age"
              value={formData.age}
              onChange={handleChange}
              placeholder="Enter your age"
              className="w-full border rounded-lg p-2"
              required
            />

            {/* Gender */}
            {["Male", "Female", "Non-binary", "Not listed (please state)"].map(
              (opt) => (
                <label key={opt} className="block">
                  <input
                    type="radio"
                    name="gender"
                    value={opt}
                    checked={formData.gender === opt}
                    onChange={handleChange}
                    required
                  />{" "}
                  {opt}
                </label>
              )
            )}

            {formData.gender === "Not listed (please state)" && (
              <input
                name="gender_other"
                value={formData.gender_other}
                onChange={handleChange}
                placeholder="Please specify"
                className="w-full border rounded-lg p-2"
              />
            )}

            {/* Education */}
            <select
              name="education"
              value={formData.education}
              onChange={handleChange}
              className="w-full border rounded-lg p-2"
              required
            >
              <option value="">Select one</option>
              <option>Bachelor's Degree</option>
              <option>Master's Degree</option>
              <option>Doctorate Degree</option>
            </select>

            {/* Race */}
            {[
              "White",
              "Black",
              "Asian",
              "American Indian or Alaska Native",
              "Native Hawaiian or Other Pacific Islander",
            ].map((r) => (
              <label key={r} className="block">
                <input
                  type="checkbox"
                  value={r}
                  checked={formData.race.includes(r)}
                  onChange={handleChange}
                />{" "}
                {r}
              </label>
            ))}

            {/* Hispanic */}
            {["Yes", "No"].map((opt) => (
              <label key={opt} className="block">
                <input
                  type="radio"
                  name="hispanic"
                  value={opt}
                  checked={formData.hispanic === opt}
                  onChange={handleChange}
                  required
                />{" "}
                {opt}
              </label>
            ))}

            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg"
            >
              {loading ? "Submitting..." : "Submit"}
            </button>

            {message && <p className="text-red-600">{message}</p>}
          </form>
        </div>
      </div>
    </div>
  );
}
