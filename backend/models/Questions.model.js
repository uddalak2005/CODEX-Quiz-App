import mongoose from "mongoose";

const questionSchema = new mongoose.Schema({
    quizId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "quiz"
    },
    quesString: {
        type: String
    },
    quesImage: {
        type: String
    },
    optionA: {
        nameString: String,
        nameImage: String
    },
    optionB: {
        nameString: String,
        nameImage: String
    },
    optionC: {
        nameString: String,
        nameImage: String
    },
    optionD: {
        nameString: String,
        nameImage: String
    },
    correct: {
        type: String,
        required: true,
        enum: ['A', 'B', 'C', 'D']
    },
    timer: {
        type: Number,
        required: true,
        enum: [15, 30, 60, 90]
    },
    createdOn: {
        type: Date,
        default: Date.now
    }
});

const Question = mongoose.model("Question", questionSchema);
export default Question;
