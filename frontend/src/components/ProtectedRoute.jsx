import { Navigate } from "react-router-dom";

export function UserProtectedRoute({ children }) {
    const token = localStorage.getItem("token");
    if (!token) return <Navigate to="/" replace />;
    return children;
}

export function AdminProtectedRoute({ children }) {
    const token = localStorage.getItem("adminToken");
    if (!token) return <Navigate to="/admin/logIn" replace />;
    return children;
}
