import express from "express";
import {
    create,
    getAll,
    getById,
    update,
    remove
} from "../controllers/venue.controller.js";
import { authenticate} from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/role.middleware.js";

const router = express.Router();

router.post("/", authenticate,authorize('admin'), create);
router.get("/", getAll);
router.get("/:id", getById);
router.put("/:id", authenticate,authorize('admin'), update);
router.delete("/:id", authenticate,authorize('admin'), remove);

export default router;