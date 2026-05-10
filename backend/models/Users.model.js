import mongoose from "mongoose";


const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    regdNo: { type: String, required: true, unique: true },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    email: { type: String },
    password: { type: String },


    assignedQuizId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "quiz",
        default: null
    },

    // ── Participant-only fields (never written to for admin accounts) ──────────
    questionsProvided: [{ type: mongoose.Schema.Types.ObjectId, ref: "Question" }],
    questionsAttended: [{
        quesId: { type: mongoose.Schema.Types.ObjectId, ref: "Question" },
        selected: { type: String, enum: ["A", "B", "C", "D"] }
    }],
    quizStatus: {
        type: String,
        enum: ["completed", "not_started", "started"],
        default: "not_started"
    },
});

const User = mongoose.model("user", userSchema);
export default User;