
import {
    createBooking,
    getMyBookings,
    getMyBookingById,
    cancelBooking,
} from "../services/booking.service.js";

export const create = async (req, res, next) => {
    try {
        const { event_id, event_seat_ids } = req.body;

        if (
            !event_id ||
            !Array.isArray(event_seat_ids) ||
            event_seat_ids.length === 0
        ) {
            return res.status(400).json({
                message:
                    "Event ID and at least one event seat ID are required",
            });
        }

        const booking = await createBooking({
            user_id: req.user.id,
            event_id,
            event_seat_ids,
            idempotency_key: req.get("Idempotency-Key"),
        });

        return res.status(201).json({
            message: "Booking created successfully",
            booking,
        });
    } catch (error) {
        if (error.message === "Event not found") {
            error.statusCode = 404;
        } else if (
            error.message === "Event is not available for booking" ||
            error.message === "One or more event seats are invalid"
        ) {
            error.statusCode = 400;
        } else if (
            error.message ===
                "One or more selected seats are unavailable" ||
            error.message ===
                "Idempotency key already used for a different request"
        ) {
            error.statusCode = 409;
        } else if (
            error.message ===
            "Idempotency key must be between 1 and 128 characters"
        ) {
            error.statusCode = 400;
        } else if (!error.statusCode) {
            error.statusCode = 500;
        }

        return next(error);
    }
};

export const getMine = async (req, res, next) => {
    try {
        const bookings = await getMyBookings({
            user_id: req.user.id,
        });

        return res.status(200).json({
            bookings,
        });
    } catch (error) {
        return next(error);
    }
};

export const getById = async (req, res, next) => {
    try {
        const booking = await getMyBookingById({
            user_id: req.user.id,
            booking_id: req.params.id,
        });

        if (!booking) {
            const error = new Error("Booking not found");
            error.statusCode = 404;

            return next(error);
        }

        return res.status(200).json(booking);
    } catch (error) {
        return next(error);
    }
};

export const cancel = async (req, res, next) => {
    try {
        const booking = await cancelBooking({
            user_id: req.user.id,
            booking_id: req.params.id,
        });

        return res.status(200).json({
            message: "Booking cancelled successfully",
            booking,
        });
    } catch (error) {
        if (error.message === "Booking not found") {
            error.statusCode = 404;
        } else if (
            error.message === "Only pending bookings can be cancelled" ||
            error.message === "Booking has no items" ||
            error.message === "One or more event seats not found"
        ) {
            error.statusCode = 400;
        } else if (!error.statusCode) {
            error.statusCode = 500;
        }

        return next(error);
    }
};
