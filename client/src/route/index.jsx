import { createBrowserRouter } from "react-router-dom";
import App from "../App";
import Home from "../pages/Home";
import SearchPage from "../pages/SearchPage";
import LoginPage from "../pages/LoginPage";
import RegisterPage from "../pages/RegisterPage";
import ForgotPage from "../pages/ForgotPage";
import VerificationOtpPage from "../pages/VerificationOtpPage";
import ResetPassword from "../pages/ResetPassword";

const router = createBrowserRouter([
    {
      path:'/',  
      element:<App/>,
      children:[
        {
        path:'',
        element:<Home/>
      },
      {
        path:'search',
        element:<SearchPage/>
      },
      {
        path:'login',
        element:<LoginPage/>
      },
      {
        path:'register',
      element:<RegisterPage/>
      },
      {
        path:'forgot-password',
        element:<ForgotPage />
      },
      {
        path:'verification-page',
        element:<VerificationOtpPage/>
      },
      {
        path:'reset-password',
        element:<ResetPassword/>
      }
      ]
    }
])

export default router