import AdminLogin from '../components/AdminSignIn.jsx'
import { useEffect } from 'react';

const AdminPage = () => {

    useEffect(() => {
        document.title = "Admin | Login";
    }, []);


    return (
        <AdminLogin />
    )
}

export default AdminPage