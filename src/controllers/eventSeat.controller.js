import {
    createEventSeat,
    getEventSeats,
    getEventSeatById,
    updateEventSeat,
    deleteEventSeat,
} from "../services/eventSeat.service.js";

export const create = async (req, res) => {
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
        if (error.message === "Event not found") {
            return res.status(404).json({
                message: "Event not found",
            });
        }

        if (error.message === "Seat not found") {
            return res.status(404).json({
                message: "Seat not found",
            });
        }

        if (error.message === "Seat does not belong to event venue") {
            return res.status(400).json({
                message: "Seat does not belong to event venue",
            });
        }

        if (error.message === "Seat already added to this event") {
            return res.status(409).json({
                message: "Seat already added to this event",
            });
        }

        console.error("Error creating event seat:", error);

        return res.status(500).json({
            message: "Internal server error",
        });
    }
};

export const getByEvent = async (req, res) => {
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
        if (error.message === "Event not found") {
            return res.status(404).json({
                message: "Event not found",
            });
        }

        console.error("Error retrieving event seats:", error);

        return res.status(500).json({
            message: "Internal server error",
        });
    }
};

export const getById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({
                message: "Event seat ID is required",
            });
        }

        const eventSeat = await getEventSeatById(id);

        if (!eventSeat) {
            return res.status(404).json({
                message: "Event seat not found",
            });
        }

        return res.status(200).json({
            message: "Event seat retrieved successfully",
            eventSeat,
        });
    } catch (error) {
        console.error("Error retrieving event seat:", error);

        return res.status(500).json({
            message: "Internal server error",
        });
    }
};

export const update = async (req, res) => {
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
        if (error.message === "Event seat not found") {
            return res.status(404).json({
                message: "Event seat not found",
            });
        }

        console.error("Error updating event seat:", error);

        return res.status(500).json({
            message: "Internal server error",
        });
    }
};

export const remove = async (req, res) => {
    try {
        await deleteEventSeat(req.params.id);

        return res.status(200).json({
            message: "Event seat deleted successfully",
        });
    } catch (error) {
        if (error.message === "Event seat not found") {
            return res.status(404).json({
                message: "Event seat not found",
            });
        }

        if (error.message === "Booked seat cannot be deleted") {
            return res.status(400).json({
                message: "Booked seat cannot be deleted",
            });
        }

        console.error("Error deleting event seat:", error);

        return res.status(500).json({
            message: "Internal server error",
        });
    }
};