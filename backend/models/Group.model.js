import mongoose from "mongoose";

const groupSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, default: "" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: "user" }],
    createdOn: { type: Date, default: Date.now }
});

const Group = mongoose.model("group", groupSchema);
export default Group;
