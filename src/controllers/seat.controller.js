import { createSeat, getSeatById,getSeatsByVenue,updateSeat,deleteSeat } from "../services/seat.service.js";

export const create = async (req, res) => {
    try {
        const { venue_id, seat_number, seat_type } = req.body;

        if(!venue_id || !seat_number || !seat_type) {
            return res.status(400).json({
                message: "Venue ID, seat number and seat type are required",
            });
        }
        const seat = await createSeat({ venue_id, seat_number, seat_type });
        res.status(201).json(seat);
    } catch (error) {
        if (error.message === "Venue not found") {
            return res.status(404).json({
                message: "Venue not found",
            });
        }

        if (error.message === "Seat already exists in this venue") {
            return res.status(409).json({
                message: "Seat already exists in this venue",
            });
        }

        console.error("Error creating seat:", error);

        return res.status(500).json({
            message: "Internal server error",
        });
    }
};

export const getByVenue = async (req, res) => {
    try {
        const { venue_id } = req.params;
        if (!venue_id) {
            return res.status(400).json({
                message: "Venue ID is required",
            });
        }
        const seats = await getSeatsByVenue(venue_id);
        res.status(200).json(seats);
    } catch (error) {
        console.error("Error fetching seats by venue:", error);
        res.status(500).json({
            message: "Internal server error",
        });
    }
};

export const getById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({
                message: "Seat ID is required",
            });
        }
        const seat = await getSeatById(id);
        if (!seat) {
            return res.status(404).json({
                message: "Seat not found",
            });
        }
        res.status(200).json(seat);
    } catch (error) {
        console.error("Error fetching seat by ID:", error);
        res.status(500).json({
            message: "Internal server error",
        });
    }
};

export const update = async (req, res) => {
    try {
        
        const { seat_number, seat_type } = req.body;

        if (!seat_number || !seat_type) {
            return res.status(400).json({
                message: "Seat number and seat type are required",
            });
        }
        const seat = await updateSeat(req.params.id, { seat_number, seat_type });
        res.status(200).json(seat);
    } catch (error) {
        if (error.message === "Seat not found") {
            return res.status(404).json({
                message: "Seat not found",
            });
        }
        if (error.message === "Seat already exists in this venue") {
            return res.status(409).json({
                message: "Seat already exists in this venue",
            });
        }

        console.error("Error updating seat:", error);

        return res.status(500).json({
            message: "Internal server error",
        });
    }
};

export const remove = async (req, res) => {
    try {
        const seat = await deleteSeat(req.params.id);
        res.status(200).json({
            message: "Seat deleted successfully",
            seat,
        });
    } catch (error) {
        if (error.message === "Seat not found") {
            return res.status(404).json({   
                message: "Seat not found",
            });
        }
        console.error("Error deleting seat:", error);
        return res.status(500).json({
            message: "Internal server error",
        });
    }
};