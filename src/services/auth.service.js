import bcrypt from "bcrypt";
import { generateAccessToken } from "../utils/jwt.js";
import User from "../models/User.js";
import crypto from "crypto";
import { sendVerificationEmail } from "./email.service.js";

const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

const hashRefreshToken = (token) => 
    crypto.createHash("sha256").update(token).digest("hex");

const generateRefreshToken = () =>
    crypto.randomBytes(64).toString("hex");

const canBypassEmailVerification = () =>
    process.env.NODE_ENV !== "production" &&
    process.env.BYPASS_EMAIL_VERIFICATION === "true";


export const registerUser = async ({name, email, password})=>{
    const existingUser = await User.findOne({
        where: { email },
    });

    if (existingUser) {
        throw new Error("User with this email already exists");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const verificationToken = crypto.randomBytes(32).toString("hex");
    
    const verificationExpires = new Date(
        Date.now() + 30 * 60  * 1000
    );

    const user = await User.create({
        name,
        email,
        password: hashedPassword,
        email_verification_token: verificationToken,
        email_verification_expires: verificationExpires,
    });

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const verificationLink =
    `${frontendUrl}/verify-email?token=${verificationToken}&email=${email}`;

    if( process.env.NODE_ENV !== "test"){
    try{
        await sendVerificationEmail(email, verificationLink);

    }catch(error){
        await User.destroy({
            where: {id: user.id},
        });
        throw error;
    }
}

    return user;
};

export const verifyEmail = async({email,token})=> {
    const user = await User.findOne({
        where: {
            email,
            email_verification_token: token,
        },
    });
    if(!user){
        throw new Error("invalid verification link");
    }
    if(
        !user.email_verification_expires ||
        new Date(user.email_verification_expires)<= new Date()
    ){
        throw new Error("Verification link has expired");
    }
    user.email_verified = true;
    user.email_verification_token = null;
    user.email_verification_expires = null;
     await user.save();

     return user;
}


export const loginUser = async ({ email, password }) => {
    const user = await User.findOne({
        where: { email },
    });

    if (!user) {
        throw new Error("Invalid email or password");
    }

    const isPasswordValid = await bcrypt.compare(
        password,
        user.password
    );

    if (!isPasswordValid) {
        throw new Error("Invalid email or password");
    }

    if (!user.email_verified && !canBypassEmailVerification()) {
        throw new Error(
            "Please verify your email before logging in"
        );
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken();

    user.refresh_token_hash = hashRefreshToken(refreshToken);
    user.refresh_token_expires = new Date(
        Date.now() + REFRESH_TOKEN_TTL_MS
    );

    await user.save();

    return {
        user,
        accessToken,
        refreshToken,
    };
};

export const refreshAccessToken = async ({ refreshToken})=> {
    if(!refreshToken){
        throw new Error("Refresh token missing");
    }
    const oldTokenHash = hashRefreshToken(refreshToken);

    const user = await User.findOne({
        where: { refresh_token_hash: oldTokenHash},
    });
    if(!user){
        throw new Error("Invalid or expired refresh token");
    }
    if(!user.refresh_token_expires || new Date(user.refresh_token_expires)<= new Date() ||
!user.email_verified){
    await User.update({
        refresh_token_hash: null,
        refresh_token_expires: null,
    },{
        where: {
            id: user.id,
            refresh_token_hash: oldTokenHash,
        },
    }
    );
    throw new Error("Invalid or expired refresh token");
}

const newRefreshToken = generateRefreshToken();

const [updatedCount] = await User.update({
    refresh_token_hash: hashRefreshToken(newRefreshToken),
    refresh_token_expires: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
},{
    where: {
        id: user.id,
        refresh_token_hash: oldTokenHash,
    },
}
);
    if(updatedCount !==1 ){
        throw new Error("Failed to update refresh token");
    }
    return {
        user,
        accessToken: generateAccessToken(user),
        refreshToken: newRefreshToken,
    };
};

export const logoutUser = async ({ refreshToken})=> {
    if(!refreshToken){
        return;
    }
    const tokenHash = hashRefreshToken(refreshToken);

    await User.update({
        refresh_token_hash: null,
        refresh_token_expires: null,
    },{
        where: { refresh_token_hash: tokenHash},
    });
};
