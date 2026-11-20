import sendEmail from '../config/sendEmail.js';
import UserModel from '../models/user.model.js';
import bcrypt from 'bcryptjs';
import verifyEmailTemplate from '../utils/verifyEmailTemplate.js';
import generatedRefreshToken from '../utils/generatedRefreshToken.js';
import uploadImageClodinary from '../utils/uploadImageClodinary.js';
import forgotPasswordTemplate from '../utils/forgotPasswordTemplate.js';
import jwt from "jsonwebtoken"
import crypto from "node:crypto"
import generateAccessToken from '../utils/generatedAccessToken.js';


// ===============================================
// REGISTER USER
// ===============================================
export async function registerUserController(request, response) {
  try {
    const name = String(request.body?.name || "").trim();
    const email = String(request.body?.email || "").trim().toLowerCase();
    const password = String(request.body?.password || "");
    if (name.length < 2 || name.length > 80 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 8 || password.length > 128) {
      return response.status(400).json({ message: "Enter a valid name and email, and a password between 8 and 128 characters", error: true, success: false });
    }
    if (await UserModel.findOne({ email }).select("_id")) {
      return response.status(409).json({ message: "Email is already registered", error: true, success: false });
    }

    const verificationToken = crypto.randomBytes(32).toString("hex");
    const newUser = await UserModel.create({
      name,
      email,
      password: await bcrypt.hash(password, 12),
      verify_email: false,
      email_verification_token_hash: crypto.createHash("sha256").update(verificationToken).digest("hex"),
      email_verification_expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000)
    });

    const frontendUrl = String(process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/+$/, "");
    const verifyEmailUrl = frontendUrl + "/verify-email?token=" + encodeURIComponent(verificationToken);
    try {
      await sendEmail({
        sendTo: email,
        subject: "Verify your email - PrimeCommerce",
        html: verifyEmailTemplate({ name, url: verifyEmailUrl })
      });
    } catch (emailError) {
      await UserModel.deleteOne({ _id: newUser._id });
      throw emailError;
    }

    return response.status(201).json({
      message: "Account created. Please check your email to verify your address.",
      success: true,
      error: false,
      data: { _id: newUser._id, name: newUser.name, email: newUser.email, verify_email: false }
    });
  } catch (error) {
    if (error?.code === 11000) {
      return response.status(409).json({ message: "Email is already registered", error: true, success: false });
    }
    return response.status(500).json({
      message: error.message || "Unable to register account",
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
    const token = String(request.body?.token || "");
    if (!/^[a-f0-9]{64}$/i.test(token)) {
      return response.status(400).json({ message: "Verification link is invalid or expired", error: true, success: false });
    }
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const user = await UserModel.findOneAndUpdate(
      { email_verification_token_hash: tokenHash, email_verification_expires_at: { $gt: new Date() }, verify_email: false },
      { $set: { verify_email: true, email_verification_token_hash: "", email_verification_expires_at: null } },
      { new: true }
    ).select("_id email verify_email");
    if (!user) return response.status(400).json({ message: "Verification link is invalid, expired or already used", error: true, success: false });
    return response.json({ message: "Email verified successfully. You can now log in.", success: true, error: false });
  } catch {
    return response.status(500).json({ message: "Unable to verify email", error: true, success: false });
  }
}

// ===============================================
// LOGIN USER
// ===============================================


export async function loginController(request, response) {
  try {
    const email = String(request.body?.email || "").trim().toLowerCase()
    const password = String(request.body?.password || "")

    // 1️⃣ Validate input
    if (!email || !password) {
      return response.status(400).json({
        message: 'Email and password are required',
        error: true,
        success: false
      })
    }

    // 2️⃣ Check user
    const user = await UserModel.findOne({ email }).select('+password +email_verification_token_hash')

    if (!user) {
      return response.status(401).json({
        message: "Invalid email or password",
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

    // 4️⃣ Verify password
    const isPasswordMatch = await bcrypt.compare(password, user.password)

    if (!isPasswordMatch) {
      return response.status(401).json({
        message: 'Invalid email or password',
        error: true,
        success: false
      })
    }

    if (!user.verify_email && user.email_verification_token_hash) {
      return response.status(403).json({
        message: "Please verify your email address before logging in.",
        error: true,
        success: false
      })
    }
    // Existing accounts created before email verification was introduced have no token to verify.
    if (!user.verify_email && !user.email_verification_token_hash) {
      await UserModel.updateOne({ _id: user._id }, { $set: { verify_email: true } });
    }

    // 5️⃣ Generate tokens
 const accessToken = await generateAccessToken(user._id)
const refreshToken = await generatedRefreshToken(user._id)


 const updateUser = await UserModel.findByIdAndUpdate(user?._id,{
            last_login_date : new Date()
        })


    // 6️⃣ Cookie options (ENV-safe)
    const isProduction = process.env.NODE_ENV === "production";
    const cookieOptions = {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      path: "/"
    }

    // 7️⃣ Set cookies
    response.cookie('accessToken', accessToken, cookieOptions)
    response.cookie('refreshToken', refreshToken, cookieOptions)

    // 8️⃣ Success response
    return response.status(200).json({
      message: 'Login successful',
      error: false,
      success: true,
      data: {
        userId: user._id
      }
    })

  } catch (error) {
  console.error("LOGIN ERROR 👉", error);

  return response.status(500).json({
    message: error.message,
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
    const isProduction = process.env.NODE_ENV === "production";
    const cookieOptions = {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      path: "/"
    };

    response.clearCookie("accessToken", cookieOptions);
    response.clearCookie("refreshToken", cookieOptions);
    if (request.userId) {
      await UserModel.findByIdAndUpdate(request.userId, { refresh_token: "" });
    }

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
        const userId = request.userId // auth middlware
        const image = request.file  // multer middleware

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

// Update the signed-in user's profile.
export async function updateUserDetails(request, response) {
  try {
    const userId = request.userId;
    const currentUser = await UserModel.findById(userId).select("+refresh_token");
    if (!currentUser) return response.status(404).json({ message: "User not found", error: true, success: false });

    const { name, email, mobile, password } = request.body || {};
    const updates = {};

    if (name !== undefined) {
      const normalizedName = String(name).trim();
      if (normalizedName.length < 2 || normalizedName.length > 80) {
        return response.status(400).json({ message: "Name must be between 2 and 80 characters", error: true, success: false });
      }
      updates.name = normalizedName;
    }

    if (email !== undefined) {
      const normalizedEmail = String(email).trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
        return response.status(400).json({ message: "Enter a valid email address", error: true, success: false });
      }
      if (normalizedEmail !== currentUser.email) {
        return response.status(400).json({ message: "Email changes require a separate verification process and cannot be made from this form", error: true, success: false });
      }
    }

    if (mobile !== undefined) {
      const normalizedMobile = String(mobile).replace(/\D/g, "");
      if (normalizedMobile && !/^\d{10}$/.test(normalizedMobile)) {
        return response.status(400).json({ message: "Enter a valid 10-digit mobile number", error: true, success: false });
      }
      updates.mobile = normalizedMobile ? Number(normalizedMobile) : null;
    }

    if (password !== undefined && password !== "") {
      if (String(password).length < 8 || String(password).length > 128) {
        return response.status(400).json({ message: "Password must be between 8 and 128 characters", error: true, success: false });
      }
      updates.password = await bcrypt.hash(String(password), 12);
      updates.refresh_token = "";
    }

    if (!Object.keys(updates).length) {
      return response.status(400).json({ message: "No profile changes were provided", error: true, success: false });
    }

    const updatedUser = await UserModel.findByIdAndUpdate(userId, { $set: updates }, {
      new: true,
      runValidators: true
    }).select("name email mobile avatar verify_email role address_details orderHistory");

    if (updates.password) {
      const isProduction = process.env.NODE_ENV === "production";
      const cookieOptions = { httpOnly: true, secure: isProduction, sameSite: isProduction ? "none" : "lax", path: "/" };
      response.clearCookie("accessToken", cookieOptions);
      response.clearCookie("refreshToken", cookieOptions);
    }

    return response.json({
      message: updates.password ? "Profile updated. Please log in again." : "Profile updated successfully",
      error: false,
      success: true,
      data: updatedUser
    });
  } catch (error) {
    return response.status(400).json({
      message: error.message || "Unable to update profile",
      error: true,
      success: false
    });
  }
}

//forgot password not login
export async function forgotPasswordController(request,response) {
  try {
    const email = String(request.body?.email || "").trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return response.status(400).json({ message: "Enter a valid email address", error: true, success: false });
    }
    const user = await UserModel.findOne({ email }).select("_id name email");
    // Do not reveal whether an email address has an account.
    if (!user) return response.json({ message: "If the account exists, a password reset code has been sent.", error: false, success: true });

    const otp = String(crypto.randomInt(100000, 1000000));
    const otpHash = crypto.createHash("sha256").update(otp).digest("hex");
    await UserModel.updateOne({ _id: user._id }, {
      $set: {
        forgot_password_otp: "",
        forgot_password_otp_hash: otpHash,
        forgot_password_attempts: 0,
        forgot_password_expiry: new Date(Date.now() + 10 * 60 * 1000)
      }
    });
    await sendEmail({
      sendTo: email,
      subject: "Password reset code - PrimeCommerce",
      html: forgotPasswordTemplate({ name: user.name, otp })
    });
    return response.json({ message: "If the account exists, a password reset code has been sent.", error: false, success: true });
  } catch (error) {
    return response.status(503).json({ message: error.message || "Unable to send password reset email", error: true, success: false });
  }
}

//verify forgot password otp
export async function verifyForgotPasswordOtp(request,response){
  try {
    const email = String(request.body?.email || "").trim().toLowerCase();
    const otp = String(request.body?.otp || "");
    if (!email || !/^\d{6}$/.test(otp)) {
      return response.status(400).json({ message: "Enter your email and the 6-digit code", error: true, success: false });
    }
    const user = await UserModel.findOne({ email }).select("+forgot_password_otp_hash +forgot_password_attempts");
    if (!user || !user.forgot_password_expiry || user.forgot_password_expiry <= new Date() || !user.forgot_password_otp_hash) {
      return response.status(400).json({ message: "Code is invalid or expired. Request a new code.", error: true, success: false });
    }
    if (user.forgot_password_attempts >= 5) {
      return response.status(429).json({ message: "Too many incorrect attempts. Request a new code.", error: true, success: false });
    }
    const submittedHash = crypto.createHash("sha256").update(otp).digest();
    const savedHash = Buffer.from(user.forgot_password_otp_hash, "hex");
    const matches = savedHash.length === submittedHash.length && crypto.timingSafeEqual(savedHash, submittedHash);
    if (!matches) {
      user.forgot_password_attempts += 1;
      if (user.forgot_password_attempts >= 5) {
        user.forgot_password_otp_hash = "";
        user.forgot_password_expiry = null;
      }
      await user.save();
      return response.status(user.forgot_password_attempts >= 5 ? 429 : 400).json({
        message: user.forgot_password_attempts >= 5 ? "Too many incorrect attempts. Request a new code." : "Invalid code",
        error: true,
        success: false
      });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenHash = crypto.createHash("sha256").update(resetToken).digest("hex");
    const resetSession = await UserModel.findOneAndUpdate(
      {
        _id: user._id,
        forgot_password_otp_hash: user.forgot_password_otp_hash,
        forgot_password_expiry: { $gt: new Date() },
        forgot_password_attempts: { $lt: 5 }
      },
      {
        $set: {
          forgot_password_otp: "",
          forgot_password_otp_hash: "",
          forgot_password_attempts: 0,
          forgot_password_expiry: null,
          password_reset_token_hash: resetTokenHash,
          password_reset_expires_at: new Date(Date.now() + 10 * 60 * 1000)
        }
      },
      { new: true }
    ).select("_id");
    if (!resetSession) {
      return response.status(400).json({ message: "Code is invalid, expired or already used. Request a new code.", error: true, success: false });
    }
    return response.json({
      message: "Code verified. Set a new password within 10 minutes.",
      error: false,
      success: true,
      data: { resetToken }
    });
  } catch {
    return response.status(500).json({ message: "Unable to verify password reset code", error: true, success: false });
  }
}

// Reset password requires the short-lived token issued after OTP verification.
export async function resetpassword(request,response){
    try {
        const email = String(request.body?.email || "").trim().toLowerCase();
        const { newPassword, confirmPassword, resetToken } = request.body || {}
        if (!email || !newPassword || !confirmPassword || !resetToken) {
            return response.status(400).json({ message: "Provide email, new password, confirmation and reset token", error: true, success: false })
        }
        if (String(newPassword).length < 8 || String(newPassword).length > 128) {
            return response.status(400).json({ message: "Password must be between 8 and 128 characters", error: true, success: false })
        }
        if (newPassword !== confirmPassword) {
            return response.status(400).json({ message: "New password and confirmation must match", error: true, success: false })
        }
        const resetTokenHash = crypto.createHash("sha256").update(String(resetToken)).digest("hex")
        const user = await UserModel.findOne({
            email,
            password_reset_token_hash: resetTokenHash,
            password_reset_expires_at: { $gt: new Date() }
        }).select("+password_reset_token_hash +password_reset_expires_at")
        if (!user) {
            return response.status(400).json({ message: "Password reset session is invalid or expired. Verify your OTP again.", error: true, success: false })
        }

        const salt = await bcrypt.genSalt(10)
        const hashPassword = await bcrypt.hash(newPassword, salt)
        const updatedUser = await UserModel.findOneAndUpdate(
            {
                _id: user._id,
                password_reset_token_hash: resetTokenHash,
                password_reset_expires_at: { $gt: new Date() }
            },
            {
                $set: {
                    password: hashPassword,
                    password_reset_token_hash: "",
                    password_reset_expires_at: null,
                    refresh_token: ""
                }
            },
            { new: true }
        ).select("_id");
        if (!updatedUser) {
            return response.status(400).json({ message: "Password reset session is invalid, expired or already used. Verify your OTP again.", error: true, success: false });
        }
        const isProduction = process.env.NODE_ENV === "production";
        const cookieOptions = { httpOnly: true, secure: isProduction, sameSite: isProduction ? "none" : "lax", path: "/" };
        response.clearCookie("accessToken", cookieOptions);
        response.clearCookie("refreshToken", cookieOptions);
        return response.json({ message: "Password updated successfully. Please log in again.", error: false, success: true })
    } catch (error) {
        return response.status(500).json({ message: error.message || error, error: true, success: false })
    }
}

//refresh token controler
export async function refreshToken(request,response){
    try {
        const refreshToken = request.cookies.refreshToken || request.headers?.authorization?.split(" ")[1];
        if (!refreshToken) {
            return response.status(401).json({ message: "Refresh token is required", error: true, success: false });
        }

        const refreshSecret = process.env.SECRET_KEY_REFRESH_TOKEN || process.env.JWT_SECRET;
        if (!refreshSecret) {
            return response.status(500).json({ message: "Refresh-token secret is not configured", error: true, success: false });
        }
        const decoded = jwt.verify(refreshToken, refreshSecret, { algorithms: ["HS256"] });
        const refreshTokenHash = crypto.createHash("sha256").update(refreshToken).digest("hex");
        const user = await UserModel.findOne({ _id: decoded.id, refresh_token: refreshTokenHash }).select("+refresh_token");
        if (!user || user.status !== "active") {
            return response.status(401).json({ message: "Refresh token is invalid or revoked", error: true, success: false });
        }

        const newAccessToken = await generateAccessToken(user._id);
        const isProduction = process.env.NODE_ENV === "production";
        response.cookie("accessToken", newAccessToken, {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? "none" : "lax",
            path: "/"
        });

        return response.json({
            message: "Session refreshed",
            error: false,
            success: true
        });
    } catch (error) {
        return response.status(401).json({ message: "Refresh token is invalid or expired", error: true, success: false });
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

    const user = await UserModel.findById(userId).select(
      "name email mobile avatar verify_email last_login_date status address_details shopping_cart orderHistory role createdAt updatedAt"
    );

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
