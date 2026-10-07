import {
    createBooking,
    getMyBookings,
    getMyBookingById,
    cancelBooking,
} from "../services/booking.service.js";export const create = async (req, res) => {
    try {
        const { event_id, event_seat_ids } = req.body;

        if (!event_id || !Array.isArray(event_seat_ids) || event_seat_ids.length === 0) {
            return res.status(400).json({
                message: "Event ID and at least one event seat ID are required",
            });
        }

        const booking = await createBooking({
            user_id: req.user.id,
            event_id,
            event_seat_ids,
        });

        return res.status(201).json({
            message: "Booking created successfully",
            booking,
        });
    } catch (error) {
        if (error.message === "Event not found") {
            return res.status(404).json({
                message: "Event not found",
            });
        }

        if (error.message === "Event is not available for booking") {
            return res.status(400).json({
                message: "Event is not available for booking",
            });
        }

        if (error.message === "One or more event seats are invalid") {
            return res.status(400).json({
                message: "One or more event seats are invalid",
            });
        }

        if (error.message === "One or more selected seats are unavailable") {
            return res.status(409).json({
                message: "One or more selected seats are unavailable",
            });
        }

        console.error("Error creating booking:", error);

        return res.status(500).json({
            message: "Internal server error",
        });
    }


};

export const getMine = async (req, res) => {
    try {
        const bookings = await getMyBookings({
            user_id: req.user.id,
        });

        return res.status(200).json({
            bookings,
        });
    } catch (error) {
        console.error(
            "Error fetching user bookings:",
            error
        );

        return res.status(500).json({
            message: "Internal server error",
        });
    }
};

export const getById = async (req, res) => {
    try {
        const booking = await getMyBookingById({
            user_id: req.user.id,
            booking_id: req.params.id,
        });

        if (!booking) {
            return res.status(404).json({
                message: "Booking not found",
            });
        }

        return res.status(200).json(booking);
    } catch (error) {
        console.error(
            "Error fetching booking:",
            error
        );

        return res.status(500).json({
            message: "Internal server error",
        });
    }
};

export const cancel = async (req, res) => {
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
            return res.status(404).json({
                message: "Booking not found",
            });
        }

        if (
            error.message ===
            "Only pending bookings can be cancelled"
        ) {
            return res.status(400).json({
                message:
                    "Only pending bookings can be cancelled",
            });
        }

        if (error.message === "Booking has no items") {
            return res.status(400).json({
                message: "Booking has no items",
            });
        }

        if (
            error.message ===
            "One or more event seats not found"
        ) {
            return res.status(400).json({
                message:
                    "One or more event seats not found",
            });
        }

        console.error(
            "Error cancelling booking:",
            error
        );

        return res.status(500).json({
            message: "Internal server error",
        });
    }
};