import Question from "../models/Questions.model.js";
import Quiz from "../models/Quizes.model.js";
import User from "../models/Users.model.js";
import Group from "../models/Group.model.js";
import Result from "../models/Result.model.js";
import jwt from "jsonwebtoken";
import Joi from "joi";

class AdminController {

    // ── AUTH ──────────────────────────────────────────────────────────────────
    async adminLogin(req, res) {
        try {
            const { email, password } = req.body;
            if (!email || !password) return res.status(400).json({ message: "Email and password are required." });

            const user = await User.findOne({ email, password });
            if (!user || user.role !== "admin") return res.status(400).json({ message: "Invalid email or password." });

            const token = jwt.sign(
                { userId: user._id, email: user.email, role: "admin" },
                process.env.JWT_SECRET,
                { expiresIn: "8h" }
            );
            return res.status(200).json({ user, token });
        } catch (err) {
            return res.status(500).json({ message: err.message });
        }
    }

    // ── GROUPS ────────────────────────────────────────────────────────────────

    async createGroup(req, res) {
        const schema = Joi.object({
            name: Joi.string().required(),
            description: Joi.string().allow("").optional(),
        });
        const { value, error } = schema.validate(req.body);
        if (error) return res.status(400).json({ message: error.details[0].message });

        try {
            const group = await Group.create({
                name: value.name,
                description: value.description || "",
                createdBy: req.user.userId,
            });
            return res.status(201).json({ message: "Group created", group });
        } catch (err) {
            return res.status(500).json({ message: err.message });
        }
    }

    async getAllGroups(req, res) {
        try {
            const groups = await Group.find({ createdBy: req.user.userId })
                .populate("members", "name email regdNo quizStatus assignedQuizId")
                .sort({ createdOn: -1 });
            return res.status(200).json({ groups });
        } catch (err) {
            return res.status(500).json({ message: err.message });
        }
    }

    async getGroup(req, res) {
        try {
            const group = await Group.findOne({ _id: req.params.groupId, createdBy: req.user.userId })
                .populate("members", "name email regdNo quizStatus assignedQuizId");
            if (!group) return res.status(404).json({ message: "Group not found." });
            return res.status(200).json({ group });
        } catch (err) {
            return res.status(500).json({ message: err.message });
        }
    }

    async deleteGroup(req, res) {
        try {
            const group = await Group.findOneAndDelete({ _id: req.params.groupId, createdBy: req.user.userId });
            if (!group) return res.status(404).json({ message: "Group not found." });

            // Remove this group from any quiz that had it assigned
            const quizzes = await Quiz.find({ assignedGroups: group._id });
            for (const quiz of quizzes) {
                quiz.assignedGroups = quiz.assignedGroups.filter(g => g.toString() !== group._id.toString());
                await quiz.save();
            }
            // Cascade delete: Remove all participants belonging to this group
            await User.deleteMany({ _id: { $in: group.members } });

            return res.status(200).json({ message: "Group and its members deleted successfully." });
        } catch (err) {
            return res.status(500).json({ message: err.message });
        }
    }

    // Bulk add users to a group — creates accounts for new users, skips existing ones
    async addUsersToGroup(req, res) {
        const userSchema = Joi.object({
            name: Joi.string().required(),
            regdNo: Joi.string().required(),
            email: Joi.string().email().required(),
        }).unknown(true);

        try {
            const group = await Group.findOne({ _id: req.params.groupId, createdBy: req.user.userId });
            if (!group) return res.status(404).json({ message: "Group not found." });

            const linkedQuiz = await Quiz.findOne({ assignedGroups: group._id });
            const results = { created: [], alreadyExisted: [], failed: [] };

            const users = req.body.users;
            if (!Array.isArray(users)) return res.status(400).json({ message: "Users must be an array." });

            for (const u of users) {
                const { error, value: validatedUser } = userSchema.validate(u, { stripUnknown: true });
                
                if (error) {
                    results.failed.push({ 
                        data: u, 
                        reason: error.details[0].message 
                    });
                    continue;
                }

                const userData = validatedUser;

                try {
                    let user = await User.findOne({ $or: [{ email: userData.email }, { regdNo: userData.regdNo }] });
                    if (!user) {
                        user = await User.create({
                            name: userData.name, 
                            regdNo: userData.regdNo, 
                            email: userData.email, 
                            role: "user",
                            assignedQuizId: linkedQuiz?._id || null,
                        });
                        results.created.push(userData.regdNo);
                    } else {
                        if (linkedQuiz && !user.assignedQuizId) {
                            await User.updateOne({ _id: user._id }, { $set: { assignedQuizId: linkedQuiz._id } });
                        }
                        results.alreadyExisted.push(userData.regdNo);
                    }
                    if (!group.members.map(m => m.toString()).includes(user._id.toString())) {
                        group.members.push(user._id);
                    }
                } catch (err) {
                    results.failed.push({ 
                        data: u, 
                        reason: err.code === 11000 ? "Duplicate entry (Email or RegdNo)" : err.message 
                    });
                }
            }

            await group.save();
            return res.status(200).json({ message: "Processing complete.", ...results });
        } catch (err) {
            return res.status(500).json({ message: err.message });
        }
    }

