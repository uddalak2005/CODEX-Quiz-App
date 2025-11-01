import { useState, useEffect } from "react";
import axios from "axios";
import codexLogo from "../assets/codex-logo.png"
import { useNavigate } from "react-router-dom";

export default function AddQuiz() {

    useEffect(() => {
        document.title = "Admin | Create Quiz";
    }, []);



    const [quizData, setQuizData] = useState({
        name: "",
        target: "",
        startTime: "",
        endTime: "",
        questions: [
            {
                quesString: "",
                quesImage: "",
                optionA: { nameString: "" },
                optionB: { nameString: "" },
                optionC: { nameString: "" },
                optionD: { nameString: "" },
                correct: "",
                timer: 30,
            },
        ],
    });

    const navigate = useNavigate();

    const handleQuizChange = (e) => {
        const { name, value } = e.target;
        setQuizData((prev) => ({ ...prev, [name]: value }));
    };

    const handleQuestionChange = (index, field, value) => {
        const updated = [...quizData.questions];
        updated[index][field] = value;
        setQuizData((prev) => ({ ...prev, questions: updated }));
    };

    const handleOptionChange = (index, optionKey, value) => {
        const updated = [...quizData.questions];
        updated[index][optionKey].nameString = value;
        setQuizData((prev) => ({ ...prev, questions: updated }));
    };

    const addQuestion = () => {
        setQuizData((prev) => ({
            ...prev,
            questions: [
                ...prev.questions,
                {
                    quesString: "",
                    quesImage: "",
                    optionA: { nameString: "" },
                    optionB: { nameString: "" },
                    optionC: { nameString: "" },
                    optionD: { nameString: "" },
                    correct: "",
                    timer: 30,
                },
            ],
        }));
    };

    const removeQuestion = (index) => {
        setQuizData((prev) => ({
            ...prev,
            questions: prev.questions.filter((_, i) => i !== index),
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem("adminToken");
            const res = await axios.post(
                `${import.meta.env.VITE_BACKEND_URL}/admin/createQuiz`,
                quizData,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            alert("✅ Quiz Created Successfully!");
            navigate("/admin/dashboard");
            console.log(res.data);
        } catch (err) {
            console.error(err);
            alert("❌ Error creating quiz!");
        }
    };

    return (
        <>
            <div className="w-full flex justify-between items-center p-6">
                <img src={codexLogo} alt="CODEX Logo" className="h-6 md:h-12" />
                <p className="text-gray-800 text-xl md:text-3xl font-bold text-right">
                    Create Quiz
                </p>
            </div>

            <div className="min-h-screen bg-white text-black px-6 md:px-16 py-10">
                <h1 className="text-3xl font-bold mb-6 text-gray-900">Create New Quiz</h1>

                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Quiz Info */}
                    <div className="grid md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-gray-700 font-medium mb-1">Quiz Name</label>
                            <input
                                type="text"
                                name="name"
                                value={quizData.name}
                                onChange={handleQuizChange}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring focus:ring-gray-300"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-gray-700 font-medium mb-1">Target Year</label>
                            <select
                                name="target"
                                value={quizData.target}
                                onChange={handleQuizChange}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:ring focus:ring-gray-300"
                                required
                            >
                                <option value="" disabled hidden>
                                    Select Year
                                </option>
                                <option value="1">1st Year</option>
                                <option value="2">2nd Year</option>
                            </select>
                        </div>



                        <div>
                            <label className="block text-gray-700 font-medium mb-1">Start Time</label>
                            <input
                                type="datetime-local"
                                name="startTime"
                                value={quizData.startTime}
                                onChange={handleQuizChange}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-gray-700 font-medium mb-1">End Time</label>
                            <input
                                type="datetime-local"
                                name="endTime"
                                value={quizData.endTime}
                                onChange={handleQuizChange}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                required
                            />
                        </div>
                    </div>

                    {/* Questions Section */}
                    <div className="space-y-10">
                        <h2 className="text-2xl font-semibold text-gray-900">Questions</h2>

                        {quizData.questions.map((q, index) => (
                            <div
                                key={index}
                                className="border border-gray-200 rounded-2xl p-6 bg-gray-50 relative"
                            >
                                <button
                                    type="button"
                                    onClick={() => removeQuestion(index)}
                                    className="absolute top-4 right-4 text-gray-400 hover:text-red-500"
                                >
                                    ✖
                                </button>

                                <label className="block font-medium text-gray-700 mb-2">
                                    Question {index + 1}
                                </label>
                                <input
                                    type="text"
                                    value={q.quesString}
                                    onChange={(e) =>
                                        handleQuestionChange(index, "quesString", e.target.value)
                                    }
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-4"
                                    placeholder="Enter question text..."
                                    required
                                />

                                {/* Options */}
                                <div className="grid sm:grid-cols-2 gap-3 mb-4">
                                    {["A", "B", "C", "D"].map((opt) => (
                                        <input
                                            key={opt}
                                            type="text"
                                            value={q[`option${opt}`]?.nameString}
                                            onChange={(e) =>
                                                handleOptionChange(
                                                    index,
                                                    `option${opt}`,
                                                    e.target.value
                                                )
                                            }
                                            className="border border-gray-300 rounded-lg px-3 py-2"
                                            placeholder={`Option ${opt}`}
                                            required
                                        />
                                    ))}
                                </div>

                                <div className="flex flex-wrap items-center gap-4">
                                    <div>
                                        <label className="block text-gray-700 font-medium mb-1">
                                            Correct Option
                                        </label>
                                        <select
                                            value={q.correct}
                                            onChange={(e) =>
                                                handleQuestionChange(index, "correct", e.target.value)
                                            }
                                            className="border border-gray-300 rounded-lg px-3 py-2"
                                            required
                                        >
                                            <option value="">Select</option>
                                            {["A", "B", "C", "D"].map((opt) => (
                                                <option key={opt} value={opt}>
                                                    {opt}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-gray-700 font-medium mb-1">
                                            Timer (seconds)
                                        </label>
                                        <input
                                            type="number"
                                            value={q.timer}
                                            onChange={(e) =>
                                                handleQuestionChange(index, "timer", e.target.value)
                                            }
                                            className="border border-gray-300 rounded-lg px-3 py-2 w-24"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}

                        <button
                            type="button"
                            onClick={addQuestion}
                            className="px-6 py-2 border border-gray-700 rounded-lg hover:bg-gray-900 hover:text-white transition"
                        >
                            + Add Another Question
                        </button>
                    </div>

                    {/* Submit */}
                    <button
                        type="submit"
                        className="w-full bg-black text-white py-3 rounded-lg text-lg font-medium hover:bg-gray-800 transition"
                    >
                        🚀 Create Quiz
                    </button>
                </form>
            </div>
        </>
    );
}
