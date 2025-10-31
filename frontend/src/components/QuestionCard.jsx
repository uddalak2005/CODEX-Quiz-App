import { useState, useEffect } from "react";
import CircularIndeterminate from "./Loader.jsx";

function QuestionCard({ onNext, question, setAnswer }) {

    const [timeLeft, setTimeLeft] = useState(() => {
        const savedTime = localStorage.getItem(`timer_${question._id}`);
        return savedTime ? parseInt(savedTime, 10) : 20;
    });

    const [selected, setSelected] = useState('');
    const [isLoadingNext, setIsLoadingNext] = useState(false);

    useEffect(() => {

        if (timeLeft <= 0) {
            handleNext();
            return;
        }

        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                const newTime = prev - 1;
                localStorage.setItem(`timer_${question._id}`, newTime);
                return newTime;
            });
        }, 1000);


        return () => clearInterval(timer);
    }, [timeLeft]);

    useEffect(() => {
        return () => {
            localStorage.setItem(`timer_${question._id}`, timeLeft);
        };
    }, [timeLeft, question._id]);


    function handleSelect(option) {
        setSelected(option);
        setAnswer((prev) => ({
            ...prev,
            questions: [
                ...prev.questions,
                {
                    quesId: question._id,
                    selected: option
                }
            ]
        }));
        handleNext()
    }

    function handleNext() {
        setIsLoadingNext(true);
        setTimeout(() => {
            onNext();
            setSelected('');
            setTimeLeft(question.timer || 20);
            setIsLoadingNext(false);
        }, 600);
    }

    return (
        <>
            {
                isLoadingNext ? (
                    <div className="flex justify-center mt-50" >
                        <CircularIndeterminate />
                    </div >
                ) : (
                    <div>
                        <div
                            className="select-none mx-auto bg-white rounded-2xl shadow-xl p-6 md:p-8 transition-all duration-300 mt-20 w-full sm:w-[90%] lg:w-[1200px] xl:w-[1300px]"
                            onCopy={(e) => e.preventDefault()}
                            onCut={(e) => e.preventDefault()}
                            onPaste={(e) => e.preventDefault()}
                            onContextMenu={(e) => e.preventDefault()}
                        >


                            {/* Header */}
                            <div className="flex justify-between items-center mb-6 gap-10">
                                <h2 className="text-lg md:text-xl font-semibold text-gray-800 ">
                                    {question?.quesString}
                                </h2>
                                <div
                                    className={`text-sm font-semibold px-3 py-1 rounded-full ${timeLeft <= 5
                                        ? "bg-red-500 text-white"
                                        : "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-200"
                                        }`}
                                >
                                    {timeLeft}s
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {["A", "B", "C", "D"].map((opt) => {
                                    const isSelected = selected === opt;
                                    return (
                                        <button
                                            key={opt}
                                            onClick={() => handleSelect(opt)}
                                            disabled={!!selected}
                                            className={`p-4 rounded-xl border text-left text-gray-800 transition-all duration-200 ${isSelected
                                                ? "bg-blue-600 text-white border-blue-600 shadow-md scale-105"
                                                : "hover:bg-gray-100  border-gray-700"
                                                } disabled:opacity-70`}
                                        >
                                            <span className="font-medium mr-2">{opt}.</span>
                                            {question[`option${opt}`]?.nameString}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Footer */}
                            <div className="mt-6 flex justify-end">
                                <button
                                    onClick={handleNext}
                                    className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-all disabled:opacity-50"
                                >
                                    Next →
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </>
    )
}

export default QuestionCard