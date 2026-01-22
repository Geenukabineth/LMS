import { Routes, Route } from "react-router-dom";
import Login from "@/components/pages/Login";
import Signup from "@/components/pages/Signup";
import Suadmin from "@/components/SUadmin/Suadmin";
import Teacher from "@/components/admin/admin";
import PaymentPage from "@/components/student/PaymentPage";
import Student from "@/components/student/user";
import CourseBrowsePage from "@/components/student/CourseBrowsePage";
import Receptionist from '@/components/receptionist/receptionist'
import ProtectedRouter from "@/config/ProtectedRouter";
import ForgotPassword from "@/components/pages/forgot-password/ForgotPassword";
import TeacherApplication from "@/components/pages/TeacherApplication";
import CourseDetailView from "@/components/courseData/Coursedetailview ";
import QuizAttemptView from "@/components/student/QuizAttemptView";
import AssignmentView from "@/components/student/AssignmentView";
import GradingScreen from "@/components/admin/GradingScreen";


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
        <Route path="/courses" element={<CourseBrowsePage />} />
      </Route>

      {/* ✅ FIX: Route Group 4 - Receptionist Access */}
      <Route element={<ProtectedRouter allowedRoles={['receptionist']} />}>
        <Route path="/receptionist" element={<Receptionist />} />
      </Route>
      <Route element={<ProtectedRouter allowedRoles={['student']} />}>
        <Route path="/student/course/:courseId/quiz/:quizId" element={<QuizAttemptView />} />
      </Route>
      <Route element={<ProtectedRouter allowedRoles={['student']} />}>
        <Route path="/student/course/:courseId/assignment/:assignmentId" element={<AssignmentView />} />        
      </Route>      
      <Route element={<ProtectedRouter allowedRoles={['instructor']} />}>
      <Route path="/teacher/courses/:courseId/gradebook" element={<GradingScreen />} />
    </Route>

      
      
    </Routes>
  );
}

export default App;