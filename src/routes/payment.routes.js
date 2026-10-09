import express from "express";
import { create, complete, esewaSuccess, esewaForm, esewaFailure } from "../controllers/payment.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { paymentLimiter } from "../middleware/ratelimit.middleware.js";

const router = express.Router();

router.post(
    "/",
    paymentLimiter,
    authenticate,
    create
);

router.post(
    "/complete",
    paymentLimiter,
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
router.get("/:id/esewa", paymentLimiter,authenticate, esewaForm);

export default router;