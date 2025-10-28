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
    optionsA: {
        ansString: String,
        ansImage: String
    },
    optionsB: {
        ansString: String,
        ansImage: String
    },
    optionsC: {
        ansString: String,
        ansImage: String
    },
    optionsD: {
        ansString: String,
        ansImage: String
    },
    correct: {
        type: String,
        required: true,
        enum: ['A', 'B', 'C', 'D']
    },
    createdOn: {
        type: Date,
        default: Date.now
    }
});

const Question = mongoose.model("Question", questionSchema);
export default Question;
