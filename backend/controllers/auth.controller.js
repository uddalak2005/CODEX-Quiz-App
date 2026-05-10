import User from "../models/Users.model.js";
import Joi from "joi";
import jwt from "jsonwebtoken";

class AuthController {

    async loginUser(req, res) {
        console.log(req.body);

        const joiSchema = Joi.object({
            email: Joi.string().email().required(),
        });

        const { value, error } = joiSchema.validate(req.body);

        if (error) {
            console.log(error.details);
            return res.status(400).json({
                message: error.details
            });
        }

        const user = await User.findOne({ email: value.email });

        if (!user) {
            return res.status(400).json({
                message: "Invalid Credentials. Please check your email."
            });
        }

        const token = jwt.sign(
            {
                userId: user._id,
                email: user.email,
                role: user.role
            },
            process.env.JWT_SECRET,
            { expiresIn: '3h' }
        );

        return res.status(200).json({
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                regdNo: user.regdNo,
                role: user.role,
                assignedQuizId: user.assignedQuizId,
                quizStatus: user.quizStatus,
            },
            token,
        });
    }
}

const authController = new AuthController();
export default authController;