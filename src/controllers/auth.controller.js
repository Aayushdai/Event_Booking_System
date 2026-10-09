import {
    registerUser,
    loginUser,
    verifyEmail,
    refreshAccessToken,
    logoutUser,
} from "../services/auth.service.js";

import User from "../models/User.js";

import {
    registerSchema,
    loginSchema,
} from "../validators/auth.validator.js";

const REFRESH_TOKEN_COOKIE = "refreshToken";
const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

const refreshCookieOptions = () => ({
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/auth",
    maxAge: REFRESH_TOKEN_TTL_MS,
});

const clearRefreshCookieOptions = () => {
    const { maxAge, ...options } = refreshCookieOptions();
    return options;
};

export const register = async (req, res, next) => {
    const validation = registerSchema.safeParse(req.body);

    if (!validation.success) {
        return res.status(400).json({
            message: "Validation failed",
            errors: validation.error.issues,
        });
    }

    try {
        const user = await registerUser(validation.data);

        return res.status(201).json({
            message: "User registered successfully",
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                email_verified: user.email_verified,
            },
        });
    } catch (error) {
        if (error.message === "User with this email already exists") {
            error.statusCode = 409;
        } else if (error.code === "EMAIL_SERVICE_UNAVAILABLE") {
            error.statusCode = 503;
            error.message =
                "Email service unavailable. Please try again later.";
        } else {
            error.statusCode = 500;
        }

        return next(error);
    }
};

export const login = async (req, res, next) => {
    const validation = loginSchema.safeParse(req.body);

    if (!validation.success) {
        return res.status(400).json({
            message: "Validation failed",
            errors: validation.error.issues,
        });
    }

    try {
        const { user, accessToken, refreshToken } =
            await loginUser(validation.data);

        res.cookie(
            REFRESH_TOKEN_COOKIE,
            refreshToken,
            refreshCookieOptions()
        );

        return res.status(200).json({
            message: "Login successful",
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            email_verified: user.email_verified,
            accessToken,
        });
    } catch (error) {
        if (error.message === "Invalid email or password") {
            error.statusCode = 401;
        } else if (
            error.message === "Please verify your email before logging in"
        ) {
            error.statusCode = 403;
        } else {
            error.statusCode = 500;
        }

        return next(error);
    }
};

export const refresh = async (req, res, next) => {
    const refreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE];

    if (!refreshToken) {
        const error = new Error("Refresh token missing");
        error.statusCode = 401;
        return next(error);
    }

    try {
        const {
            accessToken,
            refreshToken: newRefreshToken,
        } = await refreshAccessToken({ refreshToken });

        res.cookie(
            REFRESH_TOKEN_COOKIE,
            newRefreshToken,
            refreshCookieOptions()
        );

        return res.status(200).json({
            message: "Access token refreshed successfully",
            accessToken,
        });
    } catch (error) {
        if (
            error.message === "Invalid or expired refresh token" ||
            error.message === "Refresh token missing"
        ) {
            error.statusCode = 401;
            error.message = "Invalid or expired refresh token";
        } else {
            error.statusCode = 500;
        }

        return next(error);
    }
};

export const logout = async (req, res, next) => {
    try {
        await logoutUser({
            refreshToken: req.cookies?.[REFRESH_TOKEN_COOKIE],
        });

        res.clearCookie(
            REFRESH_TOKEN_COOKIE,
            clearRefreshCookieOptions()
        );

        return res.status(200).json({
            message: "Logged out successfully",
        });
    } catch (error) {
        error.statusCode = 500;
        return next(error);
    }
};

export const verify = async (req, res, next) => {
    const { email, token } = req.query;

    if (!email || !token) {
        return res.status(400).json({
            message: "Email and verification token are required",
        });
    }

    try {
        await verifyEmail({ email, token });

        return res.status(200).json({
            message: "Email verified successfully",
        });
    } catch (error) {
        if (error.message === "invalid verification link") {
            error.statusCode = 400;
            error.message = "Invalid verification link";
        } else if (error.message === "Verification link has expired") {
            error.statusCode = 400;
        } else {
            error.statusCode = 500;
        }

        return next(error);
    }
};

export const getMe = async (req, res, next) => {
    try {
        const user = await User.findByPk(req.user.id);

        if (!user) {
            const error = new Error("User not found");
            error.statusCode = 404;
            return next(error);
        }

        return res.status(200).json({
            message: "User retrieved successfully",
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                email_verified: user.email_verified,
            },
        });
    } catch (error) {
        error.statusCode = 500;
        return next(error);
    }
};