    async removeUserFromGroup(req, res) {
        try {
            const { groupId, userId } = req.params;
            const group = await Group.findOneAndUpdate(
                { _id: groupId, createdBy: req.user.userId },
                { $pull: { members: userId } },
                { new: true }
            );
            if (!group) return res.status(404).json({ message: "Group not found." });

            // If this group was the source of their quiz assignment, clear it
            const linkedQuiz = await Quiz.findOne({ assignedGroups: groupId });
            if (linkedQuiz) {
                await User.updateOne({ _id: userId, assignedQuizId: linkedQuiz._id }, { $set: { assignedQuizId: null } });
            }
            return res.status(200).json({ message: "User removed from group." });
        } catch (err) {
            return res.status(500).json({ message: err.message });
        }
    }

    // ── QUIZ ──────────────────────────────────────────────────────────────────

    async createQuiz(req, res) {
        const optionSchema = Joi.object({
            nameString: Joi.string().allow("", null),
            image: Joi.string().allow("", null)
        }).or("nameString", "image");

        const joiSchema = Joi.object({
            name: Joi.string().required(),
            startTime: Joi.date().required(),
            endTime: Joi.date().greater(Joi.ref('startTime')).required(),
            // Groups to assign immediately on creation (optional)
            assignedGroups: Joi.array().items(Joi.string().length(24)).default([]),
            questions: Joi.array().items(Joi.object({
                quesString: Joi.string().allow("", null),
                quesImage: Joi.string().allow("", null),
                optionA: optionSchema.required(),
                optionB: optionSchema.required(),
                optionC: optionSchema.required(),
                optionD: optionSchema.required(),
                correct: Joi.string().valid("A", "B", "C", "D").required(),
                timer: Joi.number().valid(15, 30, 60, 90).required()
            })).required()
        });

        try {
            const { value, error } = joiSchema.validate(req.body);
            if (error) return res.status(400).json({ message: error.details[0].message });

            const newQuiz = await Quiz.create({
                user: req.user.userId,
                name: value.name,
                startTime: value.startTime,
                endTime: value.endTime,
                assignedGroups: [],
            });

            // Create questions
            let questionIdArray = [];
            for (const q of value.questions) {
                const newQ = await Question.create({ quizId: newQuiz._id, ...q });
                questionIdArray.push(newQ._id);
            }
            await Quiz.findByIdAndUpdate(newQuiz._id, { $set: { questions: questionIdArray } });

            // If groups were provided, assign them now
            if (value.assignedGroups.length > 0) {
                await this._assignGroupsToQuiz(newQuiz._id, value.assignedGroups, req.user.userId);
            }

            return res.status(201).json({ message: "Quiz created successfully", quizId: newQuiz._id });
        } catch (err) {
            return res.status(500).json({ message: err.message });
        }
    }

    // Internal helper — reassigns groups and syncs user assignedQuizId
    async _assignGroupsToQuiz(quizId, newGroupIds, adminUserId) {
        const quiz = await Quiz.findById(quizId);

        // Clear old assignments
        if (quiz.assignedGroups.length > 0) {
            const oldGroups = await Group.find({ _id: { $in: quiz.assignedGroups } });
            const oldMemberIds = [...new Set(oldGroups.flatMap(g => g.members.map(m => m.toString())))];
            const newGroups = await Group.find({ _id: { $in: newGroupIds }, createdBy: adminUserId });
            const newMemberIds = new Set(newGroups.flatMap(g => g.members.map(m => m.toString())));
            const toRemove = oldMemberIds.filter(id => !newMemberIds.has(id));
            if (toRemove.length > 0) {
                await User.updateMany({ _id: { $in: toRemove }, assignedQuizId: quizId }, { $set: { assignedQuizId: null } });
            }
        }

        // Set new assignments
        const groups = await Group.find({ _id: { $in: newGroupIds }, createdBy: adminUserId });
        const memberIds = [...new Set(groups.flatMap(g => g.members.map(m => m.toString())))];
        if (memberIds.length > 0) {
            await User.updateMany({ _id: { $in: memberIds } }, { $set: { assignedQuizId: quizId } });
        }

        quiz.assignedGroups = newGroupIds;
        await quiz.save();
        return memberIds.length;
    }

