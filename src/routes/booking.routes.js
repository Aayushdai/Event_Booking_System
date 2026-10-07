import express from "express";
import { create } from "../controllers/booking.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = express.Router();

// Authenticated user: create booking
router.post(
    "/",
    authenticate,
    create
);

export default router;