import sequelize from "../config/db.js";
import Booking from "../models/Booking.js";
import BookingItem from "../models/BookingItem.js";
import Event from "../models/Event.js";
import EventSeat from "../models/EventSeat.js";
import Payment from "../models/Payment.js";
import User from "../models/User.js";
import Venue from "../models/Venue.js";
import Seat from "../models/Seat.js";
import { getIO } from "../socket.js";

const emitSeatUpdate = ({
    event_id,
    event_seat_ids,
    status,
    hold_expires_at = null,
}) => {
    try {
        getIO()
            .to(`event:${event_id}`)
            .emit("seats:updated", {
                event_id,
                event_seat_ids,
                status,
                hold_expires_at,
            });
    } catch (socketError) {
        console.error(
            "Socket notification failed:",
            socketError
        );
    }
};

export const createBooking = async ({
    user_id,
    event_id,
    event_seat_ids,
}) => {
    if (
        !Array.isArray(event_seat_ids) ||
        event_seat_ids.length === 0
    ) {
        throw new Error(
            "At least one seat must be selected"
        );
    }

    const seatIds = [...event_seat_ids]
        .map(Number)
        .filter(Number.isInteger);

    const uniqueSeatIds = [...new Set(seatIds)];

    if (
        uniqueSeatIds.length === 0 ||
        uniqueSeatIds.length !== event_seat_ids.length
    ) {
        throw new Error(
            "One or more event seats are invalid"
        );
    }

    uniqueSeatIds.sort((a, b) => a - b);

    const transaction = await sequelize.transaction();

    try {
        const event = await Event.findByPk(event_id, {
            transaction,
        });

        if (!event) {
            throw new Error("Event not found");
        }

        if (event.status !== "published") {
            throw new Error(
                "Event is not available for booking"
            );
        }

        const eventSeats = await EventSeat.findAll({
            where: {
                id: uniqueSeatIds,
                event_id,
            },
            transaction,
            lock: transaction.LOCK.UPDATE,
        });

        if (
            eventSeats.length !==
            uniqueSeatIds.length
        ) {
            throw new Error(
                "One or more event seats are invalid"
            );
        }

        const now = new Date();

        for (const eventSeat of eventSeats) {
            if (
                eventSeat.status === "held" &&
                eventSeat.hold_expires_at &&
                new Date(
                    eventSeat.hold_expires_at
                ) <= now
            ) {
                await eventSeat.update(
                    {
                        status: "available",
                        hold_expires_at: null,
                    },
                    {
                        transaction,
                    }
                );
            }
        }

        const unavailableSeat = eventSeats.find(
            (eventSeat) =>
                eventSeat.status !== "available"
        );

        if (unavailableSeat) {
            throw new Error(
                "One or more selected seats are unavailable"
            );
        }

        const totalAmount = eventSeats.reduce(
            (total, eventSeat) =>
                total + Number(eventSeat.price),
            0
        );

        const expiresAt = new Date(
            Date.now() + 20 * 1000
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

        const bookingItems = eventSeats.map(
            (eventSeat) => ({
                booking_id: booking.id,
                event_seat_id: eventSeat.id,
                price: eventSeat.price,
            })
        );

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
                    id: uniqueSeatIds,
                },
                transaction,
            }
        );

        await transaction.commit();

        emitSeatUpdate({
            event_id,
            event_seat_ids: uniqueSeatIds,
            status: "held",
            hold_expires_at: expiresAt,
        });

        return booking;
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
};

export const getMyBookings = async ({
    user_id,
}) => {
    return Booking.findAll({
        where: {
            user_id,
        },
        order: [["created_at", "DESC"]],
    });
};

export const getMyBookingById = async ({
    user_id,
    booking_id,
}) => {
    return Booking.findOne({
        where: {
            id: booking_id,
            user_id,
        },
        include: [
            {
                model: Event,
                include: [
                    {
                        model: Venue,
                        attributes: [
                            "id",
                            "name",
                        ],
                    },
                ],
            },
            {
                model: BookingItem,
                include: [
                    {
                        model: EventSeat,
                        include: [
                            {
                                model: Seat,
                                attributes: [
                                    "id",
                                    "seat_number",
                                    "seat_type",
                                ],
                            },
                        ],
                    },
                ],
            },
            {
                model: Payment,
            },
        ],
    });
};

