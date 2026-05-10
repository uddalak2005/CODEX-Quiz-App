import AdminLogin from '../components/AdminSignIn.jsx'
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AdminPage = () => {
    const navigate = useNavigate();

    useEffect(() => {
        if (localStorage.getItem("adminToken")) {
            navigate("/admin/dashboard");
        }
        document.title = "Admin | Login";
    }, [navigate]);


    return (
        <AdminLogin />
    )
}

export default AdminPage