    // PUT /admin/quiz/:quizId/groups — update which groups are assigned to a quiz
    async assignGroupsToQuiz(req, res) {
        const schema = Joi.object({
            groupIds: Joi.array().items(Joi.string().length(24)).required(),
        });
        const { value, error } = schema.validate(req.body);
        if (error) return res.status(400).json({ message: error.details[0].message });

        try {
            const quiz = await Quiz.findOne({ _id: req.params.quizId, user: req.user.userId });
            if (!quiz) return res.status(404).json({ message: "Quiz not found." });

            const affected = await this._assignGroupsToQuiz(req.params.quizId, value.groupIds, req.user.userId);
            return res.status(200).json({ message: "Groups assigned successfully.", affectedUsers: affected });
        } catch (err) {
            return res.status(500).json({ message: err.message });
        }
    }

    async getQuiz(req, res) {
        try {
            const quizDetails = await Quiz.findById(req.params.quizId)
                .populate("user", "name email")
                .populate("questions")
                .populate("assignedGroups", "name members")
                .populate("participants", "name email regdNo");

            if (!quizDetails) return res.status(404).json({ message: "Quiz not found." });

            const participantIds = quizDetails.participants.map(p => p._id);
            const results = await Result.find({ quizId: quizDetails._id, userId: { $in: participantIds } });
            const resultMap = new Map(results.map(r => [r.userId.toString(), r]));

            const participantData = quizDetails.participants.map(p => {
                const r = resultMap.get(p._id.toString());
                return { name: p.name, email: p.email, regdNo: p.regdNo, points: r?.points || 0, duration: r?.duration || 0 };
            });

            const quizObj = quizDetails.toObject();
            quizObj.participants = participantData;
            return res.status(200).json({ quizObj });
        } catch (err) {
            return res.status(500).json({ message: err.message });
        }
    }

    async updateQuiz(req, res) {
        const optionSchema = Joi.object({
            nameString: Joi.string().allow("", null),
            image: Joi.string().allow("", null)
        }).or("nameString", "image");

        const joiSchema = Joi.object({
            name: Joi.string().required(),
            startTime: Joi.date().required(),
            endTime: Joi.date().greater(Joi.ref('startTime')).required(),
            questions: Joi.array().items(Joi.object({
                quesString: Joi.string().allow("", null),
                quesImage: Joi.string().allow("", null),
                optionA: optionSchema.required(), optionB: optionSchema.required(),
                optionC: optionSchema.required(), optionD: optionSchema.required(),
                correct: Joi.string().valid("A", "B", "C", "D").required(),
                timer: Joi.number().valid(15, 30, 60, 90).required()
            })).required()
        });

        try {
            const { value, error } = joiSchema.validate(req.body);
            if (error) return res.status(400).json({ message: error.details[0].message });

            const quiz = await Quiz.findOne({ _id: req.params.quizId });
            if (!quiz) return res.status(404).json({ message: "Quiz not found." });

            quiz.name = value.name;
            quiz.startTime = value.startTime;
            quiz.endTime = value.endTime;
            await quiz.save();

            await Question.deleteMany({ quizId: quiz._id });
            const qIds = [];
            for (const q of value.questions) {
                const nq = await Question.create({ quizId: quiz._id, ...q });
                qIds.push(nq._id);
            }
            await Quiz.findByIdAndUpdate(quiz._id, { $set: { questions: qIds } });
            return res.status(200).json({ message: "Quiz updated successfully." });
        } catch (err) {
            return res.status(500).json({ message: err.message });
        }
    }

    async deleteQuiz(req, res) {
        try {
            const quiz = await Quiz.findOne({ _id: req.params.quizId, user: req.user.userId });
            if (!quiz) return res.status(404).json({ message: "Quiz not found." });

            await Question.deleteMany({ quizId: quiz._id });
            await Result.deleteMany({ quizId: quiz._id });
            await User.updateMany({ assignedQuizId: quiz._id }, { $set: { assignedQuizId: null } });
            await Quiz.findByIdAndDelete(quiz._id);
            return res.status(200).json({ message: "Quiz deleted successfully." });
        } catch (err) {
            return res.status(500).json({ message: err.message });
        }
    }

    async getAllData(req, res) {
        try {
            const allQuizzes = await Quiz.find({ user: req.user.userId })
                .populate("assignedGroups", "name members")
                .sort({ createdOn: -1 });
            return res.status(200).json({ success: true, count: allQuizzes.length, allQuizzes });
        } catch (err) {
            return res.status(500).json({ success: false, message: err.message });
        }
    }
}

const adminController = new AdminController();
export default adminController;