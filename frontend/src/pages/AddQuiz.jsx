import { useState, useEffect } from "react";
import axios from "axios";
import codexLogo from "../assets/codex-logo.png";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

export default function AddQuiz() {

    useEffect(() => { document.title = "Admin | Create Quiz"; }, []);

    const [quizData, setQuizData] = useState({
        name: "",
        startTime: "",
        endTime: "",
        assignedGroups: [],
        questions: [{
            quesString: "", quesImage: "",
            optionA: { nameString: "" }, optionB: { nameString: "" },
            optionC: { nameString: "" }, optionD: { nameString: "" },
            correct: "", timer: 30,
        }],
    });

    const [availableGroups, setAvailableGroups] = useState([]);
    const [submitting, setSubmitting] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem("adminToken");
        axios.get(`${import.meta.env.VITE_BACKEND_URL}/admin/groups`, {
            headers: { Authorization: `Bearer ${token}` }
        }).then(res => setAvailableGroups(res.data.groups || [])).catch(() => {});
    }, []);

    const handleQuizChange = (e) => {
        const { name, value } = e.target;
        setQuizData(prev => ({ ...prev, [name]: value }));
    };

    const handleQuestionChange = (index, field, value) => {
        const updated = [...quizData.questions];
        updated[index][field] = value;
        setQuizData(prev => ({ ...prev, questions: updated }));
    };

    const handleOptionChange = (index, optionKey, value) => {
        const updated = [...quizData.questions];
        updated[index][optionKey].nameString = value;
        setQuizData(prev => ({ ...prev, questions: updated }));
    };

    const addQuestion = () => {
        setQuizData(prev => ({
            ...prev,
            questions: [...prev.questions, {
                quesString: "", quesImage: "",
                optionA: { nameString: "" }, optionB: { nameString: "" },
                optionC: { nameString: "" }, optionD: { nameString: "" },
                correct: "", timer: 30,
            }],
        }));
    };

    const removeQuestion = (index) => {
        setQuizData(prev => ({ ...prev, questions: prev.questions.filter((_, i) => i !== index) }));
    };

    const toggleGroup = (groupId) => {
        setQuizData(prev => ({
            ...prev,
            assignedGroups: prev.assignedGroups.includes(groupId)
                ? prev.assignedGroups.filter(id => id !== groupId)
                : [...prev.assignedGroups, groupId]
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const token = localStorage.getItem("adminToken");
            const payload = {
                ...quizData,
                startTime: quizData.startTime ? new Date(quizData.startTime + "+05:30") : null,
                endTime: quizData.endTime ? new Date(quizData.endTime + "+05:30") : null
            };
            await axios.post(
                `${import.meta.env.VITE_BACKEND_URL}/admin/createQuiz`,
                payload,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success("✅ Quiz Created Successfully!");
            navigate("/admin/dashboard");
        } catch (err) {
            toast.error(`❌ Error: ${err.response?.data?.message || err.message}`);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <>
            <div className="w-full flex justify-between items-center p-6 bg-white border-b border-gray-200">
                <img src={codexLogo} alt="CODEX Logo" className="h-6 md:h-10" />
                <p className="text-gray-800 text-xl md:text-2xl font-bold">Create Quiz</p>
            </div>

            <div className="min-h-screen bg-white text-black px-6 md:px-16 py-10">
                <form onSubmit={handleSubmit} className="space-y-10 max-w-4xl mx-auto">

                    {/* ── Basic Info ──────────────────────────────────────── */}
                    <div className="space-y-4">
                        <h2 className="text-xl font-semibold text-gray-900">Quiz Info</h2>
                        <div className="grid md:grid-cols-3 gap-4">
                            <div className="md:col-span-3">
                                <label className="block text-gray-700 font-medium mb-1">Quiz Name *</label>
                                <input type="text" name="name" value={quizData.name} onChange={handleQuizChange}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                            </div>
                            <div>
                                <label className="block text-gray-700 font-medium mb-1">Start Time *</label>
                                <input type="datetime-local" name="startTime" value={quizData.startTime} onChange={handleQuizChange}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2" required />
                            </div>
                            <div>
                                <label className="block text-gray-700 font-medium mb-1">End Time *</label>
                                <input type="datetime-local" name="endTime" value={quizData.endTime} onChange={handleQuizChange}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2" required />
                            </div>
                        </div>
                    </div>

                    {/* ── Assign Groups ───────────────────────────────────── */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-semibold text-gray-900">Assign Groups</h2>
                            <span className="text-sm text-gray-400">Optional — can be changed later</span>
                        </div>
                        {availableGroups.length === 0 ? (
                            <div className="border border-dashed border-gray-200 rounded-xl p-6 text-center">
                                <p className="text-gray-400 text-sm">No groups created yet.</p>
                                <a href="/admin/groups" className="text-blue-600 text-sm hover:underline">Create a group first →</a>
                            </div>
                        ) : (
                            <div className="flex flex-wrap gap-3">
                                {availableGroups.map(g => {
                                    const selected = quizData.assignedGroups.includes(g._id);
                                    return (
                                        <button type="button" key={g._id} onClick={() => toggleGroup(g._id)}
                                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition ${selected
                                                ? "border-blue-500 bg-blue-600 text-white shadow-md"
                                                : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"}`}>
                                            <span>{selected ? "✓" : "+"}</span>
                                            <span>{g.name}</span>
                                            <span className={`text-xs px-1.5 py-0.5 rounded-full ${selected ? "bg-blue-500" : "bg-gray-100 text-gray-500"}`}>
                                                {g.members?.length ?? 0}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                        {quizData.assignedGroups.length > 0 && (
                            <p className="text-sm text-blue-600">
                                ✓ {quizData.assignedGroups.length} group{quizData.assignedGroups.length !== 1 ? "s" : ""} selected —
                                all their members will be able to log in and take this quiz.
                            </p>
                        )}
                    </div>

                    {/* ── Questions ───────────────────────────────────────── */}
                    <div className="space-y-6">
                        <h2 className="text-xl font-semibold text-gray-900">Questions</h2>

                        {quizData.questions.map((q, index) => (
                            <div key={index} className="border border-gray-200 rounded-2xl p-6 bg-gray-50 relative">
                                <button type="button" onClick={() => removeQuestion(index)}
                                    className="absolute top-4 right-4 text-gray-300 hover:text-red-500 text-xl">✕</button>

                                <p className="font-medium text-gray-500 text-sm mb-3">Question {index + 1}</p>
                                <input type="text" value={q.quesString}
                                    onChange={e => handleQuestionChange(index, "quesString", e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-4"
                                    placeholder="Enter question text..." required />

                                <div className="grid sm:grid-cols-2 gap-3 mb-4">
                                    {["A", "B", "C", "D"].map(opt => (
                                        <input key={opt} type="text"
                                            value={q[`option${opt}`]?.nameString}
                                            onChange={e => handleOptionChange(index, `option${opt}`, e.target.value)}
                                            className="border border-gray-300 rounded-lg px-3 py-2"
                                            placeholder={`Option ${opt}`} required />
                                    ))}
                                </div>

                                <div className="flex flex-wrap gap-4">
                                    <div>
                                        <label className="block text-gray-600 text-sm mb-1">Correct Answer</label>
                                        <select value={q.correct}
                                            onChange={e => handleQuestionChange(index, "correct", e.target.value)}
                                            className="border border-gray-300 rounded-lg px-3 py-2" required>
                                            <option value="">Select</option>
                                            {["A", "B", "C", "D"].map(o => <option key={o} value={o}>{o}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-gray-600 text-sm mb-1">Timer</label>
                                        <select value={q.timer}
                                            onChange={e => handleQuestionChange(index, "timer", parseInt(e.target.value))}
                                            className="border border-gray-300 rounded-lg px-3 py-2" required>
                                            {[15, 30, 60, 90].map(t => <option key={t} value={t}>{t}s</option>)}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        ))}

                        <button type="button" onClick={addQuestion}
                            className="px-5 py-2 border border-gray-400 rounded-lg hover:bg-gray-900 hover:text-white transition text-sm">
                            + Add Question
                        </button>
                    </div>

                    <button 
                        type="submit" 
                        disabled={submitting}
                        className="w-full bg-black hover:bg-gray-800 text-white py-4 rounded-xl text-lg font-bold transition-all shadow-xl shadow-gray-200 flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {submitting ? (
                            <>
                                <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin" />
                                <span>Creating Quiz...</span>
                            </>
                        ) : (
                            <>
                                <span>🚀</span>
                                <span>Create Quiz</span>
                            </>
                        )}
                    </button>
                </form>
            </div>
        </>
    );
}
