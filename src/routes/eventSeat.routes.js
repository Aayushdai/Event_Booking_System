import express from "express";
import {
    create,
    getByEvent,
    getById,
    update,
    remove,
} from "../controllers/eventSeat.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/role.middleware.js";

const router = express.Router();

// Admin: add a seat to an event
router.post(
    "/",
    authenticate,
    authorize("admin"),
    create
);

// Public: get all seats for an event
router.get(
    "/event/:event_id",
    getByEvent
);

// Public: get one event seat
router.get(
    "/:id",
    getById
);

// Admin: update event seat
router.put(
    "/:id",
    authenticate,
    authorize("admin"),
    update
);

// Admin: remove event seat
router.delete(
    "/:id",
    authenticate,
    authorize("admin"),
    remove
);

export default router;