import { useState, useEffect, useRef, useCallback } from "react";
import CircularIndeterminate from "./Loader.jsx";

function QuestionCard({ onNext, question, setAnswer }) {

    const [timeLeft, setTimeLeft] = useState(() => {
        const savedTime = parseInt(localStorage.getItem(`timer_${question._id}`), 10);
        if (!isNaN(savedTime) && savedTime > 0) return savedTime;
        return question?.timer || 20;
    });

    const [selected, setSelected] = useState('');
    const [isLoadingNext, setIsLoadingNext] = useState(false);
    const timerRef = useRef(null);
    const timeLeftRef = useRef(timeLeft);
    const transitioningRef = useRef(false);

    // Stable navigation handler that prevents double transitions.
    const handleNext = useCallback(() => {
        if (transitioningRef.current) return;
        transitioningRef.current = true;

        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }

        // Save remaining time before unmounting
        localStorage.setItem(`timer_${question._id}`, timeLeftRef.current ?? 0);

        setIsLoadingNext(true);
        setTimeout(() => {
            // advance parent index - since we added key, this will UNMOUNT the current QuestionCard
            onNext();
        }, 600);
    }, [onNext, question._id]);

    // Timer lifecycle: setup when question changes, tear down on cleanup.
    useEffect(() => {
        // clear any old timer
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }

        const saved = parseInt(localStorage.getItem(`timer_${question._id}`), 10);
        const initial = (!isNaN(saved) && saved > 0) ? saved : (question?.timer || 20);
        setTimeLeft(initial);
        timeLeftRef.current = initial;
        localStorage.setItem(`timer_${question._id}`, initial);

        timerRef.current = setInterval(() => {
            setTimeLeft((prev) => {
                const next = prev - 1;
                timeLeftRef.current = next;
                localStorage.setItem(`timer_${question._id}`, next);
                if (next <= 0) {
                    // ensure we only transition once
                    if (timerRef.current) {
                        clearInterval(timerRef.current);
                        timerRef.current = null;
                    }
                    handleNext();
                    return 0;
                }
                return next;
            });
        }, 1000);

        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
            // persist remaining time
            localStorage.setItem(`timer_${question._id}`, timeLeftRef.current ?? 0);
        };
    }, [question._id, handleNext]);


    function handleSelect(option) {
        if (transitioningRef.current) return;
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
        handleNext();
    }



    return (
        <>
            <div className="relative w-full">
                {isLoadingNext && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/50 backdrop-blur-sm rounded-2xl">
                        <CircularIndeterminate />
                    </div>
                )}
                <div>
                    <div
                        className={`select-none mx-auto bg-white rounded-2xl shadow-xl p-6 md:p-8 transition-all duration-300 w-full sm:w-[90%] lg:w-[1200px] xl:w-[1300px] ${isLoadingNext ? 'opacity-50 pointer-events-none' : ''}`}
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
                                        disabled={!!selected || isLoadingNext}
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
                                disabled={isLoadingNext}
                                className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-all disabled:opacity-50"
                            >
                                Next →
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

export default QuestionCard