import User from "../models/Users.model.js";
import Quiz from "../models/Quizes.model.js";
import Result from "../models/Result.model.js";
import checkQuiz from "../utils/checkQuiz.util.js";
import mongoose from "mongoose";
import joi from "joi";

class QuizController {

    async showQuiz(req, res) {
        try {
            const { year } = req.params;
            console.log("Year:", year);

            const quiz = await Quiz.findOne({ target: year }).populate("questions");

            if (!quiz) {
                console.log("Quiz not found");
                return res.status(400).json({ message: "Quiz not found" });
            }

            const now = new Date();

            if (now < quiz.startTime) {
                return res.status(403).json({ message: "Quiz has not started yet." });
            }

            if (now > quiz.endTime) {
                return res.status(403).json({ message: "Quiz has ended." });
            }

            if (quiz.questions && quiz.questions.length > 30) {
                quiz.questions = quiz.questions
                    .sort(() => 0.5 - Math.random())
                    .slice(0, 30);
            }

            const user = await User.findById(req.user.userId);
            if (!user) return res.status(400).json({ message: "User not found" });

            if (user.quizStatus === "completed") {
                return res.status(400).json({ message: "Quiz Already Completed" });
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

            return res.status(200).json({ quiz });

        } catch (err) {
            console.error("Error in showQuiz:", err);
            return res.status(500).json({
                message: "Internal Server Error",
                error: err.message,
            });
        }
    }


    async submitQuiz(req, res) {
        try {
            const user = req.user;

            console.log(req.body);

            const { quizId } = req.params;

            const userData = await User.findById(user.userId);

            if (userData.quizStatus != "started") {
                return res.status(400).json({
                    message: "Already Completed for the quiz"
                })
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

            console.log(value);

            if (error) {
                console.log(error.details);
                return res.status(400).json({
                    message: error.details
                })
            }

            const quiz = await Quiz.findById(quizId);

            if (!quiz) {
                console.log("No Quiz Found");
                return res.status(400).json({
                    message: "No Quiz Found"
                });
            }

            console.log(value)

            await checkQuiz(user.userId, value.questions);

            const result = await Result.findOne({
                userId: req.user.userId
            })

            const startTime = result.start;

            await Result.updateOne(
                { userId: req.user.userId },
                {
                    $set: {
                        quizId: quizId,
                        end: new Date(),
                        duration: new Date() - startTime
                    }
                }
            )

            await Quiz.findByIdAndUpdate(
                quizId,
                {
                    //For unique participants
                    $addToSet: { participants: user.userId }
                }
            );
            await User.findByIdAndUpdate(
                user.userId,
                {
                    $set: {
                        questionsAttended: value.questions.map(q => {
                            return {
                                quesId: new mongoose.Types.ObjectId(q.quesId),
                                selected: q.selected
                            }
                        }),
                        quizStatus: "completed"
                    }
                },
                { new: true }
            );




            return res.status(201).json({
                message: "Quiz Submitted Successfully"
            })

        } catch (err) {
            console.log(err.message);
            return res.status(500).json({
                message: err.message
            })
        }
    }
}

const quizController = new QuizController();
export default quizController;