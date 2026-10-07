import bcrypt from "bcrypt";
import { generateAccessToken } from "../utils/jwt.js";
import User from "../models/User.js";
import crypto from "crypto";
import { sendVerificationEmail } from "./email.service.js";

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

    const verificationLink =
    `http://localhost:3000/verify-email?token=${verificationToken}&email=${email}`;

    await sendVerificationEmail(email, verificationLink);

    return user;
}


export const loginUser = async ({ email, password })=>{
    const user = await User.findOne({
        where: { email },
    });
    if(!user){
        throw new Error("Invalid email or password");
    };

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if(!isPasswordValid){
        throw new Error("Invalid email or password");
    }

    const accessToken = generateAccessToken(user);

    return {
        user,
        accessToken,
    };  
};