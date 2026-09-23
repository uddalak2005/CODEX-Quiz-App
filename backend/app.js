import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import authRouter from "./routes/auth.routes.js";
import adminRouter from "./routes/admin.routes.js";
import quizRouter from "./routes/quiz.routes.js";

const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN || "*"
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/auth", authRouter);
app.use("/admin", adminRouter);
app.use("/quiz", quizRouter);

app.get("/", (req, res) => {
    res.json({
        status: "ok",
        message: "CODEX Backend",
        timestamp: new Date().toISOString()
    });
});

app.get("/health", (req, res) => {
    const dbState = mongoose.connection?.readyState;
    const healthy = dbState === 1;

    return res.status(healthy ? 200 : 503).json({
        status: healthy ? "ok" : "degraded",
        database: healthy ? "connected" : "disconnected",
        dbState,
        timestamp: new Date().toISOString()
    });
});

export default app;