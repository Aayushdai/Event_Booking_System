import express from "express";
import {
    create,
    getByVenue,
    getById,
    update,
    remove,
} from "../controllers/seat.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/role.middleware.js";

const router = express.Router();

// Admin: create seat
router.post(
    "/",
    authenticate,
    authorize("admin"),
    create
);

// Public: get all seats of a venue
router.get(
    "/venue/:venue_id",
    getByVenue
);

// Public: get one seat
router.get(
    "/:id",
    getById
);

// Admin: update seat
router.put(
    "/:id",
    authenticate,
    authorize("admin"),
    update
);

// Admin: delete seat
router.delete(
    "/:id",
    authenticate,
    authorize("admin"),
    remove
);

export default router;