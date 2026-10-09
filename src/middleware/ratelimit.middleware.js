import { rateLimit } from "express-rate-limit";

const skipDuringTests = () => process.env.NODE_ENV === "test";

export const registerLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 requests per windowMs
    message: "Too many accounts created from this IP, please try again after 15 minutes",
    skip: skipDuringTests,
    message: {
        message: "Too many registration attempts. Please try again later.",
    },
});

export const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Limit each IP to 10 requests per windowMs
    standardHeaders: "draft-8",
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    skip: skipDuringTests,
    message: {
        message: "Too many login attempts from this IP, please try again later.",
    },
});
export const refreshLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // Limit each IP to 20 requests per windowMs
    standardHeaders: "draft-8",
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    skip: skipDuringTests,
    message: {
        message: "Too many refresh attempts from this IP, please try again later.",
    },
});

export const bookingLimiter = rateLimit({
    windowMs: 60* 1000,
    max:10,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    skip: skipDuringTests,
    message: {
        message: "Too many booking attempts from this IP, please try again later.",
    },
});

export const paymentLimiter = rateLimit({
    windowMs: 15* 60* 1000,
    limit:5,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    skip: skipDuringTests,
    message: {
        message: "Too many payment attempts from this IP, please try again later.",
    },
});