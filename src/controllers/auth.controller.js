import {registerUser} from "../services/auth.service.js";

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