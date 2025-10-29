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
                console.log("Email or password missing");
                return res.status(400).json({
                    message: "Validation ERR, either or password is missing"
                })
            }

            const user = await User.findOne({
                email: email,
                password: password
            })

            if (!user) {
                console.log("Invalid email id or password");
                return res.status(400).json({
                    message: "Invalid Email or password"
                })
            }

            const token = jwt.sign({
                userId: user._id,
                email: user.email,
                role: "admin"
            }, process.env.JWT_SECRET,
                {
                    expiresIn: "1h"
                })

            return res.status(200).json({
                user,
                token
            })
        } catch (err) {
            console.log("Error while admin logging in");
            return res.status(400).json({
                message: err.message
            })
        }
    }

    async createQuiz(req, res) {

        console.log(req.body);

        const optionSchema = Joi.object({
            nameString: Joi.string().allow("", null),
            image: Joi.string().allow("", null)
        }).or("nameString", "image");

        const joiSchema = Joi.object({
            name: Joi.string().required(),
            target: Joi.number().required(),
            questions: Joi.array().items(
                Joi.object({
                    quesString: Joi.string().allow("", null),
                    quesImage: Joi.string().allow("", null),
                    optionA: optionSchema.required(),
                    optionB: optionSchema.required(),
                    optionC: optionSchema.required(),
                    optionD: optionSchema.required(),
                    correct: Joi.string().valid("A", "B", "C", "D").required(),
                    timer: Joi.number().valid(30, 60, 90).required()
                })
            ).required()
        });

        try {
            const { value, error } = joiSchema.validate(req.body);

            console.log("Validated value:", value);


            if (error) {
                console.log(error.details);
                return res.status(400).json({
                    message: error.details
                })
            }

            const user = req.user;

            console.log(user);

            const newQuiz = await Quiz.create({
                user: user.userId,
                name: value.name,
                target: value.target,
            });

            let questionIdArray = []

            for (const question of value.questions) {
                console.log(question);
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
                })

                questionIdArray.push(newQuestion._id);
            }

            await Quiz.findByIdAndUpdate(newQuiz._id,
                {
                    $set: {
                        questions: questionIdArray
                    }
                }
            );

            return res.status(201).json({
                message: "Quiz Created successfully"
            });

        } catch (err) {
            console.log(err.message);
            res.status(500).json({
                message: err.message
            })
        }
    }

    async getQuiz(req, res) {
        try {

            const { quizId } = req.params;

            const quizDetails = await Quiz.findById(quizId)
                .populate("user", "name email year")
                .populate("questions")
                .populate("participants");

            if (!quizDetails) {
                console.log("Quiz Not Found");
                return res.status(404).json({
                    message: "Quiz Not Found"
                })
            }

            for (const participant of quizDetails.participants) {
                const result = await Result.find({ userId: participant._id });
                quizDetails.participants
            }

            const results = await Promise.all(
                quizDetails.participants.map(async (participant) => {
                    console.log(participant);
                    const result = await Result.findOne({ userId: participant._id, quizId: quizDetails._id });

                    return {
                        name: participant.name,
                        email: participant.email,
                        year: participant.year,
                        points: result?.points || 0,
                        duration: result?.duration || 0
                    };
                })
            );

            console.log(results);
            const quizObj = quizDetails.toObject();
            quizObj.participants = results;

            return res.status(200).json({
                quizObj
            })

        } catch (err) {
            console.log(err.message);
            return res.status(500).json({
                message: err.message
            })
        }
    }

    async deleteQuiz(req, res) {
        try {
            const { quizId } = req.params;

            await Question.deleteMany({ quizId: quizId });
            await Result.deleteMany({ quizId: quizId });
            await Quiz.deleteMany({ _id: quizId });

            return res.status(200).json({
                message: "Quiz Deleted SuccessFully"
            })

        } catch (err) {
            console.log(err.message);
            return res.status(500).json({
                message: err.message
            })
        }
    }

    async updateQuiz(req, res) {
        const optionSchema = Joi.object({
            nameString: Joi.string().allow("", null),
            image: Joi.string().allow("", null)
        }).or("nameString", "image");

        const joiSchema = Joi.object({
            name: Joi.string().required(),
            target: Joi.number().required(),
            questions: Joi.array().items(
                Joi.object({
                    _id: Joi.string().optional(),
                    quesString: Joi.string().allow("", null),
                    quesImage: Joi.string().allow("", null),
                    optionA: optionSchema.required(),
                    optionB: optionSchema.required(),
                    optionC: optionSchema.required(),
                    optionD: optionSchema.required(),
                    correct: Joi.string().valid("A", "B", "C", "D").required(),
                    timer: Joi.number().valid(30, 60, 90).required()
                })
            )
        });

        try {
            const { value, error } = joiSchema.validate(req.body);
            if (error) {
                return res.status(400).json({ message: error.details });
            }

            const { quizId } = req.params;
            const user = req.user;
            console.log(user, quizId);

            const existingQuiz = await Quiz.findOne({ _id: quizId, user: user.userId });
            if (!existingQuiz) {
                return res.status(404).json({ message: "Quiz not found or unauthorized" });
            }

            existingQuiz.name = value.name;
            existingQuiz.target = value.target;
            await existingQuiz.save();


            await Question.deleteMany({ quizId: existingQuiz._id });

            let questionIdArray = []


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

            await Quiz.findByIdAndUpdate(existingQuiz._id,
                {
                    $set: {
                        questions: questionIdArray
                    }
                }
            );

            return res.status(200).json({ message: "Quiz updated successfully" });

        } catch (err) {
            console.error("Error updating quiz:", err.message);
            return res.status(500).json({ message: "Internal Server Error", error: err.message });
        }
    }


    async deleteQuiz(req, res) {
        try {
            const { quizId } = req.params;
            const user = req.user;

            const quiz = await Quiz.findOne({ _id: quizId, user: user.userId });
            if (!quiz) {
                return res.status(404).json({ message: "Quiz not found or unauthorized" });
            }

            await Question.deleteMany({ quizId: quiz._id });

            await Quiz.findByIdAndDelete(quizId);

            return res.status(200).json({ message: "Quiz deleted successfully" });

        } catch (err) {
            console.error("Error deleting quiz:", err.message);
            return res.status(500).json({ message: "Internal Server Error", error: err.message });
        }
    };
}

const adminController = new AdminController();
export default adminController;