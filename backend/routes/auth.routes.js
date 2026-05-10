import authController from "../controllers/auth.controller.js";
import express from "express";

const router = express.Router();

// Public login — email only, returns assignedQuizId for auto-redirect
router.post("/login", authController.loginUser);

export default router;