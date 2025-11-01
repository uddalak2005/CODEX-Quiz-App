import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import CircularProgress from "@mui/material/CircularProgress";
import codexLogo from "../assets/codex-logo.png";

export default function AdminDashboard() {
    const [quizzes, setQuizzes] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const token = localStorage.getItem("adminToken");

    useEffect(() => {
        document.title = "Admin | Dashboard";
    }, []);


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

    if (loading) {
        return (
            <div className="h-screen flex flex-col justify-center items-center bg-black text-white">
                <CircularProgress color="inherit" />
            </div>
        );
    }

    function handleOnClick() {
        navigate("/admin/addQuiz");
    }

    return (
        <>
            <div className="w-full flex justify-between items-center p-6">
                <img src={codexLogo} alt="CODEX Logo" className="h-6 md:h-12" />
                <p className="text-gray-800  text-right">
                    <button
                        className="text-xs md:text-lg p-3 md:p-4 md:px-10 rounded-full bg-blue-700 hover:bg-blue-800 text-white"
                        onClick={handleOnClick}>
                        Create Quiz +
                    </button>
                </p>
            </div>
            <div className="min-h-screen  text-black w-screen">

                {/* Empty State */}
                {quizzes.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-[60vh]">
                        <p className="text-gray-400 text-lg">No quizzes found.</p>
                        <p className="text-gray-600 text-sm mt-2">Create one to get started.</p>
                    </div>
                )}

                {/* Quiz Grid */}
                <div className="gap-6 w-screen flex flex-col justify-center items-center p-4">
                    {quizzes.map((quiz) => (
                        <div
                            key={quiz._id}
                            onClick={() => navigate(`/admin/quiz/${quiz._id}`)}
                            className="group border border-gray-800 rounded-2xl p-6  hover:bg-gray-200 transition-all duration-200 cursor-pointer w-full sm:w-[90%] lg:w-[1200px] xl:w-[1300px]"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <h2 className="text-xl font-semibold text-gray-900 group-hover:text-gray-700 transition">
                                    {quiz.name}
                                </h2>
                                <span className="text-xs text-gray-500">
                                    {new Date(quiz.createdOn).toLocaleDateString()}
                                </span>
                            </div>

                            {/* Details */}
                            <div className="space-y-2">
                                <p className="text-sm text-gray-600">
                                    <span className="font-medium text-gray-800">🎯 Target:</span> Year{" "}
                                    {quiz.target}
                                </p>

                            </div>
                        </div>

                    ))}
                </div>
            </div >
        </>
    );
}
