import app from "../app.js";
import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

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
        throw err;
    }
};

export default async (req, res) => {
    await connectToDatabase();
    return app(req, res);
};
