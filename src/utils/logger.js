import pino from "pino";

const logger = pino({
    level:
    process.env.NODE_ENV === "test"
    ? "silent"
    : process.env.LOG_LEVEL || "info",

    timestamp: pino.stdTimeFunctions.isoTime,

    redact: {
        paths: [
            "req.headers.authorization",
            "req.headers.cookie",
            "res.headers.set-cookie",
            "password",
            "refreshToken",
            "refresh_token",
            "email_verification_token",

        ],
        censor: "[REDACTED]",
    },
});

export default logger;