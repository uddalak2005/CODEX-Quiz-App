import express from "express";
import authRouter from "./routes/auth.routes.js";
import cors from "cors";

const app = express();

app.use(cors([{
    origin: "*"
}]));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/auth", authRouter);

export default app;