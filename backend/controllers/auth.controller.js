import User from "../models/Users.model.js";
import Joi from "joi";
import jwt from "jsonwebtoken";

class AuthController {

    async registerUser(req, res) {
        try {
            const joiSchema = Joi.object({
                name: Joi.string().required(),
                regdNo: Joi.string().required(),
                email: Joi.string().email().required(),
                year: Joi.number().required()
            });

            const { value, error } = joiSchema.validate(req.body);
            if (error) {
                return res.status(400).json({ message: error.details });
            }

            const newUser = await User.create(value);
            return res.status(201).json({ message: "New User Created Successfully", user: newUser });
        } catch (err) {
            if (err.code === 11000) {
                // MongoDB duplicate key error
                return res.status(400).json({
                    message: "User already exists",
                    field: err.keyValue
                });
            }

            console.error("❌ Unexpected error:", err);
            return res.status(500).json({ message: "Internal Server Error" });
        }
    }



    async loginUser(req, res) {
        console.log(req.body);
        const joiSchema = Joi.object({
            regdNo: Joi.string().required(),
            email: Joi.string().email().required(),
            year: Joi.number().valid(1, 2).required()
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
            email: value.email,
            year: value.year
        })

        if (!user) {
            return res.status(400, "User Not Found").json({
                message: "Invalid Credentials Please Check."
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