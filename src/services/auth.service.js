import bcrypt from "bcrypt";
import { generateAccessToken } from "../utils/jwt.js";
import User from "../models/User.js";

export const registerUser = async ({name, email, password})=>{
    const existingUser = await User.findOne({
        where: { email },
    });

    if (existingUser) {
        throw new Error("User with this email already exists");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
        name,
        email,
        password: hashedPassword,
    });

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