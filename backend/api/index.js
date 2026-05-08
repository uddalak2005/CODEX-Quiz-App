import app from "../app.js";
import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

// Cache connection globally across warm requests
let cached = global.mongoose || { conn: null, promise: null };
global.mongoose = cached;

const connectToDatabase = async () => {
    if (cached.conn) return cached.conn; // ← reuse if already connected

    console.log("MONGO_URI exists:", !!process.env.MONGO_URI); // ← add this
    console.log("MONGO_URI value:", process.env.MONGO_URI);

    if (!cached.promise) {
        cached.promise = mongoose.connect(MONGO_URI, {
            bufferCommands: false,
            serverSelectionTimeoutMS: 10000,
            socketTimeoutMS: 45000,
            maxPoolSize: 10,
        });
    }

    try {
        cached.conn = await cached.promise;
        console.log("Connected to MongoDB");
        return cached.conn;
    } catch (err) {
        cached.promise = null; // ← reset so next request retries
        throw err;
    }
};

export default async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

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