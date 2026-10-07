import { createBooking } from "../services/booking.service.js";

export const create = async (req, res) => {
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