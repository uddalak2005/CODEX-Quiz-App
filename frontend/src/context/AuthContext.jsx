import { createContext, useContext, useState } from "react";
import axios from "axios";
import { useEffect } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(() => localStorage.getItem("token"));
    const [user, setUser] = useState(() => {
        const stored = localStorage.getItem("user");
        return stored ? JSON.parse(stored) : null;
    });
    const [adminToken, setAdminToken] = useState(localStorage.getItem("adminToken"));

    useEffect(() => {
        if (adminToken) localStorage.setItem("adminToken", adminToken);
        else localStorage.removeItem("adminToken");
    }, [adminToken]);

    useEffect(() => {
        if (token) localStorage.setItem("token", token);
        else localStorage.removeItem("token");
    }, [token]);

    useEffect(() => {
        if (user) localStorage.setItem("user", JSON.stringify(user));
        else localStorage.removeItem("user");
    }, [user]);

    /**
     * Login with email only — backend identifies the user and returns assignedQuizId.
     * Returns { success: true, assignedQuizId } or { success: false, message }.
     */
    async function login(email) {
        try {
            const res = await axios.post(
                `${import.meta.env.VITE_BACKEND_URL}/auth/login`,
                { email }
            );

            const data = res.data;
            if (data.token) {
                setToken(data.token);
                localStorage.setItem("token", data.token);
                localStorage.setItem("userName", data.user.name);
            }

            setUser(data.user);
            return { success: true, assignedQuizId: data.user.assignedQuizId };

        } catch (err) {
            if (err.response) {
                return { success: false, message: err.response.data.message };
            }
            return { success: false, message: "Server error. Please try again later." };
        }
    }

    async function adminLogin(email, password) {
        try {
            const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/admin/login`, {
                email,
                password
            });
            const data = res.data;
            if (data.token) {
                setAdminToken(data.token);
                localStorage.setItem("adminToken", data.token);
                localStorage.setItem("userName", data.user.name);
            }
            setUser(data.user);
        } catch (err) {
            if (err.response) {
                return { success: false, message: err.response.data.message };
            }
            return { success: false, message: "Server error. Please try again later." };
        }
    }

    function logout() {
        setToken(null);
        setUser(null);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("userName");
        localStorage.removeItem("quizData");
        localStorage.removeItem("quizAnswers");
        localStorage.removeItem("quizCurrentQues");
    }

    return (
        <AuthContext.Provider value={{
            user,
            token,
            login,
            adminLogin,
            logout,
            isAuthenticate: !!token
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);