import sendEmail from '../config/sendEmail.js';
import UserModel from '../models/user.model.js';
import bcrypt from 'bcryptjs';
import verifyEmailTemplate from '../utils/verifyEmailTemplate.js';
import generatedAccessToken from '../utils/generatedAccessToken.js';
import generatedRefreshToken from '../utils/generatedRefreshToken.js';


// ===============================================
// REGISTER USER
// ===============================================
export async function registerUserController(request, response) {
  try {
    const { name, email, password } = request.body;

    // Check required fields
    if (!name || !email || !password) {
      return response.status(400).json({
        message: "Provide name, email, and password",
        error: true,
        success: false
      });
    }

    // Check if email already exists
    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      return response.status(400).json({
        message: 'Email is already registered',
        error: true,
        success: false
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const newUser = new UserModel({
      name,
      email,
      password: hashedPassword,
      verify_email: false
    });

    const savedUser = await newUser.save();

    // Verification email link
    const verifyEmailUrl = `${process.env.FRONTEND_URL}/verify-email?code=${savedUser._id}`;

    await sendEmail({
      sendTo: email,
      subject: 'Verify your email - PrimeCommerce',
      html: verifyEmailTemplate({ name, url: verifyEmailUrl })
    });

    return response.status(201).json({
      message: 'User registered successfully! Please check your email to verify.',
      success: true,
      error: false,
      data: savedUser
    });

  } catch (error) {
    return response.status(500).json({
      message: error.message || 'Something went wrong',
      error: true,
      success: false
    });
  }
}



// ===============================================
// VERIFY EMAIL
// ===============================================
export async function verifyEmailController(request, response) {
  try {
    const { code } = request.body;

    if (!code) {
      return response.status(400).json({
        message: "Verification code is required",
        error: true,
        success: false
      });
    }

    const user = await UserModel.findById(code);

    if (!user) {
      return response.status(400).json({
        message: "Invalid verification link",
        error: true,
        success: false
      });
    }

    await UserModel.updateOne({ _id: code }, { verify_email: true });

    return response.json({
      message: "Email verified successfully!",
      success: true,
      error: false
    });

  } catch (error) {
    return response.status(500).json({
      message: error.message || 'Server Error',
      error: true,
      success: false
    });
  }
}



// ===============================================
// LOGIN USER
// ===============================================
export async function loginController(request, response) {
  try {
    const { email, password } = request.body;

    // Check email + password
    if (!email || !password) {
      return response.status(400).json({
        message: 'Provide email & password',
        error: true,
        success: false
      });
    }

    const user = await UserModel.findOne({ email });

    if (!user) {
      return response.status(400).json({
        message: 'User not found',
        error: true,
        success: false
      });
    }

    // Check status
    if (user.status !== 'active') {
      return response.status(400).json({
        message: 'Contact Admin',
        error: true,
        success: false
      });
    }

    // Check password
    const checkPassword = await bcrypt.compare(password, user.password);

    if (!checkPassword) {
      return response.status(400).json({
        message: 'Incorrect password',
        error: true,
        success: false
      });
    }

    // Generate Tokens
    const accessToken = await generatedAccessToken(user._id);
    const refreshToken = await generatedRefreshToken(user._id);

    const cookieOptions = {
      httpOnly: true,
      secure: true,
      sameSite: 'None'
    };

    // Set Cookies
    response.cookie('accessToken', accessToken, cookieOptions);
    response.cookie('refreshToken', refreshToken, cookieOptions);

    return response.json({
      message: 'Login Successful',
      error: false,
      success: true,
      data: {
        accessToken,
        refreshToken
      }
    });

  } catch (error) {
    return response.status(500).json({
      message: error.message || error,
      error: true,
      success: false
    });
  }
}


// ===============================================
// LOGOUT CONTROLLER
// ===============================================
export async function logoutController(request, response) {
  try {
    // Clear cookies
    response.clearCookie('accessToken', {
      httpOnly: true,
      secure: true,
      sameSite: 'None'
    });

    response.clearCookie('refreshToken', {
      httpOnly: true,
      secure: true,
      sameSite: 'None'
    });

    return response.json({
      message: 'Logout Successfully',
      success: true,
      error: false
    });

  } catch (error) {
    return response.status(500).json({
      message: error.message || 'Server Error',
      error: true,
      success: false
    });
  }
}
