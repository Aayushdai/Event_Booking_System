import Event from "../models/Event.js";
import Venue from "../models/Venue.js";

export const createEvent = async ({
    venue_id,
    title,
    description,
    start_time,
    end_time,
    status,
}) => {
    const venue = await Venue.findByPk(venue_id);

    if (!venue) {
        throw new Error("Venue not found");
    }

    const event = await Event.create({
        venue_id,
        title,
        description,
        start_time,
        end_time,
        status,
    });

    return event;
};

export const getAllEvents = async () => {
    return await Event.findAll({
        include: [
            {
                model: Venue,
                attributes: ["id", "name", "location"],
            },
        ],
        order: [["id", "ASC"]],
    });
};

export const getEventById = async (id) => {
    return await Event.findByPk(id, {
        include: [
            {
                model: Venue,
                attributes: ["id", "name", "location"],
            },
        ],
    });
};

export const updateEvent = async (
    id,
    {
        venue_id,
        title,
        description,
        start_time,
        end_time,
        status,
    }
) => {
    const event = await Event.findByPk(id);

    if (!event) {
        throw new Error("Event not found");
    }

    const venue = await Venue.findByPk(venue_id);

    if (!venue) {
        throw new Error("Venue not found");
    }

    await event.update({
        venue_id,
        title,
        description,
        start_time,
        end_time,
        status,
    });

    return event;
};

export const deleteEvent = async (id) => {
    const event = await Event.findByPk(id);

    if (!event) {
        throw new Error("Event not found");
    }

    await event.destroy();

    return event;
};