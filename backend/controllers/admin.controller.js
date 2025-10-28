import Question from "../models/Questions.model";
import Quiz from "../models/Quizes.model";
import User from "../models/Users.model.js";
import Result from "../models/Result.model.js";
import jwt from "jsonwebtoken";
import joi from "joi"

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
                email: user.email
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

        const optionSchema = joi.object({
            nameString: joi.string().allow("", null),
            image: joi.string().allow("", null)
        }).or("nameString", "image");

        const joiSchema = joi.object({
            name: joi.string().required(),
            target: joi.number().required(),
            questions: joi.array().items(
                joi.object({
                    quesString: joi.string().allow("", null),
                    quesImage: joi.string().allow("", null),
                    objectA: optionSchema.required(),
                    objectB: optionSchema.required(),
                    objectC: optionSchema.required(),
                    objectC: optionSchema.required(),
                    correct: joi.string().valid("A", "B", "C", "D").required()
                })
            )
        });

        try {
            const { value, error } = joiSchema.validate(req.body);

            if (error) {
                console.log(error.details);
                return req.status(400).json({
                    message: error.details
                })
            }

            const user = req.user;

            const newQuiz = await Quiz.create({
                user: user.userId,
                name: value.name,
                target: value.target
            })

            for (const question of value.questions) {
                const question = await Question.create({
                    quizId: newQuiz._id,
                    quesString: question.quesString,
                    quesImage: question.quesImage,
                    optionsA: question.optionsA,
                    optionsB: question.optionsB,
                    optionsC: question.optionsC,
                    optionsD: question.optionsD,
                    correct: question.correct
                })
            }

            return res.status(201).json("Quiz Created successfully");

        } catch (err) {
            console.log(err.message);
            res.status(500).json({
                message: err.message
            })
        }
    }

    async getQuizes(req, res) {
        try {

            const { quizId } = req.params;

            const quizDetails = await Quiz.find(quizId)
                .populate("users", "name email year")
                .populate("questions");

            if (!quizDetails) {
                console("Quiz Not Found");
                return res.status(404).json({
                    message: "Quiz Not Found"
                })
            }

            for (const participant of quizDetails.participants) {
                const result = await Result.find({ userId: participant._id });
                quizDetails.participants
            }

            const results = quizDetails.participants.map(async (participant) => {
                const result = await Result.find({ userId: participant._id });
                return {
                    ...participant,
                    points: result.points
                }
            })

            quizDetails.participants = results;

            return res.status(200).json({
                quizDetails
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

    async updateQuestion(req, res) {
        try {

            const { quesId } = req.params;

            const optionSchema = joi.object({
                nameString: joi.string().allow("", null),
                image: joi.string().allow("", null)
            }).or("nameString", "image");

            const questionSchema = joi.object(
                joi.object({
                    quesString: joi.string().allow("", null),
                    quesImage: joi.string().allow("", null),
                    objectA: optionSchema.required(),
                    objectB: optionSchema.required(),
                    objectC: optionSchema.required(),
                    objectC: optionSchema.required(),
                    correct: joi.string().valid("A", "B", "C", "D").required()
                })
            )

            const { value, error } = questionSchema.validate(req.body);

            if (error) {
                console.log(error.details);
                return res.status(400).json({
                    message: error.details
                })
            }

            const updatedQuestion = await Question.updateOne(
                { _id: quesId },
                {
                    $set: {
                        quesString: value.quesString,
                        quesImage: value.quesImage,
                        optionsA: value.optionsA,
                        optionsB: value.optionsB,
                        optionsC: value.optionsC,
                        optionsD: value.optionsD,
                        correct: value.correct
                    }
                }
            );

            return res.status(201).json({
                message: "Question Updated Successfully"
            })
        } catch (err) {
            console.log(err.message);
            return res.status(500).json({
                message: err.message
            })
        }
    }

    async deleteQuestion(req, res) {
        try {
            const { quesId } = req.params;

            const question = await Question.findById(quesId);
            if (!question) {
                return res.status(404).json({
                    message: "Question not found"
                });
            }

            await Question.deleteOne({ _id: quesId });

            return res.status(200).json({
                message: "Question deleted successfully"
            });

        } catch (err) {
            console.error(err.message);
            return res.status(500).json({
                error: err.message
            });
        }
    }
}

const adminController = new AdminController();
export default adminController;