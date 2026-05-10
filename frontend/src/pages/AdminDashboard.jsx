import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import codexLogo from "../assets/codex-logo.png";

export default function AdminDashboard() {
    const [quizzes, setQuizzes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("quizzes");
    const navigate = useNavigate();
    const token = localStorage.getItem("adminToken");

    useEffect(() => { document.title = "Admin | Dashboard"; }, []);

    useEffect(() => {
        const fetchQuizzes = async () => {
            try {
                const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/admin/getAllData`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setQuizzes(res.data.allQuizzes || []);
            } catch (err) {
                console.error("Error loading quizzes:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchQuizzes();
    }, [token]);

    const totalParticipants = quizzes.reduce((sum, q) => sum + (q.allowedParticipants?.length ?? 0), 0);
    const totalSubmissions = quizzes.reduce((sum, q) => sum + (q.participants?.length ?? 0), 0);

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                <img src={codexLogo} alt="CODEX Logo" className="h-8 md:h-10" />
                <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-500">Admin Panel</span>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-6 py-8">
                {/* Stats row */}
                {!loading && (
                    <div className="grid grid-cols-3 gap-4 mb-8">
                        {[
                            { label: "Total Quizzes", value: quizzes.length, icon: "📋" },
                            { label: "Groups Assigned", value: quizzes.reduce((s, q) => s + (q.assignedGroups?.length ?? 0), 0), icon: "👥" },
                            { label: "Submissions", value: totalSubmissions, icon: "✅" },
                        ].map(stat => (
                            <div key={stat.label} className="bg-white border border-gray-200 rounded-2xl p-5 text-center">
                                <p className="text-2xl mb-1">{stat.icon}</p>
                                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                                <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
                            </div>
                        ))}
                    </div>
                )}

                {/* Nav Tabs */}
                <div className="flex gap-2 mb-6">
                    {[
                        { id: "quizzes", label: "📋 Quizzes" },
                        { id: "groups", label: "👥 Groups" },
                    ].map(tab => (
                        <button key={tab.id}
                            onClick={() => tab.id === "groups" ? navigate("/admin/groups") : setActiveTab("quizzes")}
                            className={`px-5 py-2 rounded-lg font-medium text-sm transition ${activeTab === tab.id && tab.id !== "groups"
                                ? "bg-gray-900 text-white"
                                : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-100"}`}>
                            {tab.label}
                        </button>
                    ))}
                    <button onClick={() => navigate("/admin/addQuiz")}
                        className="ml-auto px-5 py-2 bg-blue-700 text-white rounded-lg text-sm font-medium hover:bg-blue-800">
                        + Create Quiz
                    </button>
                </div>

                {/* Quiz list */}
                {loading ? (
                    <div className="flex justify-center items-center h-40">
                        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : quizzes.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-60 border-2 border-dashed border-gray-200 rounded-2xl">
                        <p className="text-gray-400 text-lg mb-2">No quizzes yet</p>
                        <button onClick={() => navigate("/admin/addQuiz")} className="text-blue-600 text-sm hover:underline">
                            Create your first quiz →
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {quizzes.map(quiz => {
                            const now = new Date();
                            const start = new Date(quiz.startTime);
                            const end = new Date(quiz.endTime);
                            const status = now < start ? "upcoming" : now > end ? "ended" : "live";
                            const statusStyle = { upcoming: "bg-blue-100 text-blue-700", live: "bg-green-100 text-green-700", ended: "bg-gray-100 text-gray-500" };

                            return (
                                <div key={quiz._id} onClick={() => navigate(`/admin/quiz/${quiz._id}`)}
                                    className="bg-white border border-gray-200 rounded-2xl p-5 hover:shadow-md hover:border-blue-200 transition cursor-pointer">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="flex items-center gap-3 mb-1">
                                                <h2 className="text-lg font-semibold text-gray-900">{quiz.name}</h2>
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusStyle[status]}`}>
                                                    {status}
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-400">
                                                {new Date(quiz.startTime).toLocaleString()} → {new Date(quiz.endTime).toLocaleString()}
                                            </p>
                                        </div>
                                        <span className="text-xs text-gray-400">{new Date(quiz.createdOn).toLocaleDateString()}</span>
                                    </div>
                                    <div className="flex gap-6 mt-3 text-sm text-gray-600">
                                        <span>📦 <b>{quiz.questions?.length ?? 0}</b> questions</span>
                                        <span>👥 <b>{quiz.assignedGroups?.length ?? 0}</b> group{quiz.assignedGroups?.length !== 1 ? "s" : ""}</span>
                                        <span>✅ <b>{quiz.participants?.length ?? 0}</b> submitted</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
