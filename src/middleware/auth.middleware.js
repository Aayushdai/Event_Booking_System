import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import logger from "../utils/logger.js";

dotenv.config();

export const authenticate = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({
                message: "Authorization header missing",
            });
        }

        const token = authHeader.split(" ")[1];

        if (!token) {
            return res.status(401).json({
                message: "Token missing",
            });
        }

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        req.user = decoded;
        next();
    } catch (error) {
        logger.warn(
            {
                err: error,
                requestId: req.id,
                method: req.method,
                path: req.path,
            },
            "Authentication rejected"
        );

        return res.status(401).json({
            message: "Invalid or expired token",
        });
    }
};