import User from "../models/Users.model.js";
import Quiz from "../models/Quizes.model.js";
import Result from "../models/Result.model.js";
import checkQuiz from "../utils/checkQuiz.util.js";
import mongoose from "mongoose";
import joi from "joi";

class QuizController {

    // GET /quiz/getQuiz/:quizId
    async showQuiz(req, res) {
        try {
            const { quizId } = req.params;

            const quiz = await Quiz.findById(quizId).populate("questions");

            if (!quiz) {
                return res.status(404).json({ message: "Quiz not found" });
            }

            // Time window enforcement
            const now = new Date();
            if (now < quiz.startTime) {
                return res.status(403).json({ message: "Quiz has not started yet." });
            }
            if (now > quiz.endTime) {
                return res.status(403).json({ message: "Quiz has ended." });
            }

            const user = await User.findById(req.user.userId);
            if (!user) return res.status(404).json({ message: "User not found" });

            // Access control: assignedQuizId is set when admin links user's group to this quiz
            if (!user.assignedQuizId || user.assignedQuizId.toString() !== quizId) {
                return res.status(403).json({ message: "This quiz is not assigned to your account." });
            }

            if (user.quizStatus === "completed") {
                return res.status(400).json({ message: "You have already completed this quiz." });
            }

            if (user.quizStatus === "started" && user.questionsProvided && user.questionsProvided.length > 0) {
                // Restore the same questions in the same order (no re-shuffle on refresh)
                const providedQuestionIds = user.questionsProvided.map(id => id.toString());
                quiz.questions = quiz.questions.filter(q => providedQuestionIds.includes(q._id.toString()));
                quiz.questions.sort(
                    (a, b) => providedQuestionIds.indexOf(a._id.toString()) - providedQuestionIds.indexOf(b._id.toString())
                );
            } else {
                // First time: shuffle and cap at 30
                if (quiz.questions && quiz.questions.length > 30) {
                    quiz.questions = quiz.questions
                        .sort(() => 0.5 - Math.random())
                        .slice(0, 30);
                }

                await User.updateOne(
                    { _id: req.user.userId },
                    {
                        $set: {
                            quizStatus: "started",
                            questionsProvided: quiz.questions.map((q) => q._id),
                        },
                    }
                );

                await Result.updateOne(
                    { userId: req.user.userId },
                    { $set: { start: new Date() } },
                    { new: true, upsert: true }
                );
            }

            return res.status(200).json({ quiz });

        } catch (err) {
            console.error("Error in showQuiz:", err);
            return res.status(500).json({ message: "Internal Server Error", error: err.message });
        }
    }


    // POST /quiz/submitQuiz/:quizId
    async submitQuiz(req, res) {
        try {
            const { quizId } = req.params;
            const user = req.user;

            const userData = await User.findById(user.userId);
            if (userData.quizStatus !== "started") {
                return res.status(400).json({ message: "Quiz not started or already completed." });
            }

            const joiSchema = joi.object({
                questions: joi.array().items(
                    joi.object({
                        quesId: joi.string().required(),
                        selected: joi.string().valid("A", "B", "C", "D", "").required()
                    })
                )
            });

            const { value, error } = joiSchema.validate(req.body);
            if (error) return res.status(400).json({ message: error.details });

            const quiz = await Quiz.findById(quizId);
            if (!quiz) return res.status(404).json({ message: "Quiz not found" });

            await checkQuiz(user.userId, value.questions);

            const result = await Result.findOne({ userId: req.user.userId });
            const startTime = result.start;

            await Result.updateOne(
                { userId: req.user.userId },
                {
                    $set: {
                        quizId,
                        end: new Date(),
                        duration: new Date() - startTime
                    }
                }
            );

            await Quiz.findByIdAndUpdate(quizId, {
                $addToSet: { participants: user.userId }
            });

            await User.findByIdAndUpdate(
                user.userId,
                {
                    $set: {
                        questionsAttended: value.questions.map(q => ({
                            quesId: new mongoose.Types.ObjectId(q.quesId),
                            selected: q.selected
                        })),
                        quizStatus: "completed"
                    }
                },
                { new: true }
            );

            return res.status(201).json({ message: "Quiz Submitted Successfully" });

        } catch (err) {
            console.error(err.message);
            return res.status(500).json({ message: err.message });
        }
    }
}

const quizController = new QuizController();
export default quizController;