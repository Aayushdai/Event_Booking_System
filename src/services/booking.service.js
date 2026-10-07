import sequelize from "../config/db.js";
import Booking from "../models/Booking.js";
import BookingItem from "../models/BookingItem.js";
import Event from "../models/Event.js";
import EventSeat from "../models/EventSeat.js";
import { getIO } from "../socket.js";

export const createBooking = async ({
    user_id,
    event_id,
    event_seat_ids,
}) => {
    const transaction = await sequelize.transaction();

    try {
        const event = await Event.findByPk(event_id, {
            transaction,
        });

        if (!event) {
            throw new Error("Event not found");
        }

        if (event.status !== "published") {
            throw new Error("Event is not available for booking");
        }

        const eventSeats = await EventSeat.findAll({
            where: {
                id: event_seat_ids,
                event_id,
            },
            transaction,
            lock: transaction.LOCK.UPDATE,
        });

        if (eventSeats.length !== event_seat_ids.length) {
            throw new Error("One or more event seats are invalid");
        }

        const now = new Date();

for (const eventSeat of eventSeats) {
    if (
        eventSeat.status === "held" &&
        eventSeat.hold_expires_at &&
        new Date(eventSeat.hold_expires_at) <= now
    ) {
        await eventSeat.update(
            {
                status: "available",
                hold_expires_at: null
            },
            {
                transaction
            }
        );
    }
}

const unavailableSeat = eventSeats.find(
    (eventSeat) => eventSeat.status !== "available"
);

if (unavailableSeat) {
    throw new Error("One or more selected seats are unavailable");
}

        const totalAmount = eventSeats.reduce(
            (total, eventSeat) => {
                return total + Number(eventSeat.price);
            },
            0
        );

        const expiresAt = new Date(
            Date.now() + 10 * 60 * 1000
        );

        const booking = await Booking.create(
            {
                user_id,
                event_id,
                total_amount: totalAmount,
                status: "pending",
                expires_at: expiresAt,
            },
            {
                transaction,
            }
        );

        const bookingItems = eventSeats.map((eventSeat) => ({
            booking_id: booking.id,
            event_seat_id: eventSeat.id,
            price: eventSeat.price,
        }));

        await BookingItem.bulkCreate(
            bookingItems,
            {
                transaction,
            }
        );

        await EventSeat.update(
            {
                status: "held",
                hold_expires_at: expiresAt,
            },
            {
                where: {
                    id: event_seat_ids,
                },
                transaction,
            }
        );

        await transaction.commit();
        getIO()
    .to(`event:${event_id}`)
    .emit("seats:updated", {
        event_id,
        event_seat_ids,
        status: "held",
        hold_expires_at: expiresAt,
    });

        return booking;
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
};