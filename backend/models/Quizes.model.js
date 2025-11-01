import mongoose from "mongoose";

const quizSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "user"
    },
    name: {
        type: String,
        required: true
    },
    target: {
        type: Number,
        enum: [1, 2],
        required: true,
        unique: true
    },
    createdOn: {
        type: Date,
        default: Date.now()
    },
    impressions: {
        type: Number,
        default: 0
    },
    questions: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Question"
        }
    ],

    participants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "user"
    }],

    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
})

const Quiz = mongoose.model("quiz", quizSchema);
export default Quiz;