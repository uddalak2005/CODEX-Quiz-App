import Question from "../models/Questions.model.js";
import Quiz from "../models/Quizes.model.js";
import User from "../models/Users.model.js";
import Result from "../models/Result.model.js";
import jwt from "jsonwebtoken";
import Joi from "joi"

class AdminController {

    async adminLogin(req, res) {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                return res.status(400).json({
                    message: "Email and password are required."
                });
            }

            const user = await User.findOne({ email, password });

            if (!user || user.role !== "admin") {
                return res.status(400).json({
                    message: "Invalid Email or password"
                });
            }

            const token = jwt.sign(
                { userId: user._id, email: user.email, role: "admin" },
                process.env.JWT_SECRET,
                { expiresIn: "8h" }
            );

            return res.status(200).json({ user, token });
        } catch (err) {
            return res.status(400).json({ message: err.message });
        }
    }

    // ─── Create a single participant account ────────────────────────────────────
    async createUser(req, res) {
        const joiSchema = Joi.object({
            name: Joi.string().required(),
            regdNo: Joi.string().required(),
            email: Joi.string().email().required(),
            assignedQuizId: Joi.string().length(24).required(),
        });

        const { value, error } = joiSchema.validate(req.body);
        if (error) return res.status(400).json({ message: error.details });

        try {
            // Check quiz exists and admin owns it
            const quiz = await Quiz.findOne({ _id: value.assignedQuizId, user: req.user.userId });
            if (!quiz) return res.status(404).json({ message: "Quiz not found or unauthorized." });

            const newUser = await User.create({
                name: value.name,
                regdNo: value.regdNo,
                email: value.email,
                assignedQuizId: value.assignedQuizId,
                role: "user",
            });

            // Add to quiz's allowedParticipants
            await Quiz.findByIdAndUpdate(value.assignedQuizId, {
                $addToSet: { allowedParticipants: newUser._id }
            });

            return res.status(201).json({ message: "User created successfully", user: newUser });
        } catch (err) {
            if (err.code === 11000) {
                return res.status(400).json({ message: "A user with this regdNo or email already exists.", field: err.keyValue });
            }
            return res.status(500).json({ message: err.message });
        }
    }

    // ─── Bulk create participant accounts from array ─────────────────────────────
    async bulkCreateUsers(req, res) {
        const userItemSchema = Joi.object({
            name: Joi.string().required(),
            regdNo: Joi.string().required(),
            email: Joi.string().email().required(),
        });

        const joiSchema = Joi.object({
            assignedQuizId: Joi.string().length(24).required(),
            users: Joi.array().items(userItemSchema).min(1).required(),
        });

        const { value, error } = joiSchema.validate(req.body);
        if (error) return res.status(400).json({ message: error.details });

        try {
            const quiz = await Quiz.findOne({ _id: value.assignedQuizId, user: req.user.userId });
            if (!quiz) return res.status(404).json({ message: "Quiz not found or unauthorized." });

            const results = { created: [], failed: [] };

            for (const u of value.users) {
                try {
                    const newUser = await User.create({
                        name: u.name,
                        regdNo: u.regdNo,
                        email: u.email,
                        assignedQuizId: value.assignedQuizId,
                        role: "user",
                    });
                    results.created.push({ regdNo: u.regdNo, id: newUser._id });
                } catch (err) {
                    results.failed.push({ regdNo: u.regdNo, reason: err.code === 11000 ? "Already exists" : err.message });
                }
            }

            // Add all newly created users to allowedParticipants in one update
            if (results.created.length > 0) {
                await Quiz.findByIdAndUpdate(value.assignedQuizId, {
                    $addToSet: { allowedParticipants: { $each: results.created.map(u => u.id) } }
                });
            }

            return res.status(201).json({ message: "Bulk creation complete.", ...results });
        } catch (err) {
            return res.status(500).json({ message: err.message });
        }
    }

    // ─── Create Quiz ─────────────────────────────────────────────────────────────
    async createQuiz(req, res) {
        const optionSchema = Joi.object({
            nameString: Joi.string().allow("", null),
            image: Joi.string().allow("", null)
        }).or("nameString", "image");

        const joiSchema = Joi.object({
            name: Joi.string().required(),
            startTime: Joi.date().required(),
            endTime: Joi.date().greater(Joi.ref('startTime')).required(),
            questions: Joi.array().items(
                Joi.object({
                    quesString: Joi.string().allow("", null),
                    quesImage: Joi.string().allow("", null),
                    optionA: optionSchema.required(),
                    optionB: optionSchema.required(),
                    optionC: optionSchema.required(),
                    optionD: optionSchema.required(),
                    correct: Joi.string().valid("A", "B", "C", "D").required(),
                    timer: Joi.number().valid(15, 30, 60, 90).required()
                })
            ).required()
        });

        try {
            const { value, error } = joiSchema.validate(req.body);
            if (error) return res.status(400).json({ message: error.details });

            const newQuiz = await Quiz.create({
                user: req.user.userId,
                name: value.name,
                startTime: value.startTime,
                endTime: value.endTime
            });

            let questionIdArray = [];
            for (const question of value.questions) {
                const newQuestion = await Question.create({
                    quizId: newQuiz._id,
                    quesString: question.quesString,
                    quesImage: question.quesImage,
                    optionA: question.optionA,
                    optionB: question.optionB,
                    optionC: question.optionC,
                    optionD: question.optionD,
                    correct: question.correct,
                    timer: question.timer
                });
                questionIdArray.push(newQuestion._id);
            }

            await Quiz.findByIdAndUpdate(newQuiz._id, {
                $set: { questions: questionIdArray }
            });

            return res.status(201).json({
                message: "Quiz created successfully",
                quizId: newQuiz._id
            });

        } catch (err) {
            return res.status(500).json({ message: err.message });
        }
    }

    // ─── Get single quiz (admin view) ────────────────────────────────────────────
    async getQuiz(req, res) {
        try {
            const { quizId } = req.params;

            const quizDetails = await Quiz.findById(quizId)
                .populate("user", "name email")
                .populate("questions")
                .populate("allowedParticipants", "name email regdNo quizStatus")
                .populate("participants", "name email regdNo");

            if (!quizDetails) {
                return res.status(404).json({ message: "Quiz Not Found" });
            }

            // Fetch results for submitted participants
            const participantIds = quizDetails.participants.map(p => p._id);
            const results = await Result.find({
                quizId: quizDetails._id,
                userId: { $in: participantIds }
            });

            const resultMap = new Map();
            results.forEach(r => resultMap.set(r.userId.toString(), r));

            const participantData = quizDetails.participants.map(p => {
                const r = resultMap.get(p._id.toString());
                return {
                    name: p.name,
                    email: p.email,
                    regdNo: p.regdNo,
                    points: r?.points || 0,
                    duration: r?.duration || 0
                };
            });

            const quizObj = quizDetails.toObject();
            quizObj.participants = participantData;

            return res.status(200).json({ quizObj });

        } catch (err) {
            return res.status(500).json({ message: err.message });
        }
    }

    // ─── Update Quiz ─────────────────────────────────────────────────────────────
    async updateQuiz(req, res) {
        const optionSchema = Joi.object({
            nameString: Joi.string().allow("", null),
            image: Joi.string().allow("", null)
        }).or("nameString", "image");

        const joiSchema = Joi.object({
            name: Joi.string().required(),
            startTime: Joi.date().required(),
            endTime: Joi.date().greater(Joi.ref('startTime')).required(),
            questions: Joi.array().items(
                Joi.object({
                    quesString: Joi.string().allow("", null),
                    quesImage: Joi.string().allow("", null),
                    optionA: optionSchema.required(),
                    optionB: optionSchema.required(),
                    optionC: optionSchema.required(),
                    optionD: optionSchema.required(),
                    correct: Joi.string().valid("A", "B", "C", "D").required(),
                    timer: Joi.number().valid(15, 30, 60, 90).required()
                })
            ).required()
        });

        try {
            const { value, error } = joiSchema.validate(req.body);
            if (error) return res.status(400).json({ message: error.details });

            const { quizId } = req.params;
            const existingQuiz = await Quiz.findOne({ _id: quizId });
            if (!existingQuiz) return res.status(404).json({ message: "Quiz not found or unauthorized" });

            existingQuiz.name = value.name;
            existingQuiz.startTime = value.startTime;
            existingQuiz.endTime = value.endTime;
            await existingQuiz.save();

            await Question.deleteMany({ quizId: existingQuiz._id });

            let questionIdArray = [];
            for (const q of value.questions) {
                const newQuestion = await Question.create({
                    quizId: existingQuiz._id,
                    quesString: q.quesString,
                    quesImage: q.quesImage,
                    optionA: q.optionA,
                    optionB: q.optionB,
                    optionC: q.optionC,
                    optionD: q.optionD,
                    correct: q.correct,
                    timer: q.timer
                });
                questionIdArray.push(newQuestion._id);
            }

            await Quiz.findByIdAndUpdate(existingQuiz._id, {
                $set: { questions: questionIdArray }
            });

            return res.status(200).json({ message: "Quiz updated successfully" });

        } catch (err) {
            return res.status(500).json({ message: err.message });
        }
    }

    // ─── Delete Quiz ─────────────────────────────────────────────────────────────
    async deleteQuiz(req, res) {
        try {
            const { quizId } = req.params;

            const quiz = await Quiz.findOne({ _id: quizId, user: req.user.userId });
            if (!quiz) return res.status(404).json({ message: "Quiz not found or unauthorized" });

            await Question.deleteMany({ quizId: quiz._id });
            await Result.deleteMany({ quizId: quiz._id });
            await Quiz.findByIdAndDelete(quizId);

            // Unlink all users that were assigned this quiz
            await User.updateMany(
                { assignedQuizId: quizId },
                { $set: { assignedQuizId: null } }
            );

            return res.status(200).json({ message: "Quiz deleted successfully" });
        } catch (err) {
            return res.status(500).json({ message: err.message });
        }
    }

    // ─── Get all quizzes for the admin ───────────────────────────────────────────
    async getAllData(req, res) {
        try {
            const userId = req.user?.userId;
            if (!userId) return res.status(401).json({ success: false, message: "Unauthorized access" });

            const allQuizzes = await Quiz.find({ user: userId })
                .populate("user", "name email")
                .sort({ createdOn: -1 });

            return res.status(200).json({
                success: true,
                count: allQuizzes.length,
                allQuizzes,
            });
        } catch (err) {
            return res.status(500).json({ success: false, message: err.message });
        }
    }

    // ─── Remove a participant from a quiz ─────────────────────────────────────────
    async removeParticipant(req, res) {
        try {
            const { quizId, userId } = req.params;

            const quiz = await Quiz.findOne({ _id: quizId, user: req.user.userId });
            if (!quiz) return res.status(404).json({ message: "Quiz not found or unauthorized" });

            await Quiz.findByIdAndUpdate(quizId, {
                $pull: { allowedParticipants: userId }
            });

            await User.findByIdAndUpdate(userId, {
                $set: { assignedQuizId: null }
            });

            return res.status(200).json({ message: "Participant removed successfully" });
        } catch (err) {
            return res.status(500).json({ message: err.message });
        }
    }
}

const adminController = new AdminController();
export default adminController;