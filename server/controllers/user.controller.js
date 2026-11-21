import sendEmail from '../config/sendEmail.js';
import UserModel from '../models/user.model.js';
import bcrypt from 'bcryptjs';
import verifyEmailTemplate from '../utils/verifyEmailTemplate.js';
import generatedRefreshToken from '../utils/generatedRefreshToken.js';
import uploadImageClodinary from '../utils/uploadImageClodinary.js';
import generatedOtp from '../utils/generatedOtp.js';
import forgotPasswordTemplate from '../utils/forgotPasswordTemplate.js';
import jwt from "jsonwebtoken"
import mongoose from "mongoose"
import { createHash, randomBytes, timingSafeEqual } from "node:crypto"
import generateAccessToken from '../utils/generatedAccessToken.js';


// ===============================================
// REGISTER USER
// ===============================================
export async function registerUserController(request, response) {
  try {
    const { name, password } = request.body;
    const normalizedEmail = String(request.body?.email || "").trim().toLowerCase();

    // Validate registration input on the server, not only in the browser.
    if (typeof name !== "string" || name.trim().length < 2 || name.trim().length > 80 ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail) ||
        typeof password !== "string" || password.length < 8 || password.length > 128) {
      return response.status(400).json({
        message: "Provide a valid name and email, and a password between 8 and 128 characters",
        error: true,
        success: false
      });
    }

    // Check if email already exists
    const existingUser = await UserModel.findOne({ email: normalizedEmail });
    if (existingUser) {
      return response.status(400).json({
        message: 'Email is already registered',
        error: true,
        success: false
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Store only a hash of the one-time email verification token.
    const verificationToken = randomBytes(32).toString("hex");
    const verificationTokenHash = createHash("sha256").update(verificationToken).digest("hex");

    // Create user
    const newUser = new UserModel({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      verify_email: false,
      emailVerificationTokenHash: verificationTokenHash,
      emailVerificationTokenExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
    });

    const savedUser = await newUser.save();

    // Verification email link
    const verifyEmailUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/verify-email?code=${verificationToken}`;

    try {
      await sendEmail({
        sendTo: normalizedEmail,
        subject: 'Verify your email - PrimeCommerce',
        html: verifyEmailTemplate({ name, url: verifyEmailUrl })
      });
    } catch (emailError) {
      await UserModel.deleteOne({ _id: savedUser._id });
      throw emailError;
    }

    const safeUser = savedUser.toObject();
    delete safeUser.password;
    delete safeUser.refresh_token;
    delete safeUser.forgot_password_otp;
    delete safeUser.forgot_password_expiry;
    delete safeUser.emailVerificationTokenHash;
    delete safeUser.emailVerificationTokenExpiresAt;

    return response.status(201).json({
      message: 'User registered successfully! Please check your email to verify.',
      success: true,
      error: false,
      data: safeUser
    });

  } catch (error) {
    return response.status(503).json({
      message: error.message || 'Unable to complete registration right now',
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
    const code = String(request.body?.code || "");
    if (!/^[a-f0-9]{64}$/i.test(code)) {
      return response.status(400).json({ message: "Invalid or expired verification link", error: true, success: false });
    }

    const tokenHash = createHash("sha256").update(code).digest("hex");
    const user = await UserModel.findOneAndUpdate(
      {
        emailVerificationTokenHash: tokenHash,
        emailVerificationTokenExpiresAt: { $gt: new Date() },
        verify_email: false
      },
      {
        $set: {
          verify_email: true,
          emailVerificationTokenHash: null,
          emailVerificationTokenExpiresAt: null
        }
      },
      { new: true }
    );

    if (!user) {
      return response.status(400).json({
        message: "This verification link is invalid, expired, or already used.",
        error: true,
        success: false
      });
    }

    return response.json({
      message: "Email verified successfully!",
      success: true,
      error: false
    });
  } catch {
    return response.status(500).json({
      message: "Unable to verify email right now",
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
    const { email, password } = request.body

    // 1️⃣ Validate input
    if (!email || !password) {
      return response.status(400).json({
        message: 'Email and password are required',
        error: true,
        success: false
      })
    }

    // 2️⃣ Check user
    const normalizedEmail = String(email).trim().toLowerCase()
    const user = await UserModel.findOne({ email: normalizedEmail }).select('+password')

    if (!user) {
      return response.status(404).json({
        message: 'User not found',
        error: true,
        success: false
      })
    }

    // 3️⃣ Check account status
    if (user.status !== 'active') {
      return response.status(403).json({
        message: 'Account is not active. Contact admin.',
        error: true,
        success: false
      })
    }

    // New accounts must verify their email before signing in. Accounts created
    // before email verification was introduced (field absent) remain compatible.
    if (user.verify_email === false) {
      return response.status(403).json({
        message: 'Please verify your email before logging in.',
        error: true,
        success: false
      })
    }

    // 4️⃣ Verify password
    const isPasswordMatch = await bcrypt.compare(password, user.password)

    if (!isPasswordMatch) {
      return response.status(401).json({
        message: 'Invalid email or password',
        error: true,
        success: false
      })
    }

    // 5️⃣ Generate tokens
 const accessToken = await generateAccessToken(user._id)
const refreshToken = await generatedRefreshToken(user._id)


 const updateUser = await UserModel.findByIdAndUpdate(user?._id,{
            last_login_date : new Date()
        })


    // 6️⃣ Cookie options (ENV-safe)
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      path: '/',
    }

    // 7️⃣ Set cookies
    response.cookie('accessToken', accessToken, cookieOptions)
    response.cookie('refreshToken', refreshToken, cookieOptions)

    // 8️⃣ Success response
    return response.status(200).json({
      message: 'Login successful',
      error: false,
      success: true,
      data: { userId: user._id }
    })

  } catch (error) {
  console.error("Login failed:", error.message);

  return response.status(500).json({
    message: "Unable to log in. Please try again.",
    error: true,
    success: false
  });
}

}


// ===============================================
// LOGOUT USER
// ===============================================
export async function logoutController(request, response) {
  try {
    // Clear both tokens
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      path: "/",
    };

    await UserModel.updateOne({ _id: request.userId }, { $set: { refresh_token: "" } });
    response.clearCookie("accessToken", cookieOptions);
    response.clearCookie("refreshToken", cookieOptions);

    return response.status(200).json({
      message: "Logged out successfully",
      success: true,
      error: false
    });

  } catch (error) {
    return response.status(500).json({
      message: error.message || "Logout failed",
      error: true,
      success: false
    });
  }
}

// upload Avthar
export async  function uploadAvatar(request,response){
    try {
        const userId = request.userId;
        const image = request.file;
        if (!image) {
            return response.status(400).json({
                message: "Please select an image to upload",
                error: true,
                success: false
            });
        }

        const upload = await uploadImageClodinary(image)
        
        const updateUser = await UserModel.findByIdAndUpdate(userId,{
            avatar : upload.url
        })

        return response.json({
            message : "upload profile",
            success : true,
            error : false,
            data : {
                _id : userId,
                avatar : upload.url
            }
        })

    } catch (error) {
        return response.status(500).json({
            message : error.message || error,
            error : true,
            success : false
        })
    }
    
}

// Update profile fields with validation; email changes require a separate verified flow.
export async function updateUserDetails(request, response) {
  try {
    const userId = request.userId;
    const { name, email, mobile, password } = request.body || {};
    const currentUser = await UserModel.findById(userId).select("email");
    if (!currentUser) {
      return response.status(404).json({ message: "User not found", error: true, success: false });
    }

    const updates = {};
    if (name !== undefined) {
      if (typeof name !== "string" || name.trim().length < 2 || name.trim().length > 80) {
        return response.status(400).json({ message: "Name must be between 2 and 80 characters", error: true, success: false });
      }
      updates.name = name.trim();
    }

    if (email !== undefined) {
      const nextEmail = String(email).trim().toLowerCase();
      if (nextEmail !== currentUser.email) {
        return response.status(400).json({ message: "Email changes require a separate verification process", error: true, success: false });
      }
    }

    if (mobile !== undefined) {
      const normalizedMobile = String(mobile).trim();
      if (normalizedMobile && !/^\\d{10,15}$/.test(normalizedMobile)) {
        return response.status(400).json({ message: "Enter a valid mobile number", error: true, success: false });
      }
      updates.mobile = normalizedMobile ? Number(normalizedMobile) : null;
    }

    if (password !== undefined && password !== "") {
      if (typeof password !== "string" || password.length < 8 || password.length > 128) {
        return response.status(400).json({ message: "Password must be between 8 and 128 characters", error: true, success: false });
      }
      updates.password = await bcrypt.hash(password, 12);
      updates.refresh_token = "";
    }

    if (!Object.keys(updates).length) {
      return response.status(400).json({ message: "No valid profile changes were provided", error: true, success: false });
    }

    const updatedUser = await UserModel.findByIdAndUpdate(userId, { $set: updates }, {
      new: true,
      runValidators: true
    }).select("name email mobile avatar role verify_email status").lean();

    return response.json({
      message: "Profile updated successfully",
      error: false,
      success: true,
      data: updatedUser
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message || "Unable to update profile",
      error: true,
      success: false
    });
  }
}

//forgot password not login
export async function forgotPasswordController(request, response) {
  try {
    const email = String(request.body?.email || "").trim().toLowerCase();
    if (!email) return response.status(400).json({ message: "Email is required", error: true, success: false });

    const user = await UserModel.findOne({ email }).select("+forgot_password_last_sent_at");
    // Use the same response for known and unknown email addresses to reduce account enumeration.
    if (!user) return response.json({ message: "If the account exists, a reset code has been sent.", error: false, success: true });

    const now = new Date();
    if (user.forgot_password_last_sent_at && now - user.forgot_password_last_sent_at < 60 * 1000) {
      return response.json({ message: "If the account exists, a reset code has been sent.", error: false, success: true });
    }

    const otp = generatedOtp();
    const otpHash = createHash("sha256").update(otp).digest("hex");
    const expiresAt = new Date(now.getTime() + 10 * 60 * 1000);

    await UserModel.updateOne({ _id: user._id }, {
      $set: {
        forgot_password_otp: otpHash,
        forgot_password_expiry: expiresAt,
        forgot_password_otp_attempts: 0,
        forgot_password_last_sent_at: now,
        passwordResetVerifiedUntil: null
      }
    });

    try {
      await sendEmail({
        sendTo: email,
        subject: "PrimeCommerce password reset code",
        html: forgotPasswordTemplate({ name: user.name, otp })
      });
    } catch (emailError) {
      await UserModel.updateOne({ _id: user._id, forgot_password_otp: otpHash }, {
        $set: { forgot_password_otp: "", forgot_password_expiry: null }
      });
      throw emailError;
    }

    return response.json({ message: "If the account exists, a reset code has been sent.", error: false, success: true });
  } catch (error) {
    console.error("Password reset email failed:", error.message);
    return response.status(503).json({ message: "Unable to send a password reset code right now.", error: true, success: false });
  }
}


//verify forgot password otp
export async function verifyForgotPasswordOtp(request, response) {
  try {
    const email = String(request.body?.email || "").trim().toLowerCase();
    const otp = String(request.body?.otp || "");
    if (!email || !/^[0-9]{6}$/.test(otp)) {
      return response.status(400).json({ message: "Enter your email and 6-digit code.", error: true, success: false });
    }

    const user = await UserModel.findOne({ email }).select(
      "+forgot_password_otp +forgot_password_expiry +forgot_password_otp_attempts"
    );
    const now = new Date();
    if (!user || !user.forgot_password_otp || !user.forgot_password_expiry ||
        user.forgot_password_expiry <= now || user.forgot_password_otp_attempts >= 5) {
      return response.status(400).json({ message: "The code is invalid or expired. Request a new one.", error: true, success: false });
    }

    const submittedHash = createHash("sha256").update(otp).digest();
    const savedHash = Buffer.from(user.forgot_password_otp, "hex");
    const matches = savedHash.length === submittedHash.length && timingSafeEqual(savedHash, submittedHash);

    if (!matches) {
      await UserModel.updateOne(
        { _id: user._id, forgot_password_otp: user.forgot_password_otp, forgot_password_otp_attempts: { $lt: 5 } },
        { $inc: { forgot_password_otp_attempts: 1 } }
      );
      return response.status(400).json({ message: "The code is invalid or expired. Request a new one.", error: true, success: false });
    }

    const verified = await UserModel.findOneAndUpdate(
      {
        _id: user._id,
        forgot_password_otp: user.forgot_password_otp,
        forgot_password_expiry: { $gt: now },
        forgot_password_otp_attempts: { $lt: 5 }
      },
      {
        $set: {
          forgot_password_otp: "",
          forgot_password_expiry: null,
          forgot_password_otp_attempts: 0,
          passwordResetVerifiedUntil: new Date(now.getTime() + 10 * 60 * 1000)
        }
      },
      { new: true }
    );

    if (!verified) return response.status(409).json({ message: "The code has already been used or expired. Request a new one.", error: true, success: false });
    return response.json({ message: "Code verified. You can now reset your password.", error: false, success: true });
  } catch {
    return response.status(500).json({ message: "Unable to verify the reset code.", error: true, success: false });
  }
}

//reset the password
export async function resetpassword(request,response){
    try {
        const { email , newPassword, confirmPassword } = request.body 

        if (!email || !newPassword || !confirmPassword) {
            return response.status(400).json({
                message: "Provide email, newPassword and confirmPassword",
                error: true,
                success: false
            });
        }

        if (typeof newPassword !== "string" || newPassword.length < 8 || newPassword.length > 128) {
            return response.status(400).json({
                message: "Password must be between 8 and 128 characters",
                error: true,
                success: false
            });
        }

        if (newPassword !== confirmPassword) {
            return response.status(400).json({
                message: "New password and confirmation must match",
                error: true,
                success: false
            });
        }

        const user = await UserModel.findOne({
            email: String(email).trim().toLowerCase(),
            passwordResetVerifiedUntil: { $gt: new Date() }
        }).select("+passwordResetVerifiedUntil");

        if (!user) {
            return response.status(403).json({
                message: "Verify a valid password-reset OTP before resetting your password",
                error: true,
                success: false
            });
        }

        const hashPassword = await bcrypt.hash(newPassword, 12);
        const update = await UserModel.findOneAndUpdate(
            { _id: user._id, passwordResetVerifiedUntil: { $gt: new Date() } },
            { $set: { password: hashPassword, passwordResetVerifiedUntil: null, refresh_token: "" } },
            { new: true }
        );

        if (!update) {
            return response.status(403).json({
                message: "Password reset verification expired or was already used",
                error: true,
                success: false
            });
        }

        return response.json({
            message : "Password updated successfully.",
            error : false,
            success : true
        })

    } catch (error) {
        return response.status(500).json({
            message : error.message || error,
            error : true,
            success : false
        })
    }
}

//refresh token controler
export async function refreshToken(request,response){
    try {
        const refreshToken = request.cookies?.refreshToken || request?.headers?.authorization?.split(" ")[1]  /// [ Bearer token]

        if(!refreshToken){
            return response.status(401).json({
                message : "Invalid token",
                error  : true,
                success : false
            })
        }

        const verifyToken = await jwt.verify(refreshToken,process.env.SECRET_KEY_REFRESH_TOKEN)

        if(!verifyToken){
            return response.status(401).json({
                message : "token is expired",
                error : true,
                success : false
            })
        }

        const userId = verifyToken?.id
        if (!userId) return response.status(401).json({ message: "Invalid refresh token", error: true, success: false })

        const user = await UserModel.findById(userId).select("+refresh_token role status")
        if (!user || user.status !== "active" || user.refresh_token !== refreshToken) {
            return response.status(401).json({ message: "Refresh token is no longer valid", error: true, success: false })
        }

        const newAccessToken = await generateAccessToken(userId)

        const cookiesOption = {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
            path: "/",
        }

        response.cookie('accessToken',newAccessToken,cookiesOption)

        return response.json({
            message : "New Access token generated",
            error : false,
            success : true,
            data : {
                accessToken : newAccessToken
            }
        })


    } catch (error) {
        return response.status(500).json({
            message : error.message || error,
            error : true,
            success : false
        })
    }
}


//get login user details
export async function userDetails(req, res) {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        message: "User ID missing from token",
        error: true,
        success: false,
      });
    }

    const user = await UserModel.findById(userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
        error: true,
        success: false,
      });
    }

    return res.json({
      message: "user details",
      data: user,
      error: false,
      success: true,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Something is wrong",
      error: true,
      success: false,
    });
  }
}
