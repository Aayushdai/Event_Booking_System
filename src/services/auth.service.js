import bcrypt from "bcrypt";
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