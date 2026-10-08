import express from "express";
import {register,login,getMe, verify} from "../controllers/auth.controller.js";
import { authenticate} from "../middleware/auth.middleware.js";


const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", authenticate, getMe);
router.get("/verify-email",verify);
export default router;