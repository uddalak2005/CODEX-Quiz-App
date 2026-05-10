import mongoose from "mongoose";

const quizSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "user" },
    name: { type: String, required: true },
    questions: [{ type: mongoose.Schema.Types.ObjectId, ref: "Question" }],
    // Groups whose members can take this quiz.
    // When groups are assigned, all their members get assignedQuizId set automatically.
    assignedGroups: [{ type: mongoose.Schema.Types.ObjectId, ref: "group" }],
    // Users who have actually submitted (for leaderboard)
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "user" }],
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    createdOn: { type: Date, default: Date.now }
});

const Quiz = mongoose.model("quiz", quizSchema);
export default Quiz;