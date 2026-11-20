import { Router } from 'express';
import { logoutController,loginController,registerUserController ,verifyEmailController,uploadAvatar, updateUserDetails, forgotPasswordController, verifyForgotPasswordOtp, resetpassword, refreshToken, userDetails } from '../controllers/user.controller.js';
import auth from '../middleware/auth.js';
import { createRateLimiter } from '../middleware/rateLimit.js';
import upload from '../middleware/multer.js';

const userRouter = Router();
const loginLimiter = createRateLimiter({ name: "login", windowMs: 15 * 60 * 1000, max: process.env.NODE_ENV === "production" ? 10 : 30 });
const registrationLimiter = createRateLimiter({ name: "register", windowMs: 60 * 60 * 1000, max: process.env.NODE_ENV === "production" ? 5 : 30 });
const forgotPasswordLimiter = createRateLimiter({ name: "forgot-password", windowMs: 60 * 60 * 1000, max: process.env.NODE_ENV === "production" ? 3 : 10 });
const passwordOtpLimiter = createRateLimiter({ name: "password-otp", windowMs: 15 * 60 * 1000, max: 10 });
const passwordResetLimiter = createRateLimiter({ name: "password-reset", windowMs: 15 * 60 * 1000, max: 10 });
const emailVerificationLimiter = createRateLimiter({ name: "email-verification", windowMs: 60 * 60 * 1000, max: 10 });
const refreshTokenLimiter = createRateLimiter({ name: "refresh-token", windowMs: 15 * 60 * 1000, max: 20 });
const avatarUploadLimiter = createRateLimiter({ name: "avatar-upload", windowMs: 60 * 60 * 1000, max: 10 });

userRouter.post('/register', registrationLimiter, registerUserController);
userRouter.post('/verify-email',emailVerificationLimiter,verifyEmailController)
userRouter.post('/login',loginLimiter,loginController)
userRouter.post('/logout', auth, logoutController)
userRouter.put('/upload-avatar',auth,avatarUploadLimiter,upload.single('avatar'),uploadAvatar)
userRouter.put('/update-user',auth,updateUserDetails)
userRouter.post('/forgot-password', forgotPasswordLimiter, forgotPasswordController)
userRouter.put('/verify-forgot-password',passwordOtpLimiter,verifyForgotPasswordOtp)
userRouter.put('/reset-password',passwordResetLimiter,resetpassword)
userRouter.post('/refresh-token',refreshTokenLimiter,refreshToken)
userRouter.get('/user-details',auth,userDetails)
export default userRouter;
