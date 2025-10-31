import { createContext, useContext, useState } from "react";
import axios from "axios";


const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(() => localStorage.getItem("token"));
    const [user, setUser] = useState(() => localStorage.getItem("user"));

    async function login(email, regdNo) {
        try {
            const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/auth/login`,
                {
                    email,
                    regdNo
                }
            );
            const data = res.data;
            if (data.token) {
                setToken(data.token);
                localStorage.setItem("token", data.token);
                localStorage.setItem("userName", data.user.name);
            }
            console.log(data);
            setUser(data.user);

        } catch (err) {
            console.log(err.message);

            if (err.response) {
                console.log("Backend responded with:", err.response.data);
                return { success: false, message: err.response.data.message };
            } else {
                console.log("Network or server error");
                return { success: false, message: "Server error. Please try again later." };
            }
        }
    }

    function logout() {
        setToken(null);
        setUser(null);
        localStorage.removeItem("token");
    }

    return (
        <AuthContext.Provider value={{ user, token, login, logout, isAuthenticate: token ? true : false }}>
            {children}
        </AuthContext.Provider>
    )
};

export const useAuth = () => useContext(AuthContext);