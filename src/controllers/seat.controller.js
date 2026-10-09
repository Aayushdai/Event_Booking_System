import { createSeat, getSeatById,getSeatsByVenue,updateSeat,deleteSeat } from "../services/seat.service.js";

export const create = async (req, res, next) => {
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
        if(error.message === "Venue not found") {
            error.statusCode = 404;
        } else if(error.message === "Seat already exists in this venue") {
            error.statusCode = 409;
        }else{
            error.statusCode = 500;
        }

        return next(error);
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
        error.statusCode = 500;
        return nexrt(error);
    }
};

export const getById = async (req, res, next) => {
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
        error.statusCode = 500;
        return next(error);
    }
};

export const update = async (req, res, next) => {
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
        if(error.message === "Seat not found") {
            error.statusCode = 404;
        }else if(error.message === "Seat already exists in this venue") {
            error.statusCode = 409;
        }else{
            error.statusCode = 500;
        }
        return next(error);
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
        error.statusCode =
        error.message === "Seat not found" ? 404 : 500;
        return next(error);
    }
};