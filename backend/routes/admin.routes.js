import adminController from "../controllers/admin.controller.js";
import verifyJWT from "../middleware/auth.middleware.js";
import verifyAdmin from "../middleware/admin.middleware.js";
import express from "express";

const router = express.Router();
const auth = [verifyJWT, verifyAdmin];

// ── Admin auth ────────────────────────────────────────────────────────────────
router.post("/login", adminController.adminLogin);

// ── Quiz CRUD ─────────────────────────────────────────────────────────────────
router.get("/getAllData", ...auth, adminController.getAllData);
router.post("/createQuiz", ...auth, adminController.createQuiz);
router.get("/getQuiz/:quizId", ...auth, adminController.getQuiz);
router.put("/updateQuiz/:quizId", ...auth, adminController.updateQuiz);
router.delete("/deleteQuiz/:quizId", ...auth, adminController.deleteQuiz);

// ── Quiz-Group assignment ─────────────────────────────────────────────────────
router.put("/quiz/:quizId/groups", ...auth, (req, res) => adminController.assignGroupsToQuiz(req, res));

// ── Group CRUD ────────────────────────────────────────────────────────────────
router.get("/groups", ...auth, (req, res) => adminController.getAllGroups(req, res));
router.post("/groups", ...auth, (req, res) => adminController.createGroup(req, res));
router.get("/groups/:groupId", ...auth, (req, res) => adminController.getGroup(req, res));
router.delete("/groups/:groupId", ...auth, (req, res) => adminController.deleteGroup(req, res));

// ── Group member management ───────────────────────────────────────────────────
router.post("/groups/:groupId/addUsers", ...auth, (req, res) => adminController.addUsersToGroup(req, res));
router.delete("/groups/:groupId/users/:userId", ...auth, (req, res) => adminController.removeUserFromGroup(req, res));

export default router;
