import quizController from "../controllers/quiz.controller.js";
import verifyJWT from "../middleware/auth.middleware.js";
import express from "express";

const router = express.Router();

// :quizId replaces :year — fetches the quiz assigned to this user
router.get("/getQuiz/:quizId", verifyJWT, quizController.showQuiz);
router.post("/submitQuiz/:quizId", verifyJWT, quizController.submitQuiz);

export default router;