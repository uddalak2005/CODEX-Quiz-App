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
    // Users explicitly allowed to take this quiz (replaces target year)
    allowedParticipants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "user"
    }],
    // Users who have actually submitted
    participants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "user"
    }],

    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
})

const Quiz = mongoose.model("quiz", quizSchema);
export default Quiz;