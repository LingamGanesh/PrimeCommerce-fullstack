import sendEmail from '../config/sendEmail.js';
import UserModel from '../models/user.model.js';
import bcrypt from 'bcryptjs';
import verifyEmailTemplate from '../utils/verifyEmailTemplate.js';

export async function registerUserController(request, response) {
  try {
    const { name, email, password } = request.body;

    if (!name || !email || !password) {
      return response.status(400).json({
        message: "Provide name, email, and password",
        error: true,
        success: false
      });
    }

    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      return response.status(400).json({
        message: 'Email is already registered',
        error: true,
        success: false
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new UserModel({
      name,
      email,
      password: hashedPassword
    });

    const savedUser = await newUser.save();

    const verifyEmailUrl = `${process.env.FRONTEND_URL}/verify-email?code=${savedUser._id}`;

    await sendEmail({
      sendTo: email,
      subject: 'Verify your email - BinkeyIT',
      html: verifyEmailTemplate({ name, url: verifyEmailUrl })
    });

    return response.status(201).json({
      message: 'User registered successfully! Please check your email to verify.',
      success: true,
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
