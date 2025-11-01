import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import codexLogo from "../assets/codex-logo.png";

export default function ErrorPage() {
    const navigate = useNavigate();

    useEffect(() => {
        document.title = "404 | Page Not Found";
    }, []);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 text-center px-4">
            <img src={codexLogo} alt="Codex Logo" className="h-12 mb-6" />
            <h1 className="text-5xl font-extrabold text-gray-800 mb-3">404</h1>
            <p className="text-lg text-gray-600 mb-6">
                Oops! The page you’re looking for doesn’t exist.
            </p>
            <button
                onClick={() => navigate("/")}
                className="bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg hover:bg-blue-800 transition-all duration-200"
            >
                Go Home
            </button>
        </div>
    );
}
