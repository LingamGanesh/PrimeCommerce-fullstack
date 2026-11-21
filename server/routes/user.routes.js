import { Router } from 'express';
import { logoutController,loginController,registerUserController ,verifyEmailController,resendVerificationEmailController,uploadAvatar, updateUserDetails, forgotPasswordController, verifyForgotPasswordOtp, resetpassword, refreshToken, userDetails } from '../controllers/user.controller.js';
import auth from '../middleware/auth.js';
import upload from '../middleware/multer.js';

const userRouter = Router();

userRouter.post('/register', registerUserController);
userRouter.post('/verify-email',verifyEmailController)
userRouter.post('/resend-verification', resendVerificationEmailController)
userRouter.post('/login',loginController)
userRouter.get('/logout', auth, logoutController)
userRouter.put('/upload-avatar', auth, (request, response, next) => {
  upload.single('avatar')(request, response, (error) => {
    if (error) {
      const isSizeError = error.code === 'LIMIT_FILE_SIZE';
      return response.status(isSizeError ? 413 : 400).json({
        message: isSizeError ? 'Image must be 5 MB or smaller.' : (error.message || 'Invalid image upload.'),
        error: true,
        success: false,
      });
    }
    next();
  });
}, uploadAvatar)
userRouter.put('/update-user',auth,updateUserDetails)
userRouter.post('/forgot-password', forgotPasswordController)
userRouter.put('/verify-forgot-password',verifyForgotPasswordOtp)
userRouter.put('/reset-password',resetpassword)
userRouter.post('/refresh-token',refreshToken)
userRouter.get('/user-details',auth,userDetails)
export default userRouter;
