import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    regdNo: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    year: {
        type: Number,
        enum: [1, 2],
        required: true
    },
    email: {
        type: String,
    },
    password: {
        type: String,
    },
    quizStatus: {
        enum: ["completed", "not_started", "started"],
        type: String,
        required: true,
        default: "not_started"
    },
});

const User = mongoose.model("user", userSchema);
export default User;