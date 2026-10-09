import {
    createEvent,
    getAllEvents,
    getEventById,
    updateEvent,
    deleteEvent,
} from "../services/event.service.js";

export const create = async (req, res, next) => {
    try {
        const {
            venue_id,
            title,
            description,
            start_time,
            end_time,
            status,
        } = req.body;

        if (!venue_id || !title || !start_time || !end_time) {
            return res.status(400).json({
                message: "Venue ID, title, start time and end time are required",
            });
        }

        if (new Date(start_time) >= new Date(end_time)) {
            return res.status(400).json({
                message: "Start time must be before end time",
            });
        }

        const event = await createEvent({
            venue_id,
            title,
            description,
            start_time,
            end_time,
            status,
        });

        return res.status(201).json({
            message: "Event created successfully",
            event,
        });
    } catch (error) {
        error.statusCode =
        error.message === "Venue not found" ? 404 : 500;
        return next(error);
    }
};

export const getAll = async (req, res) => {
    try {
        const events = await getAllEvents();

        return res.status(200).json({
            message: "Events retrieved successfully",
            events,
        });
    } catch (error) {
        error.statusCode = 500;
        return next(error);
    }
};

export const getById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({
                message: "Event ID is required",
            });
        }

        const event = await getEventById(id);

        if (!event) {
            return res.status(404).json({
                message: "Event not found",
            });
        }

        return res.status(200).json({
            message: "Event retrieved successfully",
            event,
        });
    } catch (error) {
        error.statusCode = 500;
        return next(error);
    }
};

export const update = async (req, res) => {
    try {
        const {
            venue_id,
            title,
            description,
            start_time,
            end_time,
            status,
        } = req.body;

        if (!venue_id || !title || !start_time || !end_time) {
            return res.status(400).json({
                message: "Venue ID, title, start time and end time are required",
            });
        }

        if (new Date(start_time) >= new Date(end_time)) {
            return res.status(400).json({
                message: "Start time must be before end time",
            });
        }

        const event = await updateEvent(req.params.id, {
            venue_id,
            title,
            description,
            start_time,
            end_time,
            status,
        });

        return res.status(200).json({
            message: "Event updated successfully",
            event,
        });
    } catch (error) {
        if(
            error.message === "Event not found" ||
            error.message === "Venue not found"
        ){
            error.statusCode = 404;
        }
        else {
            error.statusCode = 500;
        }
        return next(error);
    }
};

export const remove = async (req, res, next) => {
    try {
        await deleteEvent(req.params.id);

        return res.status(200).json({
            message: "Event deleted successfully",
        });
    } catch (error) {
        error.statusCode =
        error.message === "Event not found" ? 404 : 500;
        return next(error);
    }
};