import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import axios from "axios";
import CircularIndeterminate from "../components/Loader.jsx";
import QuestionCard from "../components/QuestionCard.jsx";
import codexLogo from '../assets/codex-logo.png';
import { useAuth } from "../context/AuthContext.jsx";

function QuizPage() {


    useEffect(() => {
        document.title = "Quiz";
    }, []);



    const { year } = useParams();
    const decodedYear = atob(year);
    const token = localStorage.getItem("token");
    const userName = localStorage.getItem("userName");

    const [quiz, setQuiz] = useState(() => {
        const savedQuiz = localStorage.getItem("quizData");
        return savedQuiz ? JSON.parse(savedQuiz) : null;
    });

    const { logout } = useAuth();

    const [currentQues, setCurrentQues] = useState(() => {
        const savedCurrentQues = localStorage.getItem("quizCurrentQues");
        return savedCurrentQues ? parseInt(savedCurrentQues) : 0;
    });

    const [answer, setAnswer] = useState(() => {
        const savedAnswers = localStorage.getItem("quizAnswers");
        return savedAnswers ? JSON.parse(savedAnswers) : { questions: [] };
    });

    const [loading, setLoading] = useState(!quiz);
    const [quizEnd, setQuizEnd] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (quiz && answer.questions?.length > 0) {
            console.log("Restored previous answers:", answer);
        }
    }, [quiz]);



    // To Fetch Quiz
    useEffect(() => {
        if (quiz) return;

        const fetchQuiz = async () => {
            try {
                setLoading(true);
                const response = await axios.get(
                    `${import.meta.env.VITE_BACKEND_URL}/quiz/getQuiz/${decodedYear}`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                        withCredentials: true,

                    }
                );
                setQuiz(response.data.quiz);
                console.log(response.data.quiz)
                setError(null);
                localStorage.setItem("quizData", JSON.stringify(response.data.quiz));
            } catch (err) {
                console.error("Error fetching quiz:", err);
                setError(err.response?.data?.message || "Failed to load quiz.");
            } finally {
                setLoading(false);
            }
        };

        fetchQuiz();
    }, [decodedYear, token]);


    // To Submit the quiz
    useEffect(() => {
        if (quizEnd && quiz) {
            const submitQuiz = async () => {

                console.log(answer);

                try {
                    const response = await axios.post(
                        `${import.meta.env.VITE_BACKEND_URL}/quiz/submitQuiz/${quiz._id}`,
                        answer,
                        {
                            headers: { Authorization: `Bearer ${token}` },
                        }
                    );
                    console.log("Quiz submitted:", response.data);
                    logout();
                } catch (err) {
                    console.error("Error submitting quiz:", err);
                }
            };

            submitQuiz();
        }
    }, [quizEnd]);

    // To Prevent minimize and Tab Switch
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.hidden && !quizEnd) {
                console.log("User switched tab or minimized — auto submitting...");
                handleSubmit();
            }
        };

        const handleBlur = () => {
            if (!quizEnd) {
                console.log("User switched app/window — auto submitting...");
                handleSubmit();
            }
        };

        // Add event listeners
        document.addEventListener("visibilitychange", handleVisibilityChange);
        window.addEventListener("blur", handleBlur);


        return () => {
            document.removeEventListener("visibilitychange", handleVisibilityChange);
            window.removeEventListener("blur", handleBlur);
        };
    }, [quizEnd, quiz, answer]);



    useEffect(() => {
        if (!quiz || quizEnd) return;

        if (currentQues >= quiz.questions.length) {
            console.log("All questions answered — auto submitting quiz...");
            handleSubmit();
        }
    }, [currentQues, quiz, quizEnd]);


    function handleNext() {
        setCurrentQues((prev) => {
            return prev + 1
        });
    }

    useEffect(() => {
        if (!quiz) return; // ensure quiz loaded
        if (answer.questions?.length === 0) return; // skip initial empty state
        localStorage.setItem("quizAnswers", JSON.stringify(answer));
    }, [answer, quiz]);

    useEffect(() => {
        localStorage.setItem("quizCurrentQues", currentQues);
    }, [currentQues]);



    function handleSubmit() {
        console.log("User answers:", answer);
        setQuizEnd(true);
    }


    if (error) {
        return (
            <>
                <div className="w-full flex justify-between items-center p-6">
                    <img src={codexLogo} alt="CODEX Logo" className="h-6 md:h-12" />
                </div>
                <div className="w-full flex justify-center items-center mt-50">
                    <p className="text-3xl font-bold text-gray-800 text-center">{error}</p>
                </div>
            </>

        );
    }


    if (loading || !quiz) {
        return (
            <div className="h-screen w-screen flex justify-center items-center">
                <CircularIndeterminate />
            </div>
        );
    }


    if (quizEnd) {
        return (
            <>
                <div className="w-full flex justify-between items-center p-6">
                    <img src={codexLogo} alt="CODEX Logo" className="h-6 md:h-12" />
                    <p className="text-gray-500 text-xl md:text-3xl font-bold text-right">
                        {quiz.name}
                    </p>
                </div>

                <div className="w-full flex flex-col justify-center items-center mt-20">
                    <p className="text-3xl font-bold text-green-600">Quiz Completed 🎉</p>
                    <p className="text-xl mt-4 text-gray-700">{userName}</p>
                </div>
            </>
        );
    }


    return (
        <>
            <div className="w-full flex justify-between items-center p-6">
                <img src={codexLogo} alt="CODEX Logo" className="h-7 md:h-15" />
                <p className="text-gray-500 text-xl md:text-3xl font-bold text-right">
                    {quiz.name}
                </p>
            </div>

            {currentQues < quiz.questions.length ? (
                <div className="w-screen h-full flex justify-center items-center p-10 md:p-10">
                    <QuestionCard
                        question={quiz.questions[currentQues]}
                        onNext={handleNext}
                        setAnswer={setAnswer}
                    />
                </div>
            ) : (
                <div className="w-full flex flex-col justify-center items-center mt-20">
                    <p className="text-xl text-gray-600">Submitting your quiz...</p>
                    <CircularIndeterminate />
                </div>
            )}

        </>
    );
}

export default QuizPage;
