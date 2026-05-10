import adminController from "../controllers/admin.controller.js";
import verifyJWT from "../middleware/auth.middleware.js";
import verifyAdmin from "../middleware/admin.middleware.js";
import express from "express";

const router = express.Router();

// Auth
router.post("/login", adminController.adminLogin);

// Quiz CRUD
router.post("/createQuiz", verifyJWT, verifyAdmin, adminController.createQuiz);
router.get("/getQuiz/:quizId", verifyJWT, verifyAdmin, adminController.getQuiz);
router.delete("/deleteQuiz/:quizId", verifyJWT, verifyAdmin, adminController.deleteQuiz);
router.put("/updateQuiz/:quizId", verifyJWT, verifyAdmin, adminController.updateQuiz);
router.get("/getAllData", verifyJWT, verifyAdmin, adminController.getAllData);

// Participant management
router.post("/createUser", verifyJWT, verifyAdmin, adminController.createUser);
router.post("/bulkCreateUsers", verifyJWT, verifyAdmin, adminController.bulkCreateUsers);
router.delete("/quiz/:quizId/participant/:userId", verifyJWT, verifyAdmin, adminController.removeParticipant);

export default router;
