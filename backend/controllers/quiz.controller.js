import User from "../models/Users.model.js";
import Quiz from "../models/Quizes.model.js";
import Question from "../models/Questions.model.js";
import Result from "../models/Result.model.js";

class QuizController {

    async showQuiz(req, res) {
        try {
            const { year } = req.params

            const quiz = await Quiz.findOne({
                target: year
            }).populate("questions");

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
                        quesId: joi.string().required,
                        selected: joi.string().valid("A", "B", "C", "D", "E").required()
                    })
                )
            });

            const quiz = await Quiz.findOne({
                _id: quizId
            })

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
}