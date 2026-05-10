import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import codexLogo from "../assets/codex-logo.png";

export default function Groups() {
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [form, setForm] = useState({ name: "", description: "" });
    const [creating, setCreating] = useState(false);
    const token = localStorage.getItem("adminToken");
    const navigate = useNavigate();

    useEffect(() => { document.title = "Admin | Groups"; }, []);

    useEffect(() => {
        fetchGroups();
    }, []);

    async function fetchGroups() {
        try {
            const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/admin/groups`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setGroups(res.data.groups || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    async function handleCreate(e) {
        e.preventDefault();
        setCreating(true);
        try {
            await axios.post(`${import.meta.env.VITE_BACKEND_URL}/admin/groups`, form, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setForm({ name: "", description: "" });
            setShowCreate(false);
            toast.success("✅ Group created successfully!");
            fetchGroups();
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to create group.");
        } finally {
            setCreating(false);
        }
    }

    async function handleDelete(groupId, e) {
        e.stopPropagation();
        const confirmed = window.confirm(
            "⚠️ DANGER: DELETE GROUP?\n\nThis will permanently delete:\n- The Group itself\n- ALL PARTICIPANTS in this group\n- All their associated data\n\nThis action CANNOT be undone. Are you absolutely sure?"
        );
        if (!confirmed) return;
        try {
            await axios.delete(`${import.meta.env.VITE_BACKEND_URL}/admin/groups/${groupId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success("Group deleted.");
            setGroups(prev => prev.filter(g => g._id !== groupId));
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to delete group.");
        }
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="w-full flex justify-between items-center p-6 bg-white border-b border-gray-200">
                <img src={codexLogo} alt="CODEX Logo" className="h-8 md:h-10" />
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate("/admin/dashboard")}
                        className="text-sm text-gray-600 hover:text-gray-900">← Dashboard</button>
                    <button onClick={() => setShowCreate(true)}
                        className="px-5 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800 text-sm font-medium">
                        + New Group
                    </button>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-6 py-8">
                <h1 className="text-2xl font-bold text-gray-900 mb-1">Participant Groups</h1>
                <p className="text-sm text-gray-500 mb-8">Create groups of participants and assign them to quizzes.</p>

                {/* Create Group Modal */}
                {showCreate && (
                    <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
                        <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-xl">
                            <h2 className="text-xl font-semibold mb-5 text-gray-800">Create New Group</h2>
                            <form onSubmit={handleCreate} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Group Name *</label>
                                    <input type="text" required value={form.name}
                                        onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="e.g. CS 2nd Year Batch A" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                    <input type="text" value={form.description}
                                        onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                        placeholder="Optional description" />
                                </div>
                                <div className="flex justify-end gap-3 pt-2">
                                    <button type="button" onClick={() => setShowCreate(false)}
                                        className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200">
                                        Cancel
                                    </button>
                                    <button type="submit" disabled={creating}
                                        className="px-5 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800 disabled:opacity-60">
                                        {creating ? "Creating..." : "Create Group"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Groups Grid */}
                {loading ? (
                    <div className="flex justify-center items-center h-40">
                        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : groups.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-60 border-2 border-dashed border-gray-200 rounded-2xl">
                        <p className="text-gray-400 text-lg mb-2">No groups yet</p>
                        <button onClick={() => setShowCreate(true)}
                            className="text-blue-600 text-sm hover:underline">Create your first group →</button>
                    </div>
                ) : (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {groups.map(group => (
                            <div key={group._id}
                                onClick={() => navigate(`/admin/groups/${group._id}`)}
                                className="bg-white border border-gray-200 rounded-2xl p-5 hover:shadow-md hover:border-blue-200 transition cursor-pointer group">
                                <div className="flex justify-between items-start mb-3">
                                    <h3 className="font-semibold text-gray-900 group-hover:text-blue-700 transition leading-tight">
                                        {group.name}
                                    </h3>
                                    <button 
                                        onClick={e => handleDelete(group._id, e)}
                                        className="p-1.5 bg-red-50 hover:bg-red-600 text-red-400 hover:text-white rounded-lg transition-all duration-200 border border-red-100"
                                        title="Delete Group"
                                    >
                                        🗑️
                                    </button>
                                </div>
                                {group.description && (
                                    <p className="text-xs text-gray-500 mb-3 line-clamp-2">{group.description}</p>
                                )}
                                <div className="flex items-center justify-between mt-4">
                                    <span className="inline-flex items-center gap-1 text-sm text-gray-600">
                                        <span>👥</span>
                                        <span className="font-medium">{group.members?.length ?? 0}</span> members
                                    </span>
                                    <span className="text-xs text-gray-400">
                                        {new Date(group.createdOn).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
