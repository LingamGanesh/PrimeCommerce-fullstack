import { createBrowserRouter } from "react-router-dom";
import App from "../App";
import Home from "../pages/Home";
import SearchPage from "../pages/SearchPage";
import LoginPage from "../pages/LoginPage";
import RegisterPage from "../pages/RegisterPage";
import ForgotPage from "../pages/ForgotPage";
import VerificationOtpPage from "../pages/VerificationOtpPage";
import ResetPassword from "../pages/ResetPassword";
import Dashboard from "../layout/Dashboard";
import Profile from "../pages/Profile";
import Myorders from "../pages/Myorders";
import Address from "../pages/Address";
import Cart from "../pages/Cart";
import Checkout from "../pages/Checkout";
import AdminGuard from "../components/AdminGuard";
import AdminDashboard from "../pages/AdminDashboard";
import StaffGuard from "../components/StaffGuard";
import FulfilmentDashboard from "../pages/FulfilmentDashboard";
import Support from "../pages/Support";
import VerifyEmail from "../pages/VerifyEmail";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { path: "", element: <Home /> },
      { path: "search", element: <SearchPage /> },
      { path: "cart", element: <Cart /> },
      { path: "checkout", element: <Checkout /> },
      { path: "admin", element: <AdminGuard />, children: [{ path: "", element: <AdminDashboard /> }] },
      { path: "picker", element: <StaffGuard role="picker" />, children: [{ path: "", element: <FulfilmentDashboard /> }] },
      { path: "rider", element: <StaffGuard role="rider" />, children: [{ path: "", element: <FulfilmentDashboard /> }] },
      { path: "login", element: <LoginPage /> },
      { path: "register", element: <RegisterPage /> },
      { path: "forgot-password", element: <ForgotPage /> },
      { path: "verification-page", element: <VerificationOtpPage /> },
      { path: "verify-email", element: <VerifyEmail /> },
      { path: "reset-password", element: <ResetPassword /> },
      {
        path: "dashboard",
        element: <Dashboard />,
        children: [
          { path: "profile", element: <Profile /> },
          { path: "myorders", element: <Myorders /> },
          { path: "support", element: <Support /> },
          { path: "address", element: <Address /> }
        ]
      }
    ]
  }
]);

export default router;
