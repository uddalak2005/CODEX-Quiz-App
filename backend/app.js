import express from "express";
import cors from "cors";
import authRouter from "./routes/auth.routes.js";
import adminRouter from "./routes/admin.routes.js";
import quizRouter from "./routes/quiz.routes.js";

const app = express();

app.use(cors([{
    origin: "*"
}]));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/auth", authRouter);
app.use("/admin", adminRouter);
app.use("/quiz", quizRouter);



export default app;