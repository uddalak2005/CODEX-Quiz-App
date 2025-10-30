import { useEffect, useState } from "react";

function QuestionCard({ question, onNext, isLast }) {
    const [selected, setSelected] = useState(null);
    const [timeLeft, setTimeLeft] = useState(question.timer || 30);

    useEffect(() => {
        if (timeLeft === 0) {
            handleNext();
            return;
        }
        const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
        return () => clearTimeout(timer);
    }, [timeLeft]);

    const handleSelect = (option) => {
        if (selected) return;
        setSelected(option);
        setTimeout(() => handleNext(), 800);
    };

    const handleNext = () => {
        onNext();
        setSelected(null);
    };

    return (
        <div className="border p-4 rounded-lg shadow-md">
            <div className="flex justify-between mb-2">
                <p className="font-medium text-lg">{question.quesString}</p>
                <p className="text-sm text-gray-500">{timeLeft}s</p>
            </div>

            <div className="grid gap-2">
                {["A", "B", "C", "D"].map((opt) => {
                    const option = question[`option${opt}`];
                    return (
                        <button
                            key={opt}
                            onClick={() => handleSelect(opt)}
                            disabled={!!selected}
                            className={`border p-2 rounded-md text-left ${selected === opt
                                    ? "bg-blue-500 text-white"
                                    : "hover:bg-gray-100"
                                }`}
                        >
                            {option?.nameString}
                        </button>
                    );
                })}
            </div>

            <div className="mt-4">
                {!isLast ? (
                    <button
                        onClick={handleNext}
                        className="bg-gray-200 px-3 py-1 rounded hover:bg-gray-300"
                    >
                        Skip
                    </button>
                ) : (
                    <p className="text-green-600 font-semibold mt-3">Quiz Completed!</p>
                )}
            </div>
        </div>
    );
}

export default QuestionCard;
