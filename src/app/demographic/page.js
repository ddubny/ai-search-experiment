"use client";

import { useState, useEffect, useRef } from "react";
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

  // 저장 실패시에만 보여줄 메시지
  const [message, setMessage] = useState("");

  // Warning modal
  const [showWarningModal, setShowWarningModal] = useState(false);

  // 미응답 하이라이트
  const [highlightFields, setHighlightFields] = useState([]);
  const fieldRefs = useRef({});

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
      try {
        setFormData(JSON.parse(saved));
      } catch {
        // ignore parse errors
      }
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
  const getUnansweredRequiredFields = () => {
    return requiredFields.filter((field) => {
      const v = formData[field];
      if (field === "age") return !String(v).trim();
      if (field === "gender") return !String(v).trim();
      if (field === "education") return !String(v).trim();
      if (field === "hispanic") return !String(v).trim();
      return !v;
    });
  };

  const hasUnansweredRequired = () => getUnansweredRequiredFields().length > 0;

  /* -----------------------------
     입력 변경
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

    // 사용자가 수정하기 시작하면 해당 필드 하이라이트 해제
    setHighlightFields((prev) => prev.filter((f) => f !== name));
  };

  /* -----------------------------
     Airtable로 보낼 fields 구성 (핵심)
     - 빈 값( "", [] )은 "보내지 않음(omit)" => 부분 저장 가능
     - age는 숫자 변환 가능할 때만 보냄
     - gender_other는 Not listed일 때만 보냄(원하면 컬럼 있을 때)
  ------------------------------*/
  const buildAirtablePayloadFields = () => {
    const fields = {
      participant_id: participantId,
      // race는 선택한 것이 있을 때만 보냄
      ...(Array.isArray(formData.race) && formData.race.length > 0
        ? { race: formData.race }
        : {}),
    };

    const ageStr = String(formData.age ?? "").trim();
    if (ageStr) {
      const ageNum = Number(ageStr);
      if (!Number.isNaN(ageNum)) fields.age = ageNum;
      // 숫자가 아니면 아예 생략(부분 저장 우선)
    }

    const genderStr = String(formData.gender ?? "").trim();
    if (genderStr) {
      // Not listed면 gender_other를 저장하고, 아니면 그대로 저장
      if (genderStr === "Not listed (please state)") {
        const other = String(formData.gender_other ?? "").trim();
        // Airtable gender를 Single select로 쓰는 경우:
        // 선택 값 자체를 저장하려면 아래를 유지.
        fields.gender = genderStr;

        // gender_other 컬럼이 Airtable에 있다면 저장:
        if (other) fields.gender_other = other;
      } else {
        fields.gender = genderStr;
      }
    }

    const eduStr = String(formData.education ?? "").trim();
    if (eduStr) fields.education = eduStr;

    const hispStr = String(formData.hispanic ?? "").trim();
    if (hispStr) fields.hispanic = hispStr;

    return fields;
  };

  /* -----------------------------
     실제 저장 (Continue 포함)
  ------------------------------*/
  const submitData = async () => {
    if (!participantId) {
      // participantId 없으면 진짜 문제이므로 메시지 표시
      setMessage("Participant ID missing. Please restart the study.");
      setLoading(false);
      return;
    }

    try {
      const fields = buildAirtablePayloadFields();

      const res = await fetch("/api/airtable/demographic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || "Save failed");
      }

      // 성공하면 로컬 저장값 제거 후 다음으로
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
     Submit 버튼 클릭
     - 미응답 있으면 modal
     - 응답 완료면 바로 저장
  ------------------------------*/
  const handleSubmit = (e) => {
    e.preventDefault();

    // 저장 에러 메시지는 "저장 시도"에만 의미가 있으므로 여기서 초기화
    setMessage("");

    if (hasUnansweredRequired()) {
      setShowWarningModal(true);
      return;
    }

    setLoading(true);
    submitData();
  };

  /* -----------------------------
     Answer the Question: 미응답 표시 + 스크롤
  ------------------------------*/
  const handleAnswerTheQuestion = () => {
    // 에러가 아니라 안내 동작이므로 메시지 숨김
    setMessage("");

    const unanswered = getUnansweredRequiredFields();
    setHighlightFields(unanswered);

    const first = unanswered[0];
    if (first && fieldRefs.current[first]) {
      fieldRefs.current[first].scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }

    setShowWarningModal(false);

    // 2초 후 하이라이트 자동 해제 (원치 않으면 제거 가능)
    setTimeout(() => setHighlightFields([]), 2000);
  };

  /* -----------------------------
     Continue Without Answering: 부분 저장 + 다음으로
  ------------------------------*/
  const handleContinueWithoutAnswering = () => {
    // 에러 메시지 숨김 (이건 정상 플로우)
    setMessage("");

    setShowWarningModal(false);
    setLoading(true);
    submitData(); // ✅ 빈 값은 omit 처리되므로 Airtable 저장 성공 가능
  };

  const isHighlighted = (fieldName) => highlightFields.includes(fieldName);

  return (
    <div className="w-full h-screen flex flex-col bg-gray-50">
      <div className="w-full">
        <ProgressBar progress={100} />
      </div>

      <div className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-2xl bg-white shadow-lg rounded-2xl p-10 overflow-y-auto max-h-[85vh]">
          <h1 className="text-2xl font-bold mb-6 text-center">
            Demographic Questions
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Age */}
            <div
              ref={(el) => (fieldRefs.current.age = el)}
              className={isHighlighted("age") ? "p-3 rounded-lg border-2 border-red-500" : ""}
            >
              <label className="block mb-2 font-medium">What is your age?</label>
              <input
                type="text"
                name="age"
                value={formData.age}
                onChange={handleChange}
                className="w-full border rounded-lg p-2"
                placeholder="Enter your age"
                // required 제거 (브라우저 팝업 차단)
              />
            </div>

            {/* Gender */}
            <div
              ref={(el) => (fieldRefs.current.gender = el)}
              className={isHighlighted("gender") ? "p-3 rounded-lg border-2 border-red-500" : ""}
            >
              <label className="block mb-2 font-medium">
                What is your gender identity?
              </label>

              {["Male", "Female", "Non-binary", "Not listed (please state)"].map((option) => (
                <div key={option} className="flex items-center mb-1">
                  <input
                    type="radio"
                    id={option}
                    name="gender"
                    value={option}
                    checked={formData.gender === option}
                    onChange={handleChange}
                    className="mr-2"
                    // required 제거
                  />
                  <label htmlFor={option}>{option}</label>
                </div>
              ))}

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
            <div
              ref={(el) => (fieldRefs.current.education = el)}
              className={
                isHighlighted("education") ? "p-3 rounded-lg border-2 border-red-500" : ""
              }
            >
              <label className="block mb-2 font-medium">
                What is the highest level of school you completed, or the highest degree you received?
              </label>
              <select
                name="education"
                value={formData.education}
                onChange={handleChange}
                className="w-full border rounded-lg p-2"
                // required 제거
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

            {/* Race (optional) */}
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
            <div
              ref={(el) => (fieldRefs.current.hispanic = el)}
              className={
                isHighlighted("hispanic") ? "p-3 rounded-lg border-2 border-red-500" : ""
              }
            >
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
                    // required 제거
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

              {/* 저장 실패시에만 보여줌 */}
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
                onClick={handleContinueWithoutAnswering}
                className="flex-1 border rounded-lg py-2"
                disabled={loading}
              >
                Continue Without Answering
              </button>

              <button
                onClick={handleAnswerTheQuestion}
                className="flex-1 bg-blue-600 text-white rounded-lg py-2"
                disabled={loading}
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
