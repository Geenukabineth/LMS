import { Outlet, Navigate } from "react-router-dom";


const ProtectedRouter = () => {
    const isAuthenticated =localStorage.getItem('token') !== true;
    return isAuthenticated ? <Outlet/> : <Navigate to="/login"/>

    
}

export default ProtectedRouter