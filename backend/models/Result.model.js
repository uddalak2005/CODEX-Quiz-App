import mongoose from "mongoose";

const resultSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "user"
    },
    quizId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "quiz"
    },
    points: {
        type: Number,
        required: true
    },
    start: Date,
    end: Date,
    questions: [{
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "questions"
    }]
})

const Result = mongoose.model("result", resultSchema);
export default Result;