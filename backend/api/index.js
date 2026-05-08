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
    // Explicitly set CORS headers for Serverless functions
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

    // Handle CORS preflight explicitly
    if (req.method === "OPTIONS") {
        return res.status(200).end();
    }

    try {
        await connectToDatabase();
        return app(req, res);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Database connection error" });
    }
};
