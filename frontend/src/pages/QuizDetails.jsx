import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import codexLogo from "../assets/codex-logo.png";

export default function QuizDetails() {
    const { quizId } = useParams();
    const [quiz, setQuiz] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editingQuestion, setEditingQuestion] = useState(null);
    const [editData, setEditData] = useState({});

    useEffect(() => {
        document.title = "Admin | Quiz Details";
    }, []);

    useEffect(() => {
        const fetchQuiz = async () => {
            try {
                const token = localStorage.getItem("adminToken");
                const { data } = await axios.get(
                    `${import.meta.env.VITE_BACKEND_URL}/admin/getQuiz/${quizId}`,
                    {
                        headers: { Authorization: `Bearer ${token}` },
                    }
                );
                console.log(data.quizObj);
                setQuiz(data.quizObj);
                setLoading(false);
            } catch (err) {
                console.error(err);
            }
        };
        fetchQuiz();
    }, [quizId]);

    const handleEditClick = (question) => {
        setEditingQuestion(question);
        setEditData({
            quesString: question.quesString,
            optionA: question.optionA?.nameString || "",
            optionB: question.optionB?.nameString || "",
            optionC: question.optionC?.nameString || "",
            optionD: question.optionD?.nameString || "",
            correct: question.correct,
            timer: question.timer,
        });
    };

    const handleEditChange = (e) => {
        setEditData({ ...editData, [e.target.name]: e.target.value });
    };

    const handleSaveChanges = async () => {
        try {
            const token = localStorage.getItem("adminToken");

            // ✅ Rebuild question objects with nested option objects
            const updatedQuestions = quiz.questions.map((q) => {
                if (q._id === editingQuestion._id) {
                    return {
                        quesString: editData.quesString?.trim() || "",
                        quesImage: q.quesImage || null,
                        optionA: { nameString: editData.optionA?.trim() || "" },
                        optionB: { nameString: editData.optionB?.trim() || "" },
                        optionC: { nameString: editData.optionC?.trim() || "" },
                        optionD: { nameString: editData.optionD?.trim() || "" },
                        correct: editData.correct || "A",
                        timer: Number(editData.timer) || 15,
                    };
                } else {
                    // ✅ Keep existing ones properly structured
                    return {
                        quesString: q.quesString?.trim() || "",
                        quesImage: q.quesImage || null,
                        optionA:
                            typeof q.optionA === "object"
                                ? q.optionA
                                : { nameString: q.optionA || "" },
                        optionB:
                            typeof q.optionB === "object"
                                ? q.optionB
                                : { nameString: q.optionB || "" },
                        optionC:
                            typeof q.optionC === "object"
                                ? q.optionC
                                : { nameString: q.optionC || "" },
                        optionD:
                            typeof q.optionD === "object"
                                ? q.optionD
                                : { nameString: q.optionD || "" },
                        correct: q.correct || "A",
                        timer: Number(q.timer) || 15,
                    };
                }
            });

            // ✅ Full quiz payload
            const updatedQuiz = {
                name: quiz.name,
                target: quiz.target,
                startTime: quiz.startTime,
                endTime: quiz.endTime,
                questions: updatedQuestions,
            };

            console.log("Sending to backend:", updatedQuiz);

            await axios.put(
                `${import.meta.env.VITE_BACKEND_URL}/admin/updateQuiz/${quizId}`,
                updatedQuiz,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            setQuiz({ ...quiz, questions: updatedQuestions });
            alert("✅ Quiz updated successfully!");
            setEditingQuestion(null);
        } catch (error) {
            console.error("❌ Error updating quiz:", error);
            if (error.response) {
                console.error("Backend status:", error.response.status);
                console.error("Backend data:", error.response.data);
            }
            alert("❌ Failed to update quiz");
        }
    };






    if (loading) {
        return (
            <div className="h-screen flex items-center justify-center text-gray-500 text-lg">
                Loading quiz details...
            </div>
        );
    }

    const participants = [...quiz.participants].sort((a, b) => {
        if (b.points === a.points) return a.duration - b.duration;
        return b.points - a.points;
    });

    return (
        <>
            <div className="w-full flex justify-between items-center p-6">
                <img src={codexLogo} alt="CODEX Logo" className="h-6 md:h-12" />
                <p className="text-gray-800 text-xl md:text-3xl font-bold text-right">
                    My Quizes
                </p>
            </div>

            <div className="min-h-screen bg-white text-black md:px-12 py-10 space-y-12">
                {/* Quiz Header */}
                <div className="px-6">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        {quiz.name}
                    </h1>
                    <p className="text-sm text-gray-600">
                        Created on{" "}
                        {new Date(quiz.createdOn).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                        })}{" "}
                        by <span className="font-medium">{quiz.user?.name}</span>
                    </p>
                </div>

                {/* Leaderboard */}
                <div className="p-6">
                    <h2 className="text-2xl font-semibold mb-6 text-gray-800">
                        Leaderboard
                    </h2>

                    <div className="overflow-x-auto border border-gray-200 rounded-xl shadow-sm">
                        <div className="max-h-[400px] overflow-y-auto">
                            <table className="min-w-full divide-y divide-gray-200 text-sm">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="py-3 px-4 text-left font-semibold text-gray-700">
                                            Rank
                                        </th>
                                        <th className="py-3 px-4 text-left font-semibold text-gray-700">
                                            Name
                                        </th>
                                        <th className="py-3 px-4 text-left font-semibold text-gray-700">
                                            Email
                                        </th>
                                        <th className="py-3 px-4 text-center font-semibold text-gray-700">
                                            Year
                                        </th>
                                        <th className="py-3 px-4 text-center font-semibold text-gray-700">
                                            Points
                                        </th>
                                        <th className="py-3 px-4 text-center font-semibold text-gray-700">
                                            Duration (s)
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {participants.map((p, i) => (
                                        <tr key={i} className="hover:bg-gray-50 transition">
                                            <td className="py-3 px-4 font-medium text-gray-800">
                                                #{i + 1}
                                            </td>
                                            <td className="py-3 px-4">
                                                {p.name || "Unknown"}
                                            </td>
                                            <td className="py-3 px-4 text-gray-600">
                                                {p.email || "—"}
                                            </td>
                                            <td className="py-3 px-4 text-center">
                                                {p.year || "—"}
                                            </td>
                                            <td className="py-3 px-4 text-center font-semibold text-gray-900">
                                                {p.points}
                                            </td>
                                            <td className="py-3 px-4 text-center text-gray-700">
                                                {Math.floor(p.duration / 1000)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Quiz Info Section */}
                <div className="p-6">
                    <div className="bg-gray-50 border border-gray-200 rounded-2xl shadow-sm p-6 hover:shadow-md transition">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">
                            🧾 Quiz Details
                        </h2>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8 text-gray-700">
                            <div className="flex items-center gap-2">
                                <span className="text-lg">🎯</span>
                                <span>
                                    <b>Target Year:</b> {quiz.target}
                                </span>
                            </div>

                            <div className="flex items-center gap-2">
                                <span className="text-lg">👥</span>
                                <span>
                                    <b>Participants:</b> {quiz.participants.length}
                                </span>
                            </div>

                            <div className="flex items-center gap-2">
                                <span className="text-lg">❓</span>
                                <span>
                                    <b>Total Questions:</b> {quiz.questions.length}
                                </span>
                            </div>

                            <div className="flex items-center gap-2">
                                <span className="text-lg">🕐</span>
                                <span>
                                    <b>Start Time:</b>{" "}
                                    {new Date(quiz.startTime).toLocaleTimeString([], {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                    })}
                                </span>
                            </div>

                            <div className="flex items-center gap-2">
                                <span className="text-lg">🏁</span>
                                <span>
                                    <b>End Time:</b>{" "}
                                    {new Date(quiz.endTime).toLocaleTimeString([], {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                    })}
                                </span>
                            </div>

                            <div className="flex items-center gap-2">
                                <span className="text-lg">📅</span>
                                <span>
                                    <b>Created On:</b>{" "}
                                    {new Date(quiz.createdOn).toLocaleDateString("en-IN", {
                                        day: "2-digit",
                                        month: "short",
                                        year: "numeric",
                                    })}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Questions Section */}
                <div className="p-6">
                    <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                        Questions & Answers
                    </h2>

                    <div>
                        {quiz.questions.map((q, idx) => (
                            <div
                                key={q._id}
                                className="border mb-5 border-gray-200 rounded-2xl p-6 bg-gray-50 hover:shadow-lg transition"
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <h3 className="font-semibold text-gray-900 text-lg">
                                        Q{idx + 1}. {q.quesString}
                                    </h3>
                                    <div className="flex items-center gap-3">
                                        <span className="text-sm text-gray-500">
                                            ⏱ {q.timer || 0}s
                                        </span>
                                        <button
                                            onClick={() => handleEditClick(q)}
                                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                        >
                                            ✏️ Edit
                                        </button>
                                    </div>
                                </div>

                                {q.quesImage && (
                                    <img
                                        src={q.quesImage}
                                        alt="Question"
                                        className="w-full max-h-60 object-contain rounded-lg mb-4"
                                    />
                                )}

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                                    {["A", "B", "C", "D"].map((opt) => {
                                        const optionKey = `option${opt}`;
                                        const optionValue =
                                            q[optionKey]?.nameString || "—";
                                        const isCorrect = q.correct === opt;
                                        return (
                                            <div
                                                key={opt}
                                                className={`px-4 py-2 rounded-lg border ${isCorrect
                                                    ? "border-green-500 bg-green-50"
                                                    : "border-gray-200 bg-white"
                                                    }`}
                                            >
                                                <p className="text-gray-800">
                                                    <b>{opt}.</b> {optionValue}
                                                </p>
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className="text-sm text-green-700 font-medium">
                                    ✅ Correct Answer: {q.correct}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Edit Modal */}
            {editingQuestion && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
                    <div className="bg-white rounded-2xl p-8 w-full max-w-lg shadow-lg">
                        <h2 className="text-xl font-semibold mb-4 text-gray-800">
                            ✏️ Edit Question
                        </h2>

                        <div className="space-y-4">
                            <input
                                type="text"
                                name="quesString"
                                value={editData.quesString}
                                onChange={handleEditChange}
                                className="w-full border rounded-lg px-3 py-2"
                                placeholder="Question Text"
                            />
                            {["A", "B", "C", "D"].map((opt) => (
                                <input
                                    key={opt}
                                    type="text"
                                    name={`option${opt}`}
                                    value={editData[`option${opt}`]}
                                    onChange={handleEditChange}
                                    className="w-full border rounded-lg px-3 py-2"
                                    placeholder={`Option ${opt}`}
                                />
                            ))}

                            <select
                                name="correct"
                                value={editData.correct}
                                onChange={handleEditChange}
                                className="w-full border rounded-lg px-3 py-2"
                            >
                                <option value="">Select Correct Answer</option>
                                {["A", "B", "C", "D"].map((opt) => (
                                    <option key={opt} value={opt}>
                                        {opt}
                                    </option>
                                ))}
                            </select>

                            <input
                                type="number"
                                name="timer"
                                value={editData.timer}
                                onChange={handleEditChange}
                                className="w-full border rounded-lg px-3 py-2"
                                placeholder="Timer (seconds)"
                            />
                        </div>

                        <div className="flex justify-end mt-6 gap-3">
                            <button
                                onClick={() => setEditingQuestion(null)}
                                className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveChanges}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}