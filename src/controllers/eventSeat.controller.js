
import {
    createEventSeat,
    getEventSeats,
    getEventSeatById,
    updateEventSeat,
    deleteEventSeat,
} from "../services/eventSeat.service.js";

export const create = async (req, res, next) => {
    try {
        const { event_id, seat_id, price } = req.body;

        if (!event_id || !seat_id || price === undefined) {
            return res.status(400).json({
                message: "Event ID, seat ID and price are required",
            });
        }

        if (price < 0) {
            return res.status(400).json({
                message: "Price cannot be negative",
            });
        }

        const eventSeat = await createEventSeat({
            event_id,
            seat_id,
            price,
        });

        return res.status(201).json({
            message: "Event seat created successfully",
            eventSeat,
        });
    } catch (error) {
        if (
            error.message === "Event not found" ||
            error.message === "Seat not found"
        ) {
            error.statusCode = 404;
        } else if (
            error.message === "Seat does not belong to event venue"
        ) {
            error.statusCode = 400;
        } else if (
            error.message === "Seat already added to this event"
        ) {
            error.statusCode = 409;
        } else {
            error.statusCode = 500;
        }

        return next(error);
    }
};

export const getByEvent = async (req, res, next) => {
    try {
        const { event_id } = req.params;

        if (!event_id) {
            return res.status(400).json({
                message: "Event ID is required",
            });
        }

        const eventSeats = await getEventSeats(event_id);

        return res.status(200).json({
            message: "Event seats retrieved successfully",
            eventSeats,
        });
    } catch (error) {
        error.statusCode =
            error.message === "Event not found" ? 404 : 500;

        return next(error);
    }
};

export const getById = async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({
                message: "Event seat ID is required",
            });
        }

        const eventSeat = await getEventSeatById(id);

        if (!eventSeat) {
            const error = new Error("Event seat not found");
            error.statusCode = 404;

            return next(error);
        }

        return res.status(200).json({
            message: "Event seat retrieved successfully",
            eventSeat,
        });
    } catch (error) {
        error.statusCode = 500;
        return next(error);
    }
};

export const update = async (req, res, next) => {
    try {
        const { price, status } = req.body;

        if (price === undefined || !status) {
            return res.status(400).json({
                message: "Price and status are required",
            });
        }

        if (price < 0) {
            return res.status(400).json({
                message: "Price cannot be negative",
            });
        }

        const eventSeat = await updateEventSeat(
            req.params.id,
            { price, status }
        );

        return res.status(200).json({
            message: "Event seat updated successfully",
            eventSeat,
        });
    } catch (error) {
        error.statusCode =
            error.message === "Event seat not found" ? 404 : 500;

        return next(error);
    }
};

export const remove = async (req, res, next) => {
    try {
        await deleteEventSeat(req.params.id);

        return res.status(200).json({
            message: "Event seat deleted successfully",
        });
    } catch (error) {
        if (error.message === "Event seat not found") {
            error.statusCode = 404;
        } else if (
            error.message === "Booked seat cannot be deleted"
        ) {
            error.statusCode = 400;
        } else {
            error.statusCode = 500;
        }

        return next(error);
    }
};
