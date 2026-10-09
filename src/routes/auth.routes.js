import express from "express";
import {register,login,getMe,logout,refresh, verify} from "../controllers/auth.controller.js";
import { authenticate} from "../middleware/auth.middleware.js";

import {
    registerLimiter,
    loginLimiter,
    refreshLimiter,
} from "../middleware/ratelimit.middleware.js";
    
const router = express.Router();

router.post("/register",registerLimiter, register);
router.post("/login", loginLimiter, login);
router.get("/me", authenticate, getMe);
router.post("/refresh", refreshLimiter, refresh);
router.post("/logout", authenticate, logout);
router.get("/verify-email",verify);
export default router;