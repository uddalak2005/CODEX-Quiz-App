import User from "../models/Users.model.js";
import Quiz from "../models/Quizes.model.js";
import Result from "../models/Result.model.js";
import checkQuiz from "../utils/checkQuiz.util.js";
import mongoose from "mongoose";
import joi from "joi";

class QuizController {

    async showQuiz(req, res) {
        try {
            const { year } = req.params

            const quiz = await Quiz.findOne({
                target: year
            }).populate("questions");

            if (!quiz) {
                console.log("Quiz not found");
                return res.status(400).json({
                    message: "Quiz not found"
                })
            }

            console.log(quiz);

            if (quiz.questions && quiz.questions.length > 20) {
                quiz.questions = random.sample(quiz.questions, 20);
            }


            console.log(quiz);

            const user = await User.findById(req.user.userId);

            if (!user) {
                console.log("User not found");
                return res.status(400).json({
                    message: "User not found"
                })
            }

            if (user.quizStatus == 'completed') {
                return res.status(400).json({
                    message: "Quiz Already Completed"
                })
            }


            await User.updateOne(
                { _id: req.user.userId, },
                {
                    $set: {
                        quizStatus: 'started',
                        questionsProvided: quiz.questions.map(question => question._id)
                    }
                });

            await Result.updateOne(
                { userId: req.user.userId },
                {
                    $set: { start: new Date() }
                },
                {
                    new: true,
                    upsert: true
                }
            );



            if (!quiz) {
                console("No Quiz Found");
                return res.status("No Quiz Found");
            }

            return res.status(200).json({
                quiz
            })

        } catch (err) {

        }
    }

    async submitQuiz(req, res) {
        try {
            const user = req.user;

            const { quizId } = req.params;


            const joiSchema = joi.object({
                questions: joi.array().items(
                    joi.object({
                        quesId: joi.string().required(),
                        selected: joi.string().valid("A", "B", "C", "D").required()
                    })
                )
            });

            const { value, error } = joiSchema.validate(req.body);

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
                    $push: { participants: user.userId }
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
                        })
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