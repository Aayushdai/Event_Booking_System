import {registerUser, loginUser} from "../services/auth.service.js";
import User from "../models/User.js";
export const register = async (req,res)=> {
    try{
        const {name, email, password} = req.body;
        if(!name || !email || !password){
            return res.status(400).json({message:"Name, email and password are required"});
        }

        const user = await registerUser({name, email, password});
        res.status(201).json({message:"User registered successfully", user});



    }catch(error){
            console.error("Error registering user:", error);
            res.status(500).json({message:"Internal server error"});
    }

}
export const login = async (req,res)=> {
    try{
        const {email, password} = req.body;
        if(!email || !password){
            return res.status(400).json({message:"Email and password are required"});
        }

        const {user, accessToken} = await loginUser({email, password});
        res.status(200).json({message:"Login successful",id:user.id, name: user.name, email:user.email, role: user.role, email_verified: user.email_verified, accessToken});
    }catch(error){
        console.error("Error logging in user:", error);
        if(error.message === "Invalid email or password"){
            return res.status(401).json({
                message:"Invalid email or password"
            })
        }
        return res.status(500).json({
            message:"Internal server error"
            })
    }
}

export const getMe= async (req,res)=>{
    try{
        const user = await User.findByPk(req.user.id);
        if(!user){
            return res.status(404).json({
                message: "User not found"
            });
        }
        return res.status(200).json({
            message: "User retrieved successfully",
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                email_verified: user.email_verified
            }
        });
    }catch(error){
        console.error("Error retrieving user:", error);
        return res.status(500).json({
            message: "Internal server error"
        });
    }
}