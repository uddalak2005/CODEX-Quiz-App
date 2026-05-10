import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    regdNo: {
        type: String,
        required: true,
        unique: true
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    // Replaces the old `year` field — admin assigns a specific quiz at account creation
    assignedQuizId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "quiz",
        default: null
    },
    email: {
        type: String,
    },
    password: {
        type: String,
    },
    questionsProvided: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Question"
    }],
    questionsAttended: [{
        quesId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Question"
        },
        selected: {
            type: String,
            enum: ["A", "B", "C", "D"]
        }
    }],
    quizStatus: {
        enum: ["completed", "not_started", "started"],
        type: String,
        required: true,
        default: "not_started"
    },
});

const User = mongoose.model("user", userSchema);
export default User;