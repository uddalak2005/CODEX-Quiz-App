import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import axios from "axios";
import CircularIndeterminate from "../components/Loader.jsx";
import QuestionCard from "../components/QuestionCard.jsx";
import codexLogo from '../assets/codex-logo.png';

function QuizPage() {

    const [quiz, setQuiz] = useState(null);
    const [currentQues, setCurrentQues] = useState(0);
    const [loading, setLoading] = useState(true);
    const [quizEnd, setQuizEnd] = useState(false);
    const [answer, setAnswer] = useState({
        questions: []
    })

    const { year } = useParams();
    const decodedYear = atob(year);
    const token = localStorage.getItem("token");

    useEffect(() => {
        const fetchQuiz = async () => {

            try {
                const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/quiz/getQuiz/${decodedYear}`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }
                )

                const data = response.data;
                console.log(data.quiz);
                setQuiz(data.quiz);
                setLoading(false);

            } catch (error) {
                if (error.response) {
                    console.log(error.response.message);
                } else {
                    console.log("Error occured while Fetching Quiz", error.message);
                }
            } finally {
                setLoading(false)
            }

        }

        fetchQuiz();
    }, [year, token]);

    function handleNext() {
        setCurrentQues((prev) => prev + 1)
    }

    function handleSubmit() {
        console.log(answer);
        setQuizEnd(true)
    }

    if (quizEnd) {
        return (
            <>
                <div className="w-full flex justify-between items-center p-6">
                    <img src={codexLogo} alt="" className="h-7 w-30 md:h-15 md:w-60" />
                    <p className="text-gray-500 text-xl md:text-3xl font-bold text-right">{quiz.name}</p>
                </div>
                <h1>Quiz Completed</h1>
            </>
        )
    }


    if (!quiz || !quiz.questions || quiz.questions.length === 0) {
        return (
            <div className="h-screen w-screen flex justify-center items-center">
                <CircularIndeterminate />
            </div>
        );
    }

    return (
        <>
            <div className="w-full flex justify-between items-center p-6">
                <img src={codexLogo} alt="" className="h-7 w-30 md:h-15 md:w-60" />
                <p className="text-gray-500 text-xl md:text-3xl font-bold text-right">{quiz.name}</p>
            </div>
            {loading ?
                (
                    <div className="h-screen w-screen flex justify-center items-center">
                        <CircularIndeterminate />
                    </div>
                ) :
                (
                    (currentQues !== quiz.questions.length) ?
                        (
                            <div className="w-screen h-full justify-center items-center m-auto p-6 md:p-15 ">
                                <QuestionCard
                                    question={quiz.questions[currentQues]}
                                    onNext={handleNext}
                                    setAnswer={setAnswer}
                                />
                            </div>
                        )

                        : (
                            handleSubmit()
                        )
                )
            }
        </>
    )
}

export default QuizPage;