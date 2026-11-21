import sendEmail from '../config/sendEmail.js';
import UserModel from '../models/user.model.js';
import bcrypt from 'bcryptjs';
import verifyEmailTemplate from '../utils/verifyEmailTemplate.js';
import generatedRefreshToken from '../utils/generatedRefreshToken.js';
import uploadImageClodinary from '../utils/uploadImageClodinary.js';
import generatedOtp from '../utils/generatedOtp.js';
import forgotPasswordTemplate from '../utils/forgotPasswordTemplate.js';
import jwt from "jsonwebtoken"
import generateAccessToken from '../utils/generatedAccessToken.js';

const authCookieOptions = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    path: '/',
  };
};


// ===============================================
// REGISTER USER
// ===============================================
export async function registerUserController(request, response) {
  try {
    const name = typeof request.body?.name === "string" ? request.body.name.trim() : "";
    const email = typeof request.body?.email === "string" ? request.body.email.trim().toLowerCase() : "";
    const password = request.body?.password;

    if (!name || !email || !password) {
      return response.status(400).json({ message: "Provide name, email, and password", error: true, success: false });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return response.status(400).json({ message: "Please provide a valid email address", error: true, success: false });
    }
    if (typeof password !== "string" || password.length < 8 || password.length > 128) {
      return response.status(400).json({ message: "Password must be between 8 and 128 characters", error: true, success: false });
    }

    let user = await UserModel.findOne({ email });
    if (user) {
      if (!user.verify_email) {
        return response.status(409).json({
          message: "This email is already registered but not verified. Request a new verification email.",
          error: true, success: false, data: { verificationRequired: true }
        });
      }
      return response.status(409).json({ message: "Email is already registered", error: true, success: false });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    user = await UserModel.create({ name, email, password: hashedPassword, verify_email: false });

    const frontendUrl = (process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/$/, "");
    const verifyEmailUrl = `${frontendUrl}/verify-email?code=${user._id}`;

    try {
      await sendEmail({
        sendTo: email,
        subject: "Verify your email - PrimeCommerce",
        html: verifyEmailTemplate({ name, url: verifyEmailUrl })
      });
    } catch (emailError) {
      console.error("Registration verification email failed:", emailError.message || emailError);
      return response.status(503).json({
        message: "Your account was created, but the verification email could not be sent. Configure Resend and request another verification email.",
        error: true, success: false, data: { accountCreated: true, verificationRequired: true }
      });
    }

    return response.status(201).json({
      message: "Account created. Please check your email and verify your address before logging in.",
      success: true, error: false,
      data: { userId: user._id, email: user.email, verify_email: user.verify_email }
    });
  } catch (error) {
    console.error("REGISTER ERROR:", error);
    return response.status(500).json({ message: error.message || "Registration failed", error: true, success: false });
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

    if (typeof code !== "string" || !/^[a-f\d]{24}$/i.test(code)) {
      return response.status(400).json({ message: "Invalid verification code", error: true, success: false });
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

export async function resendVerificationEmailController(request, response) {
  try {
    const email = typeof request.body?.email === "string" ? request.body.email.trim().toLowerCase() : "";
    if (!email) {
      return response.status(400).json({ message: "Email is required", error: true, success: false });
    }
    const user = await UserModel.findOne({ email });
    if (!user) {
      return response.status(404).json({ message: "No account found for this email", error: true, success: false });
    }
    if (user.verify_email) {
      return response.status(200).json({ message: "Email is already verified. You can log in.", error: false, success: true });
    }
    const frontendUrl = (process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/$/, "");
    const verifyEmailUrl = `${frontendUrl}/verify-email?code=${user._id}`;
    await sendEmail({
      sendTo: user.email,
      subject: "Verify your email - PrimeCommerce",
      html: verifyEmailTemplate({ name: user.name, url: verifyEmailUrl })
    });
    return response.json({ message: "A new verification email has been sent.", error: false, success: true });
  } catch (error) {
    console.error("RESEND VERIFICATION EMAIL ERROR:", error.message || error);
    return response.status(503).json({ message: "Unable to send verification email. Check the Resend configuration.", error: true, success: false });
  }
}

// ===============================================
// LOGIN USER
// ===============================================


export async function loginController(request, response) {
  try {
    const password = request.body?.password
    const email = typeof request.body?.email === 'string' ? request.body.email.trim().toLowerCase() : ''

    // 1️⃣ Validate input
    if (!email || !password) {
      return response.status(400).json({
        message: 'Email and password are required',
        error: true,
        success: false
      })
    }

    // 2️⃣ Check user
    const user = await UserModel.findOne({ email }).select('+password')

    if (!user) {
      return response.status(404).json({
        message: 'User not found',
        error: true,
        success: false
      })
    }

    // Require verified email before issuing authentication tokens.
    if (!user.verify_email) {
      return response.status(403).json({ message: 'Please verify your email before logging in. You can request a new verification email.', error: true, success: false, data: { verificationRequired: true } });
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

    // 5️⃣ Generate tokens
 const accessToken = await generateAccessToken(user._id)
const refreshToken = await generatedRefreshToken(user._id)


 const updateUser = await UserModel.findByIdAndUpdate(user?._id,{
            last_login_date : new Date()
        })


    // 6️⃣ Cookie options (ENV-safe)
    const cookieOptions = authCookieOptions()

    // 7️⃣ Set cookies
    response.cookie('accessToken', accessToken, cookieOptions)
    response.cookie('refreshToken', refreshToken, cookieOptions)

    // 8️⃣ Success response
    return response.status(200).json({
      message: 'Login successful',
      error: false,
      success: true,
      data: {
        userId: user._id,
        accessToken,
        refreshToken
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
    if (request.userId) {
      await UserModel.updateOne({ _id: request.userId }, { $set: { refresh_token: '' } });
    }
    // Clear both tokens
    const cookieOptions = authCookieOptions();

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

//update user details
export async function updateUserDetails(request,response){
    try {
        const userId = request.userId //auth middleware
        const { name, email, mobile, password } = request.body 

        let hashPassword = ""

        if(password){
            const salt = await bcrypt.genSalt(10)
            hashPassword = await bcrypt.hash(password,salt)
        }

        const updateUser = await UserModel.updateOne({ _id : userId},{
            ...(name && { name : name }),
            ...(email && { email : email }),
            ...(mobile && { mobile : mobile }),
            ...(password && { password : hashPassword })
        })

        return response.json({
            message : "Updated successfully",
            error : false,
            success : true,
            data : updateUser
        })


    } catch (error) {
        return response.status(500).json({
            message : error.message || error,
            error : true,
            success : false
        })
    }
}

//forgot password not login
export async function forgotPasswordController(request,response) {
    try {
        const { email } = request.body 

        const user = await UserModel.findOne({ email })

        if(!user){
            return response.status(400).json({
                message : "Email not available",
                error : true,
                success : false
            })
        }

        const otp = generatedOtp()
        const expireTime = new Date(Date.now() + 10 * 60 * 1000);

        await UserModel.findByIdAndUpdate(user._id, {
            forgot_password_otp: otp,
            forgot_password_expiry: expireTime,
            passwordResetVerifiedUntil: null
        })

        await sendEmail({
            sendTo : email,
            subject : "Forgot password from Binkeyit",
            html : forgotPasswordTemplate({
                name : user.name,
                otp : otp
            })
        })

        return response.json({
            message : "check your email",
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


//verify forgot password otp
export async function verifyForgotPasswordOtp(request,response){
    try {
        const { email , otp }  = request.body

        if(!email || !otp){
            return response.status(400).json({
                message : "Provide required field email, otp.",
                error : true,
                success : false
            })
        }

        const user = await UserModel.findOne({ email })

        if(!user){
            return response.status(400).json({
                message : "Email not available",
                error : true,
                success : false
            })
        }

        if (!user.forgot_password_expiry || user.forgot_password_expiry <= new Date()) {
            return response.status(400).json({
                message : "Otp is expired",
                error : true,
                success : false
            })
        }

        if(otp !== user.forgot_password_otp){
            return response.status(400).json({
                message : "Invalid otp",
                error : true,
                success : false
            })
        }

        //if otp is not expired
        //otp === user.forgot_password_otp

        const updateUser = await UserModel.findByIdAndUpdate(user._id, {
            forgot_password_otp: "",
            forgot_password_expiry: null,
            passwordResetVerifiedUntil: new Date(Date.now() + 10 * 60 * 1000)
        })
        
        return response.json({
            message : "Verify otp successfully",
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
            { $set: { password: hashPassword, passwordResetVerifiedUntil: null } },
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
export async function refreshToken(request, response) {
  try {
    const refreshToken = request.cookies?.refreshToken || request.headers?.authorization?.split(" ")[1];
    if (!refreshToken) {
      return response.status(401).json({ message: "Refresh token is required", error: true, success: false });
    }

    const decoded = jwt.verify(refreshToken, process.env.SECRET_KEY_REFRESH_TOKEN);
    const userId = decoded?.id;
    if (!userId) {
      return response.status(401).json({ message: "Invalid refresh token", error: true, success: false });
    }

    const user = await UserModel.findOne({ _id: userId, refresh_token: refreshToken }).select("+refresh_token");
    if (!user || user.status !== "active" || !user.verify_email) {
      return response.status(401).json({ message: "Refresh token is invalid or has been revoked", error: true, success: false });
    }

    const newAccessToken = await generateAccessToken(userId);
    response.cookie("accessToken", newAccessToken, authCookieOptions());
    return response.json({
      message: "New access token generated", error: false, success: true,
      data: { accessToken: newAccessToken }
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
      "-password -refresh_token"
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
