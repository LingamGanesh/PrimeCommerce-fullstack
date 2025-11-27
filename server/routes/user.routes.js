import { Router } from 'express';
import { logoutController,loginController,registerUserController ,verifyEmailController } from '../controllers/user.controller.js';
import auth from '../middle/auth.js';

const userRouter = Router();

userRouter.post('/register', registerUserController);

userRouter.post('/verify-email',verifyEmailController)

userRouter.post('/login',loginController)
userRouter.get('/logout', auth, logoutController)
export default userRouter;
