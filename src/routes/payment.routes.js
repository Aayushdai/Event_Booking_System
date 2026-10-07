import express from "express";
import { create, complete, esewaSuccess, esewaForm, esewaFailure } from "../controllers/payment.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post(
    "/",
    authenticate,
    create
);

router.post(
    "/complete",
    authenticate,
    complete
);
router.get(
    "/esewa/success",
    esewaSuccess
);
router.get(
    "/esewa/failure",
    esewaFailure
);
router.get("/:id/esewa", authenticate, esewaForm);

export default router;