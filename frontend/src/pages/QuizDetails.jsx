import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import codexLogo from "../assets/codex-logo.png";

export default function QuizDetails() {
    const { quizId } = useParams();
    const navigate = useNavigate();
    const [quiz, setQuiz] = useState(null);
    const [loading, setLoading] = useState(true);
    
    // States for Editing Quiz Info (Name, Time)
    const [isEditingInfo, setIsEditingInfo] = useState(false);
    const [infoData, setInfoData] = useState({ name: "", startTime: "", endTime: "" });

    // States for Editing Questions
    const [editingQuestion, setEditingQuestion] = useState(null);
    const [editData, setEditData] = useState({});
    const [isSavingQuestions, setIsSavingQuestions] = useState(false);
    
    // Group Assignment States
    const [allGroups, setAllGroups] = useState([]);
    const [savingGroups, setSavingGroups] = useState(false);
    const [selectedGroups, setSelectedGroups] = useState([]);

    useEffect(() => {
        document.title = "Admin | Quiz Details";
    }, []);

    const fetchData = async () => {
        const token = localStorage.getItem("adminToken");
        try {
            const [quizRes, groupsRes] = await Promise.all([
                axios.get(`${import.meta.env.VITE_BACKEND_URL}/admin/getQuiz/${quizId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                axios.get(`${import.meta.env.VITE_BACKEND_URL}/admin/groups`, {
                    headers: { Authorization: `Bearer ${token}` }
                })
            ]);
            
            const q = quizRes.data.quizObj;
            setQuiz(q);
            setInfoData({
                name: q.name,
                startTime: new Date(q.startTime).toISOString().slice(0, 16),
                endTime: new Date(q.endTime).toISOString().slice(0, 16)
            });
            setSelectedGroups((q.assignedGroups || []).map(g => g._id));
            setAllGroups(groupsRes.data.groups || []);
            setLoading(false);
        } catch (err) {
            console.error("Error fetching data:", err);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [quizId]);

    // ── QUIZ INFO UPDATES ──────────────────────────────────────────────────

    const handleSaveInfo = async () => {
        try {
            const token = localStorage.getItem("adminToken");
            const updatedPayload = {
                ...infoData,
                questions: quiz.questions.map(q => ({
                    quesString: q.quesString,
                    quesImage: q.quesImage,
                    optionA: q.optionA,
                    optionB: q.optionB,
                    optionC: q.optionC,
                    optionD: q.optionD,
                    correct: q.correct,
                    timer: q.timer
                }))
            };
            await axios.put(
                `${import.meta.env.VITE_BACKEND_URL}/admin/updateQuiz/${quizId}`,
                updatedPayload,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setQuiz({ ...quiz, ...infoData });
            setIsEditingInfo(false);
            toast.success("✅ Quiz information updated!");
        } catch (err) {
            toast.error("❌ Failed to update quiz info.");
        }
    };

    // ── QUESTION UPDATES ────────────────────────────────────────────────────

    const handleEditClick = (question, index) => {
        setEditingQuestion({ ...question, index });
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

    const saveQuestionsToBackend = async (updatedQuestions) => {
        setIsSavingQuestions(true);
        try {
            const token = localStorage.getItem("adminToken");
            const payload = {
                name: quiz.name,
                startTime: quiz.startTime,
                endTime: quiz.endTime,
                questions: updatedQuestions.map(q => ({
                    quesString: q.quesString,
                    quesImage: q.quesImage,
                    optionA: q.optionA,
                    optionB: q.optionB,
                    optionC: q.optionC,
                    optionD: q.optionD,
                    correct: q.correct,
                    timer: q.timer
                }))
            };
            await axios.put(
                `${import.meta.env.VITE_BACKEND_URL}/admin/updateQuiz/${quizId}`,
                payload,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            // Refresh to get new IDs for new questions
            await fetchData();
            return true;
        } catch (err) {
            toast.error("❌ Failed to save questions.");
            return false;
        } finally {
            setIsSavingQuestions(false);
        }
    };

    const handleSaveQuestionEdit = async () => {
        const updated = [...quiz.questions];
        updated[editingQuestion.index] = {
            ...updated[editingQuestion.index],
            quesString: editData.quesString,
            optionA: { nameString: editData.optionA },
            optionB: { nameString: editData.optionB },
            optionC: { nameString: editData.optionC },
            optionD: { nameString: editData.optionD },
            correct: editData.correct,
            timer: Number(editData.timer)
        };
        const success = await saveQuestionsToBackend(updated);
        if (success) setEditingQuestion(null);
    };

    const addQuestion = async () => {
        const newQ = {
            quesString: "New Question",
            optionA: { nameString: "Option A" },
            optionB: { nameString: "Option B" },
            optionC: { nameString: "Option C" },
            optionD: { nameString: "Option D" },
            correct: "A",
            timer: 30
        };
        const updated = [...quiz.questions, newQ];
        await saveQuestionsToBackend(updated);
    };

    const deleteQuestion = async (index) => {
        if (!window.confirm("Are you sure you want to delete this question?")) return;
        const updated = quiz.questions.filter((_, i) => i !== index);
        await saveQuestionsToBackend(updated);
    };

    // ── GROUP UPDATES ───────────────────────────────────────────────────────

    const toggleGroup = (groupId) => {
        setSelectedGroups(prev => 
            prev.includes(groupId) 
                ? prev.filter(id => id !== groupId) 
                : [...prev, groupId]
        );
    };

    const handleDeleteQuiz = async () => {
        const confirmed = window.confirm(
            "⚠️ DANGER: DELETE QUIZ?\n\nThis will permanently delete:\n- All Questions\n- All Participant Results\n- All Quiz Settings\n\nThis action CANNOT be undone. Are you absolutely sure?"
        );
        if (!confirmed) return;
        
        try {
            const token = localStorage.getItem("adminToken");
            await axios.delete(`${import.meta.env.VITE_BACKEND_URL}/admin/deleteQuiz/${quizId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success("Quiz deleted successfully.");
            navigate("/admin/dashboard");
        } catch (err) {
            toast.error("Failed to delete quiz.");
        }
    };

    const handleSaveGroups = async () => {
        if (selectedGroups.length === 0) {
            toast.error("Please select at least one group.");
            return;
        }
        setSavingGroups(true);
        try {
            const token = localStorage.getItem("adminToken");
            await axios.put(
                `${import.meta.env.VITE_BACKEND_URL}/admin/quiz/${quizId}/groups`,
                { groupIds: selectedGroups },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success("✅ Group assignments updated!");
            fetchData();
        } catch (err) {
            toast.error("❌ Failed to update groups.");
        } finally {
            setSavingGroups(false);
        }
    };

    if (loading) return (
        <div className="h-screen flex items-center justify-center text-gray-500 text-lg font-medium">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mr-3" />
            Loading quiz details...
        </div>
    );

    const leaderboard = [...quiz.participants].sort((a, b) => {
        if (b.points === a.points) return a.duration - b.duration;
        return b.points - a.points;
    });

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header */}
            <div className="w-full flex justify-between items-center p-6 bg-white border-b border-gray-200">
                <img src={codexLogo} alt="CODEX Logo" className="h-8 md:h-10" />
                <button onClick={() => navigate("/admin/dashboard")} className="text-sm text-gray-500 hover:text-gray-800">
                    ← Dashboard
                </button>
            </div>

            <div className="max-w-6xl mx-auto px-6 py-10 space-y-10">
                {/* Quiz Info Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-bold text-gray-900">{quiz.name}</h1>
                            <div className="flex gap-1">
                                <button 
                                    onClick={() => setIsEditingInfo(true)} 
                                    className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 hover:bg-blue-600 text-blue-600 hover:text-white border border-blue-200 rounded-lg transition-all duration-200 font-medium text-xs shadow-sm"
                                    title="Edit Quiz Info"
                                >
                                    <span>✏️</span>
                                    <span>Edit Info</span>
                                </button>
                                <button 
                                    onClick={handleDeleteQuiz} 
                                    className="flex items-center gap-2 px-3 py-1.5 bg-red-50 hover:bg-red-600 text-red-600 hover:text-white border border-red-200 rounded-lg transition-all duration-200 font-medium text-xs shadow-sm"
                                    title="Delete Quiz"
                                >
                                    <span>🗑️</span>
                                    <span>Delete Quiz</span>
                                </button>
                            </div>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                            {new Date(quiz.startTime).toLocaleString()} — {new Date(quiz.endTime).toLocaleString()}
                        </p>
                    </div>
                    <div className="flex items-center gap-6 text-sm">
                        <div className="text-center">
                            <p className="text-gray-400 uppercase text-[10px] font-bold tracking-wider">Questions</p>
                            <p className="text-lg font-bold text-gray-900">{quiz.questions.length}</p>
                        </div>
                        <div className="text-center border-l border-gray-200 pl-6">
                            <p className="text-gray-400 uppercase text-[10px] font-bold tracking-wider">Submissions</p>
                            <p className="text-lg font-bold text-gray-900">{quiz.participants.length}</p>
                        </div>
                    </div>
                </div>

                <div className="grid lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-10">
                        {/* Leaderboard */}
                        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                                <h2 className="text-lg font-bold text-gray-800">🏆 Leaderboard</h2>
                            </div>
                            <div className="overflow-x-auto max-h-[400px]">
                                <table className="min-w-full divide-y divide-gray-100 text-sm">
                                    <thead className="bg-gray-50 sticky top-0">
                                        <tr>
                                            <th className="px-4 py-3 text-left font-medium text-gray-500">Rank</th>
                                            <th className="px-4 py-3 text-left font-medium text-gray-500">Participant</th>
                                            <th className="px-4 py-3 text-left font-medium text-gray-500">Reg. No</th>
                                            <th className="px-4 py-3 text-center font-medium text-gray-500">Points</th>
                                            <th className="px-4 py-3 text-center font-medium text-gray-500">Time (s)</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {leaderboard.map((p, i) => (
                                            <tr key={i} className="hover:bg-gray-50">
                                                <td className="px-4 py-3 font-bold text-blue-600">#{i + 1}</td>
                                                <td className="px-4 py-3 font-medium text-gray-800">{p.name}</td>
                                                <td className="px-4 py-3 text-gray-600">{p.regdNo}</td>
                                                <td className="px-4 py-3 text-center font-bold text-gray-900">{p.points}</td>
                                                <td className="px-4 py-3 text-center text-gray-500">{Math.floor(p.duration / 1000)}</td>
                                            </tr>
                                        ))}
                                        {leaderboard.length === 0 && (
                                            <tr><td colSpan={5} className="py-10 text-center text-gray-400">No submissions yet.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Questions List */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-bold text-gray-800">Questions</h2>
                                <button 
                                    onClick={addQuestion}
                                    disabled={isSavingQuestions}
                                    className="px-4 py-1.5 bg-gray-900 text-white rounded-lg text-xs font-bold hover:bg-gray-800 transition disabled:opacity-50"
                                >
                                    {isSavingQuestions ? "Saving..." : "+ Add Question"}
                                </button>
                            </div>
                            
                            {quiz.questions.map((q, idx) => (
                                <div key={q._id || idx} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm group">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-3">
                                            <span className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center font-bold text-gray-500">{idx + 1}</span>
                                            <h3 className="font-bold text-gray-900 text-lg">{q.quesString}</h3>
                                        </div>
                                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition">
                                            <button onClick={() => handleEditClick(q, idx)} className="text-xs text-blue-600 font-bold px-2 py-1 hover:bg-blue-50 rounded">Edit</button>
                                            <button onClick={() => deleteQuestion(idx)} className="text-xs text-red-500 font-bold px-2 py-1 hover:bg-red-50 rounded">Delete</button>
                                        </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                                        {["A", "B", "C", "D"].map(opt => (
                                            <div key={opt} className={`px-4 py-2.5 rounded-xl border text-sm flex items-center gap-2 ${q.correct === opt ? "border-green-500 bg-green-50 text-green-700 font-medium" : "border-gray-100 bg-white text-gray-600"}`}>
                                                <span className="w-5 h-5 rounded-md bg-white border border-inherit flex items-center justify-center text-[10px] font-bold">{opt}</span>
                                                {q[`option${opt}`]?.nameString}
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex items-center gap-4 text-xs text-gray-400">
                                        <span>⏱ {q.timer}s limit</span>
                                        <span>✓ Correct Answer: <b>{q.correct}</b></span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-8">
                        {/* Group Assignment Card */}
                        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-bold text-gray-800">Assign Groups</h2>
                                <span className="text-xs text-gray-400">{selectedGroups.length} assigned</span>
                            </div>
                            
                            <div className="space-y-2 mb-6 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                {allGroups.map(group => (
                                    <button 
                                        key={group._id} 
                                        onClick={() => toggleGroup(group._id)}
                                        className={`w-full text-left p-3 rounded-xl border transition flex items-center justify-between ${
                                            selectedGroups.includes(group._id)
                                                ? "border-blue-500 bg-blue-50"
                                                : "border-gray-100 hover:border-gray-200 bg-white"
                                        }`}
                                    >
                                        <div>
                                            <p className={`text-sm font-bold ${selectedGroups.includes(group._id) ? "text-blue-700" : "text-gray-800"}`}>{group.name}</p>
                                            <p className="text-[10px] text-gray-400 uppercase tracking-tighter">{group.members?.length || 0} members</p>
                                        </div>
                                        {selectedGroups.includes(group._id) && (
                                            <span className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center text-white text-[10px]">✓</span>
                                        )}
                                    </button>
                                ))}
                                {allGroups.length === 0 && (
                                    <div className="text-center py-6 border border-dashed border-gray-100 rounded-xl">
                                        <p className="text-xs text-gray-400 mb-2">No groups found.</p>
                                        <button onClick={() => navigate("/admin/groups")} className="text-xs text-blue-600 font-bold hover:underline">
                                            + Create Group
                                        </button>
                                    </div>
                                )}
                            </div>

                            <button 
                                onClick={handleSaveGroups} 
                                disabled={savingGroups || selectedGroups.length === 0}
                                className="w-full py-3 bg-blue-700 hover:bg-blue-800 disabled:bg-gray-200 text-white rounded-xl font-bold transition shadow-lg shadow-blue-100 disabled:shadow-none"
                            >
                                {savingGroups ? "Saving..." : "Save Assignments"}
                            </button>
                        </div>
                        
                        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm text-center">
                             <button onClick={() => navigate(`/quiz/instructions/${quizId}`)} className="w-full py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 font-medium transition text-sm">
                                Preview as Student
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Edit Info Modal */}
            {isEditingInfo && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
                    <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl">
                        <h2 className="text-xl font-bold text-gray-900 mb-6">Edit Quiz Details</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Quiz Name</label>
                                <input type="text" value={infoData.name} onChange={e => setInfoData({...infoData, name: e.target.value})} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Start Time</label>
                                <input type="datetime-local" value={infoData.startTime} onChange={e => setInfoData({...infoData, startTime: e.target.value})} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">End Time</label>
                                <input type="datetime-local" value={infoData.endTime} onChange={e => setInfoData({...infoData, endTime: e.target.value})} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                            </div>
                        </div>
                        <div className="flex gap-3 mt-8">
                            <button onClick={() => setIsEditingInfo(false)} className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl font-bold text-gray-600 transition">Cancel</button>
                            <button onClick={handleSaveInfo} className="flex-1 py-3 bg-blue-700 hover:bg-blue-800 rounded-xl font-bold text-white transition">Save</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Question Modal */}
            {editingQuestion && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
                    <div className="bg-white rounded-3xl p-8 w-full max-w-xl shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-gray-900">Edit Question {editingQuestion.index + 1}</h2>
                            <button onClick={() => setEditingQuestion(null)} className="text-gray-400 hover:text-gray-600">✕</button>
                        </div>

                        <div className="space-y-5">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Question Text</label>
                                <textarea name="quesString" value={editData.quesString} onChange={handleEditChange} className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-gray-800 focus:ring-2 focus:ring-blue-500 focus:outline-none min-h-[100px]" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                {["A", "B", "C", "D"].map(opt => (
                                    <div key={opt}>
                                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 ml-1">Option {opt}</label>
                                        <input type="text" name={`option${opt}`} value={editData[`option${opt}`]} onChange={handleEditChange} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                                    </div>
                                ))}
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Correct</label>
                                    <select name="correct" value={editData.correct} onChange={handleEditChange} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white">
                                        {["A", "B", "C", "D"].map(o => <option key={o} value={o}>{o}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Timer (s)</label>
                                    <select name="timer" value={editData.timer} onChange={handleEditChange} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white">
                                        {[15, 30, 60, 90].map(t => <option key={t} value={t}>{t}s</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-8">
                            <button onClick={() => setEditingQuestion(null)} className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl font-bold text-gray-600 transition">Cancel</button>
                            <button onClick={handleSaveQuestionEdit} disabled={isSavingQuestions} className="flex-2 py-3 bg-blue-700 hover:bg-blue-800 rounded-xl font-bold text-white transition px-8">
                                {isSavingQuestions ? "Saving..." : "Save Changes"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}