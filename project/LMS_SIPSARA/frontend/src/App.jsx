import { Routes, Route } from "react-router-dom";
import Login from "@/pages/login";
import Home from "@/pages/home";
import Signup from "@/pages/Signup";
import Suadmin from "@/SUadmin/Suadmin";
import Teacher from "@/SUadmin/admin";
import Student from "@/student/user";
import Receptionist from '@/SUadmin/receptionist'
import ProtectedRouter from "@/config/ProtectedRouter";


function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Home />} />
      <Route path="/signup" element={<Signup />} />

      <Route element={<ProtectedRouter />}>
        <Route path="/suadmin" element={<Suadmin />} />
        <Route path="/teacher" element={<Teacher />} />
        <Route path="/student" element={<Student />} />
        <Route path= "/receptionist" element={<Receptionist/>}/>
      </Route>
    </Routes>
  );
}




export default App;
