import { Router } from 'express';
import { logoutController,loginController,registerUserController ,verifyEmailController,uploadAvatar, updateUserDetails, forgotPasswordController, verifyForgotPasswordOtp, resetpassword, refreshToken } from '../controllers/user.controller.js';
import auth from '../middleware/auth.js';
import upload from '../middleware/multer.js';

const userRouter = Router();

userRouter.post('/register', registerUserController);
userRouter.post('/verify-email',verifyEmailController)
userRouter.post('/login',loginController)
userRouter.get('/logout', auth, logoutController)
userRouter.put('/upload-avatar',auth,upload.single('avatar'),uploadAvatar)
userRouter.put('/update-user',auth,updateUserDetails)
userRouter.put('/forgot-password',auth,forgotPasswordController)
userRouter.put('/verify-forgot-password',verifyForgotPasswordOtp)
userRouter.put('/reset-password',resetpassword)
userRouter.post('/refresh-token',refreshToken)
export default userRouter;
