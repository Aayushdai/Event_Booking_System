import express from "express";
import {
    create,
    getAll,
    getById,
    update,
    remove,
} from "../controllers/event.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/role.middleware.js";

const router = express.Router();

// Admin: create event
router.post(
    "/",
    authenticate,
    authorize("admin"),
    create
);

// Public: get all events
router.get(
    "/",
    getAll
);

// Public: get one event
router.get(
    "/:id",
    getById
);

// Admin: update event
router.put(
    "/:id",
    authenticate,
    authorize("admin"),
    update
);

// Admin: delete event
router.delete(
    "/:id",
    authenticate,
    authorize("admin"),
    remove
);

export default router;