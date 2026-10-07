import EventSeat from "../models/EventSeat.js";
import Event from "../models/Event.js";
import Seat from "../models/Seat.js";

export const createEventSeat = async ({
    event_id,
    seat_id,
    price,
}) => {
    const event = await Event.findByPk(event_id);

    if (!event) {
        throw new Error("Event not found");
    }

    const seat = await Seat.findByPk(seat_id);

    if (!seat) {
        throw new Error("Seat not found");
    }

    if (seat.venue_id !== event.venue_id) {
        throw new Error("Seat does not belong to event venue");
    }

    const existingEventSeat = await EventSeat.findOne({
        where: {
            event_id,
            seat_id,
        },
    });

    if (existingEventSeat) {
        throw new Error("Seat already added to this event");
    }

    const eventSeat = await EventSeat.create({
        event_id,
        seat_id,
        price,
        status: "available",
    });

    return eventSeat;
};

export const getEventSeats = async (event_id) => {
    const event = await Event.findByPk(event_id);

    if (!event) {
        throw new Error("Event not found");
    }

    return await EventSeat.findAll({
        where: {
            event_id,
        },
        include: [
            {
                model: Seat,
                attributes: [
                    "id",
                    "venue_id",
                    "seat_number",
                    "seat_type",
                ],
            },
        ],
        order: [["id", "ASC"]],
    });
};

export const getEventSeatById = async (id) => {
    return await EventSeat.findByPk(id, {
        include: [
            {
                model: Seat,
                attributes: [
                    "id",
                    "venue_id",
                    "seat_number",
                    "seat_type",
                ],
            },
        ],
    });
};

export const updateEventSeat = async (
    id,
    { price, status }
) => {
    const eventSeat = await EventSeat.findByPk(id);

    if (!eventSeat) {
        throw new Error("Event seat not found");
    }

    await eventSeat.update({
        price,
        status,
    });

    return eventSeat;
};

export const deleteEventSeat = async (id) => {
    const eventSeat = await EventSeat.findByPk(id);

    if (!eventSeat) {
        throw new Error("Event seat not found");
    }

    if (eventSeat.status === "booked") {
        throw new Error("Booked seat cannot be deleted");
    }

    await eventSeat.destroy();

    return eventSeat;
};