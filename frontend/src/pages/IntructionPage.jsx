import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { AlertCircle, Clock, HelpCircle } from "lucide-react";
import axios from "axios";
import codexLogo from "../assets/codex-logo.png";
import CircularIndeterminate from "../components/Loader.jsx";
import { getBackend } from "../api/loadBalancer";

const InstructionPage = () => {
    const navigate = useNavigate();
    const { quizId } = useParams();
    const token = localStorage.getItem("token");
    const [quiz, setQuiz] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        document.title = "Instructions";
    }, []);

    useEffect(() => {
        const fetchQuizInfo = async () => {
            try {
                const response = await axios.get(
                    `${getBackend()}/quiz/getQuizInfo/${quizId}`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                setQuiz(response.data.quiz);
            } catch (err) {
                setError(err.response?.data?.message || "Failed to load quiz information.");
            }
        };

        fetchQuizInfo();
    }, [quizId, token]);

    const handleStart = () => {
        navigate(`/quiz/${quizId}`);
    };

    if (error) {
        return <div className="min-h-screen flex items-center justify-center p-6 text-xl font-semibold text-gray-800">{error}</div>;
    }

    if (!quiz) {
        return <div className="min-h-screen flex items-center justify-center"><CircularIndeterminate /></div>;
    }

    const durationMinutes = Math.max(
        1,
        Math.round((new Date(quiz.endTime) - new Date(quiz.startTime)) / 60000)
    );

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center p-6">
            <div className="w-full flex justify-between items-center mb-8">
                <img src={codexLogo} alt="CODEX Logo" className="h-8 md:h-12" />
                <p className="text-xl md:text-2xl font-bold text-gray-600">Quiz Instructions</p>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="max-w-3xl w-full bg-white rounded-2xl shadow-xl p-6 md:p-8 mt-20"
            >
                <h1 className="text-3xl font-bold text-center text-gray-800 mb-6">{quiz.name}</h1>

                <div className="flex justify-center gap-6 text-gray-700 mb-6">
                    <div className="flex items-center gap-2">
                        <Clock className="w-5 h-5 text-blue-500" />
                        <span>{durationMinutes} minutes</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <HelpCircle className="w-5 h-5 text-green-500" />
                        <span>{quiz.questionCount} questions</span>
                    </div>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-6">
                    <h2 className="font-semibold text-lg text-gray-800 mb-3 flex items-center gap-2">
                        <AlertCircle className="text-yellow-500 w-5 h-5" />
                        Please read the following instructions carefully:
                    </h2>
                    <ul className="list-disc list-inside text-gray-700 space-y-2">
                        <li>Once you start, you cannot pause or revisit previous questions.</li>
                        <li>Each question is timed - answer carefully before moving on.</li>
                        <li>Do not switch tabs or minimize the window - quiz may auto-submit.</li>
                        <li>You can refresh, but closing the tab will end your quiz.</li>
                        <li>Your progress is auto-saved after each answer.</li>
                        <li>Ensure a stable internet connection before starting.</li>
                    </ul>
                </div>

                <div className="flex justify-center mt-6">
                    <button
                        onClick={handleStart}
                        className="px-8 py-3 bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition font-semibold"
                    >
                        Start Quiz
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

export default InstructionPage;
