import authController from "../controllers/auth.controller.js";
import express from "express";

const router = express.Router();

router.post("/registerUser", authController.registerUser);
router.post("/login", authController.loginUser);

export default router;