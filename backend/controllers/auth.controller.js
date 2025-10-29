import User from "../models/Users.model.js";
import Joi from "joi";
import jwt from "jsonwebtoken";

class AuthController {

    async registerUser(req, res) {
        const joiSchema = Joi.object({
            name: Joi.string().required(),
            regdNo: Joi.string().required(),
            email: Joi.string().email().required(),
            year: Joi.number().required()
        })

        const { value, error } = joiSchema.validate(req.body);

        console.log(value);

        if (error) {
            console.log(error.details);
            return res.status(400).json({
                message: error.details
            });
        }

        const newUser = await User.create({
            name: value.name,
            regdNo: value.regdNo,
            email: value.email,
            year: value.year
        });

        res.status(201).json({
            message: "New User Created Successfully"
        });
    }

    async loginUser(req, res) {
        console.log(req.body);
        const joiSchema = Joi.object({
            regdNo: Joi.string().required(),
            email: Joi.string().required(),
        });

        const { value, error } = joiSchema.validate(req.body);

        if (error) {
            console.log(error.details);
            return res.status(400).json({
                message: error.details
            });
        }

        console.log(value);

        const user = await User.findOne({
            regdNo: value.regdNo,
            email: value.email
        })

        if (!user) {
            return res.status(400, "User Not Found").json({
                message: "Invalid registration number or password"
            });
        }

        const token = jwt.sign({
            userId: user._id,
            email: user.email,
            role: user.role
        }, process.env.JWT_SECRET, { expiresIn: '1h' });

        return res.status(200).json({
            user,
            token: token,
        })
    }
}

const authController = new AuthController();
export default authController;