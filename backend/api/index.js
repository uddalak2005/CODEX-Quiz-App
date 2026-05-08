import app from "../app.js";
import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

// VERCEL FIX: Cache the database connection across serverless function invocations
// Global variables are retained across warm lambdas in Vercel.
let isConnected = false;

const connectToDatabase = async () => {
    if (isConnected) {
        return;
    }
    try {
        const db = await mongoose.connect(MONGO_URI);
        isConnected = db.connections[0].readyState;
        console.log("Connected to MongoDB via Serverless Function");
    } catch (err) {
        console.error("Error connecting to MongoDB:", err.message);
    }
};

// VERCEL FIX: Middleware to ensure DB connection is established before routing
app.use(async (req, res, next) => {
    await connectToDatabase();
    next();
});

// VERCEL FIX: Export the Express app as a default module instead of using app.listen()
export default app;