export const cancelBooking = async ({
    user_id,
    booking_id,
}) => {
    const transaction = await sequelize.transaction();

    try {
        /*
         * Lock order:
         * Booking → Payment → EventSeat
         */

        const booking = await Booking.findOne({
            where: {
                id: booking_id,
                user_id,
            },
            transaction,
            lock: transaction.LOCK.UPDATE,
        });

        if (!booking) {
            throw new Error("Booking not found");
        }

        if (booking.status !== "pending") {
            throw new Error(
                "Only pending bookings can be cancelled"
            );
        }

        const payment = await Payment.findOne({
            where: {
                booking_id: booking.id,
            },
            transaction,
            lock: transaction.LOCK.UPDATE,
            order: [["created_at", "DESC"]],
        });

        const bookingItems = await BookingItem.findAll({
            where: {
                booking_id: booking.id,
            },
            transaction,
        });

        if (bookingItems.length === 0) {
            throw new Error("Booking has no items");
        }

        const sortedSeatIds = [
            ...new Set(
                bookingItems.map(
                    (item) => item.event_seat_id
                )
            ),
        ].sort((a, b) => a - b);

        const eventSeats = await EventSeat.findAll({
            where: {
                id: sortedSeatIds,
            },
            transaction,
            lock: transaction.LOCK.UPDATE,
        });

        if (eventSeats.length !== sortedSeatIds.length) {
            throw new Error(
                "One or more event seats not found"
            );
        }

        await EventSeat.update(
            {
                status: "available",
                hold_expires_at: null,
            },
            {
                where: {
                    id: sortedSeatIds,
                    status: "held",
                },
                transaction,
            }
        );

        if (
            payment &&
            payment.status === "pending"
        ) {
            await payment.update(
                {
                    status: "failed",
                },
                {
                    transaction,
                }
            );
        }

        await booking.update(
            {
                status: "cancelled",
                expires_at: null,
            },
            {
                transaction,
            }
        );

        await transaction.commit();

        emitSeatUpdate({
            event_id: booking.event_id,
            event_seat_ids: sortedSeatIds,
            status: "available",
            hold_expires_at: null,
        });

        return booking;
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
};



export const getAllBookingsAdmin = async () => {
    return Booking.findAll({
        order: [["created_at", "DESC"]],
        include: [
            {
                model: User,
                attributes: [
                    "id",
                    "name",
                    "email",
                    "role",
                ],
            },
            {
                model: Event,
                attributes: [
                    "id",
                    "title",
                    "description",
                    "venue_id",
                    "start_time",
                    "end_time",
                    "status",
                ],
                include: [
                    {
                        model: Venue,
                        attributes: [
                            "id",
                            "name",
                        ],
                    },
                ],
            },
            {
                model: BookingItem,
                include: [
                    {
                        model: EventSeat,
                        attributes: [
                            "id",
                            "event_id",
                            "seat_id",
                            "price",
                            "status",
                            "hold_expires_at",
                        ],
                        include: [
                            {
                                model: Seat,
                                attributes: [
                                    "id",
                                    "seat_number",
                                    "seat_type",
                                ],
                            },
                        ],
                    },
                ],
            },
            {
                model: Payment,
            },
        ],
    });
};

export const getAdminBookingById = async ({
    booking_id,
}) => {
    return Booking.findByPk(booking_id, {
        include: [
            {
                model: User,
                attributes: [
                    "id",
                    "name",
                    "email",
                    "role",
                ],
            },
            {
                model: Event,
                include: [
                    {
                        model: Venue,
                    },
                ],
            },
            {
                model: BookingItem,
                include: [
                    {
                        model: EventSeat,
                        include: [
                            {
                                model: Seat,
                            },
                        ],
                    },
                ],
            },
            {
                model: Payment,
            },
        ],
    });
};