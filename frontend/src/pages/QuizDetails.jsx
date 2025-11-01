import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import codexLogo from "../assets/codex-logo.png";

export default function QuizDetails() {
    const { quizId } = useParams();
    const [quiz, setQuiz] = useState(null);
    const [loading, setLoading] = useState(true);

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
                setQuiz(data.quizObj);
                setLoading(false);
            } catch (err) {
                console.error(err);
            }
        };
        fetchQuiz();
    }, [quizId]);

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
                                        <tr
                                            key={i}
                                            className="hover:bg-gray-50 transition"
                                        >
                                            <td className="py-3 px-4 font-medium text-gray-800">
                                                #{i + 1}
                                            </td>
                                            <td className="py-3 px-4">{p.name}</td>
                                            <td className="py-3 px-4 text-gray-600">
                                                {p.email}
                                            </td>
                                            <td className="py-3 px-4 text-center">{p.year}</td>
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

                {/* Questions Summary */}
                <div className="p-6">
                    <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                        Questions & Answers
                    </h2>

                    <div >
                        {quiz.questions.map((q, idx) => (
                            <div
                                key={q._id}
                                className="border mb-5 border-gray-200 rounded-2xl p-6 bg-gray-50 hover:shadow-lg transition"
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <h3 className="font-semibold text-gray-900 text-lg">
                                        Q{idx + 1}. {q.quesString}
                                    </h3>
                                    <span className="text-sm text-gray-500">
                                        ⏱ {q.timer || 0}s
                                    </span>
                                </div>

                                {/* If there’s an image */}
                                {q.quesImage && (
                                    <img
                                        src={q.quesImage}
                                        alt="Question"
                                        className="w-full max-h-60 object-contain rounded-lg mb-4"
                                    />
                                )}

                                {/* Options */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                                    {["A", "B", "C", "D"].map((opt, i) => {
                                        const optionKey = `option${opt}`;
                                        const optionValue = q[optionKey]?.nameString || q[optionKey];
                                        const isCorrect = q.correctAns === opt;

                                        return (
                                            <div
                                                key={i}
                                                className={`px-4 py-2 rounded-lg border ${isCorrect
                                                    ? "border-green-500 bg-green-50"
                                                    : "border-gray-200 bg-white"
                                                    }`}
                                            >
                                                <p className="text-gray-800">
                                                    <b>{opt}.</b> {optionValue || "—"}
                                                </p>
                                                {q[optionKey]?.image && (
                                                    <img
                                                        src={q[optionKey].image}
                                                        alt={`Option ${opt}`}
                                                        className="w-full max-h-40 object-contain rounded mt-2"
                                                    />
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Correct answer highlight */}
                                <div className="text-sm text-green-700 font-medium">
                                    ✅ Correct Answer: {q.correct}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </>
    );
}