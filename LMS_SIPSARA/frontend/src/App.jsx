import { Routes, Route } from "react-router-dom";
import Login from "@/pages/login";
import Signup from "@/pages/Signup";
import Suadmin from "@/SUadmin/Suadmin";
import Teacher from "@/admin/admin";
import PaymentPage from "./student/PaymentPage";
import Student from "@/student/user";
import CourseBrowsePage from "./student/CourseBrowsePage";
import Receptionist from '@/receptionist/receptionist'
import ProtectedRouter from "@/config/ProtectedRouter";
import ForgotPassword from "@/pages/forgot-password/ForgotPassword";
import TeacherApplication from "@/pages/TeacherApplication";
import CourseDetailView from "@/components/courseData/Coursedetailview ";


function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Login />} />      
      <Route path="/payment" element={<PaymentPage />} />
      <Route path="/courses" element={<CourseBrowsePage />} />
      <Route path="/ForgotPassword" element={<ForgotPassword />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/TeacherApplication" element={<TeacherApplication />} />

      {/* ---------------------------------------------------- */}
      {/* ✅ FIX: Route Group 1 - Super Admin Access */}
      <Route element={<ProtectedRouter allowedRoles={['admin']} />}>
        <Route path="/suadmin" element={<Suadmin />} />
      </Route>

      {/* ✅ FIX: Route Group 2 - Teacher/Instructor Access */}
      {/* Note: The login component uses 'instructor' as the type */}
      <Route element={<ProtectedRouter allowedRoles={['instructor']} />}>
        <Route path="/teacher" element={<Teacher />} />
      </Route>

      {/* ✅ FIX: Route Group 3 - Student Access */}
      <Route element={<ProtectedRouter allowedRoles={['student']} />}>
        <Route path="/student" element={<Student />} />
        <Route path="/student/courses/:id" element={<CourseDetailView />} />
      </Route>

      {/* ✅ FIX: Route Group 4 - Receptionist Access */}
      <Route element={<ProtectedRouter allowedRoles={['receptionist']} />}>
        <Route path="/receptionist" element={<Receptionist />} />
      </Route>
      {/* ---------------------------------------------------- */}
      
    </Routes>
  );
}

export default App;