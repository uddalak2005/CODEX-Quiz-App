import app from "./app.js";
import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI)
    .then(() => {
        console.log("Connected to MONGODB");
    })
    .catch((err) => {
        console.log("Error connecting to MongoDB : ", err.message);
    });

app.listen(PORT, '0.0.0.0', () => {
    console.log(`app is listening on port ${PORT}`);
})