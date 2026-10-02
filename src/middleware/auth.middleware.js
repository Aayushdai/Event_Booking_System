import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

export const authenticate =(req,res,next)=>{
    try{
        const authHeader = req.headers.authorization;
        if(!authHeader){

            return res.status(401).json({
                message:"Authorization header missing"
            })
        }
        const token = authHeader.split(" ")[1];
        if(!token){
            return res.status(401).json({
                message:"Token missing"
            })
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;

        next();

    }catch(error){
        console.error("Error authenticating user:", error);
        return res.status(401).json({
            message:"Invalid or expired token"
        });
    }
};