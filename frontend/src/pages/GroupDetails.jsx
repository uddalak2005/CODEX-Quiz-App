import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import codexLogo from "../assets/codex-logo.png";

// ── CSV parser (no external dep) ──────────────────────────────────────────────
function parseCSV(text) {
    const lines = text.trim().split(/\r?\n/).filter(l => l.trim());
    if (lines.length < 2) return { data: [], error: "File must have a header row and at least one data row." };

    const raw = lines[0].split(",").map(h => h.trim().replace(/^["']|["']$/g, "").toLowerCase());
    // Accept common variations of the regdNo header
    const headers = raw.map(h => {
        if (["reg no", "reg. no", "regd no", "regd. no", "regdno", "regd_no",
            "registration number", "reg number", "regno"].includes(h)) return "regdNo";
        return h;
    });

    const required = ["name", "regdno", "email"];
    const missing = required.filter(r => !headers.includes(r === "regdno" ? "regdNo" : r));
    if (missing.length) return { data: [], error: `Missing columns: ${missing.join(", ")}. Required: name, regdNo, email` };

    const data = lines.slice(1).map(line => {
        const vals = line.split(",").map(v => v.trim().replace(/^["']|["']$/g, ""));
        return headers.reduce((obj, h, i) => { 
            if (["name", "regdNo", "email"].includes(h)) {
                obj[h] = vals[i] || ""; 
            }
            return obj; 
        }, {});
    }).filter(r => r.name || r.regdNo || r.email);

    return { data, error: null };
}

function downloadTemplate() {
    const csv = "name,regdNo,email\nJohn Doe,21CS001,john@example.com\nJane Smith,21CS002,jane@example.com";
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "participants_template.csv";
    a.click();
    URL.revokeObjectURL(url);
}

const STATUS_COLORS = {
    completed: "bg-green-100 text-green-700",
    started: "bg-yellow-100 text-yellow-700",
    not_started: "bg-gray-100 text-gray-500",
};

export default function GroupDetails() {
    const { groupId } = useParams();
    const navigate = useNavigate();
    const token = localStorage.getItem("adminToken");
    const fileRef = useRef(null);

    const [group, setGroup] = useState(null);
    const [loading, setLoading] = useState(true);
    const [manualRows, setManualRows] = useState([{ name: "", regdNo: "", email: "" }]);
    const [submitting, setSubmitting] = useState(false);
    const [csvPreview, setCsvPreview] = useState([]);
    const [csvError, setCsvError] = useState("");
    const [failedEntries, setFailedEntries] = useState([]);
    const [importMode, setImportMode] = useState("manual"); // "manual" | "csv"
    const [dragOver, setDragOver] = useState(false);

    useEffect(() => { document.title = "Admin | Group Details"; fetchGroup(); }, []);

    async function fetchGroup() {
        try {
            const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/admin/groups/${groupId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setGroup(res.data.group);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    }

    // ── Manual entry ──────────────────────────────────────────────────────────
    function updateRow(i, field, val) {
        setManualRows(prev => { const r = [...prev]; r[i][field] = val; return r; });
    }
    function addRow() { setManualRows(prev => [...prev, { name: "", regdNo: "", email: "" }]); }
    function removeRow(i) { setManualRows(prev => prev.filter((_, idx) => idx !== i)); }

    async function submitUsers(users) {
        if (!users.length) return;
        setSubmitting(true);
        setFailedEntries([]);
        try {
            const res = await axios.post(
                `${import.meta.env.VITE_BACKEND_URL}/admin/groups/${groupId}/addUsers`,
                { users },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (failed?.length) {
                setFailedEntries(failed);
                toast.warning(`⚠️ ${failed.length} entries failed. Check the download option.`);
            } else {
                toast.success(`✅ ${created.length} new accounts created.`);
            }
            
            setManualRows([{ name: "", regdNo: "", email: "" }]);
            setCsvPreview([]);
            fetchGroup();
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to add users.");
        } finally { setSubmitting(false); }
    }

    function downloadFailedEntries() {
        if (!failedEntries.length) return;
        const headers = "name,regdNo,email,error_reason\n";
        const rows = failedEntries.map(f => {
            const d = f.data;
            return `"${d.name || ""}","${d.regdNo || ""}","${d.email || ""}","${f.reason}"`;
        }).join("\n");
        
        const blob = new Blob([headers + rows], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `failed_entries_${new Date().getTime()}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    }

    // ── CSV handling ──────────────────────────────────────────────────────────
    function handleFile(file) {
        if (!file) return;
        if (!file.name.endsWith(".csv")) { setCsvError("Only .csv files are supported. Export your Excel sheet as CSV first."); return; }
        const reader = new FileReader();
        reader.onload = e => {
            const { data, error } = parseCSV(e.target.result);
            if (error) { setCsvError(error); setCsvPreview([]); }
            else { setCsvError(""); setCsvPreview(data); }
        };
        reader.readAsText(file);
    }

    function handleDrop(e) {
        e.preventDefault(); setDragOver(false);
        handleFile(e.dataTransfer.files[0]);
    }

    async function handleRemoveMember(userId) {
        if (!window.confirm("Remove this member from the group?")) return;
        try {
            await axios.delete(
                `${import.meta.env.VITE_BACKEND_URL}/admin/groups/${groupId}/users/${userId}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success("Member removed from group.");
            setGroup(prev => ({ ...prev, members: prev.members.filter(m => m._id !== userId) }));
        } catch (err) { toast.error(err.response?.data?.message || "Failed to remove member."); }
    }

    if (loading) return <div className="h-screen flex justify-center items-center"><div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>;
    if (!group) return <div className="p-10 text-gray-500">Group not found.</div>;

    const validManual = manualRows.filter(r => r.name.trim() && r.regdNo.trim() && r.email.trim());

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="w-full flex justify-between items-center p-6 bg-white border-b border-gray-200">
                <img src={codexLogo} alt="CODEX" className="h-8 md:h-10" />
                <button onClick={() => navigate("/admin/groups")} className="text-sm text-gray-500 hover:text-gray-800">
                    ← All Groups
                </button>
            </div>

            <div className="max-w-5xl mx-auto px-6 py-8 space-y-10">
                {/* Group header */}
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">{group.name}</h1>
                    {group.description && <p className="text-sm text-gray-500 mt-1">{group.description}</p>}
                    <p className="text-sm text-gray-400 mt-1">{group.members.length} members</p>
                </div>

                {/* ── Add Members Section ──────────────────────────────────── */}
                <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">Add Members</h2>

                    {/* Mode toggle */}
                    <div className="flex gap-2 mb-6">
                        {["manual", "csv"].map(mode => (
                            <button key={mode} onClick={() => setImportMode(mode)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${importMode === mode
                                    ? "bg-blue-700 text-white"
                                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                                {mode === "manual" ? "✏️ Manual Entry" : "📄 Import CSV"}
                            </button>
                        ))}
                    </div>

                    {failedEntries.length > 0 && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <span className="text-xl">⚠️</span>
                                <div>
                                    <p className="text-sm font-bold text-red-800">{failedEntries.length} entries failed to import.</p>
                                    <p className="text-xs text-red-600">This usually happens due to invalid emails or duplicate registration numbers.</p>
                                </div>
                            </div>
                            <button onClick={downloadFailedEntries} className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-xs font-bold transition">
                                ↓ Download Failed (.csv)
                            </button>
                        </div>
                    )}

                    {importMode === "manual" ? (
                        <div className="space-y-3">
                            {manualRows.map((row, i) => (
                                <div key={i} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-3 items-center">
                                    <input placeholder="Full Name" value={row.name}
                                        onChange={e => updateRow(i, "name", e.target.value)}
                                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                                    <input placeholder="Reg. No / ID" value={row.regdNo}
                                        onChange={e => updateRow(i, "regdNo", e.target.value)}
                                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                                    <input placeholder="Email" type="email" value={row.email}
                                        onChange={e => updateRow(i, "email", e.target.value)}
                                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                                    <button onClick={() => removeRow(i)} disabled={manualRows.length === 1}
                                        className="text-gray-300 hover:text-red-500 disabled:opacity-30 text-lg">✕</button>
                                </div>
                            ))}
                            <div className="flex gap-3 pt-2">
                                <button onClick={addRow}
                                    className="text-sm text-blue-600 hover:underline">+ Add another row</button>
                                <button onClick={() => submitUsers(validManual)} disabled={submitting || !validManual.length}
                                    className="ml-auto px-5 py-2 bg-blue-700 text-white rounded-lg text-sm hover:bg-blue-800 disabled:opacity-60">
                                    {submitting ? "Adding..." : `Add ${validManual.length || ""} Member${validManual.length !== 1 ? "s" : ""}`}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 mb-2">
                                <p className="text-sm text-gray-600">Expected columns: <code className="bg-gray-100 px-1 rounded text-xs">name, regdNo, email</code></p>
                                <button onClick={downloadTemplate}
                                    className="text-xs text-blue-600 hover:underline ml-auto">↓ Download Template</button>
                            </div>

                            {/* Drop zone */}
                            <div
                                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                                onDragLeave={() => setDragOver(false)}
                                onDrop={handleDrop}
                                onClick={() => fileRef.current?.click()}
                                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition ${dragOver ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400"}`}>
                                <p className="text-gray-500 text-sm">Drag & drop a CSV file here, or <span className="text-blue-600 underline">browse</span></p>
                                <p className="text-xs text-gray-400 mt-1">Only .csv files supported</p>
                                <input ref={fileRef} type="file" accept=".csv" className="hidden"
                                    onChange={e => handleFile(e.target.files[0])} />
                            </div>

                            {csvError && <p className="text-red-500 text-sm">{csvError}</p>}

                            {csvPreview.length > 0 && (
                                <div>
                                    <p className="text-sm text-gray-600 mb-2">{csvPreview.length} rows parsed — preview:</p>
                                    <div className="overflow-x-auto border border-gray-200 rounded-xl max-h-48">
                                        <table className="min-w-full text-xs divide-y divide-gray-100">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    {["name", "regdNo", "email"].map(h =>
                                                        <th key={h} className="px-3 py-2 text-left text-gray-600 font-medium">{h}</th>)}
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-50">
                                                {csvPreview.slice(0, 5).map((row, i) => (
                                                    <tr key={i}>
                                                        <td className="px-3 py-2">{row.name}</td>
                                                        <td className="px-3 py-2">{row.regdNo}</td>
                                                        <td className="px-3 py-2">{row.email}</td>
                                                    </tr>
                                                ))}
                                                {csvPreview.length > 5 && (
                                                    <tr><td colSpan={3} className="px-3 py-2 text-gray-400 text-center">...and {csvPreview.length - 5} more</td></tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                    <button onClick={() => submitUsers(csvPreview)} disabled={submitting}
                                        className="mt-3 px-5 py-2 bg-blue-700 text-white rounded-lg text-sm hover:bg-blue-800 disabled:opacity-60">
                                        {submitting ? "Importing..." : `Import ${csvPreview.length} Members`}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* ── Members Table ──────────────────────────────────────────── */}
                <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100">
                        <h2 className="text-lg font-semibold text-gray-800">Members ({group.members.length})</h2>
                    </div>
                    {group.members.length === 0 ? (
                        <div className="py-12 text-center text-gray-400">No members yet. Add some above.</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-100 text-sm">
                                <thead className="bg-gray-50">
                                    <tr>
                                        {["#", "Name", "Reg. No", "Email", "Quiz Status", "Quiz Assigned", ""].map(h =>
                                            <th key={h} className="px-4 py-3 text-left font-medium text-gray-600">{h}</th>)}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {group.members.map((m, i) => (
                                        <tr key={m._id} className="hover:bg-gray-50">
                                            <td className="px-4 py-3 text-gray-400">{i + 1}</td>
                                            <td className="px-4 py-3 font-medium text-gray-800">{m.name}</td>
                                            <td className="px-4 py-3 text-gray-600">{m.regdNo}</td>
                                            <td className="px-4 py-3 text-gray-600">{m.email}</td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[m.quizStatus] || STATUS_COLORS.not_started}`}>
                                                    {m.quizStatus || "not_started"}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                {m.assignedQuizId
                                                    ? <span className="text-xs text-green-600 font-medium">✓ Assigned</span>
                                                    : <span className="text-xs text-gray-400">None</span>}
                                            </td>
                                            <td className="px-4 py-3">
                                                <button onClick={() => handleRemoveMember(m._id)}
                                                    className="text-xs text-red-400 hover:text-red-600">Remove</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
