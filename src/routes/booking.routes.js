import express from "express";
import {
    create,
    getMine,
    getById,
    cancel,
} from "../controllers/booking.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post(
    "/",
    authenticate,
    create
);

router.get(
    "/my",
    authenticate,
    getMine
);

router.get(
    "/:id",
    authenticate,
    getById
);

router.post(
    "/:id/cancel",
    authenticate,
    cancel
);

export default router;