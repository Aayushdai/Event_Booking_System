import { Op } from "sequelize";
import sequelize from "../config/db.js";
import Booking from "../models/Booking.js";
import BookingItem from "../models/BookingItem.js";
import EventSeat from "../models/EventSeat.js";
import Payment from "../models/Payment.js";
import { getIO } from "../socket.js";

const emitSeatUpdate = ({
    event_id,
    event_seat_ids,
}) => {
    try {
        getIO()
            .to(`event:${event_id}`)
            .emit("seats:updated", {
                event_id,
                event_seat_ids,
                status: "available",
                hold_expires_at: null,
            });
    } catch (socketError) {
        console.error(
            "Socket notification failed:",
            socketError
        );
    }
};

export const expireBookings = async () => {
    const now = new Date();

    const expiredCandidates = await Booking.findAll({
        attributes: ["id"],
        where: {
            status: "pending",
            expires_at: {
                [Op.lt]: now,
            },
        },
        order: [["id", "ASC"]],
    });

    let expiredCount = 0;
    const seatUpdates = [];

    for (const candidate of expiredCandidates) {
        const transaction =
            await sequelize.transaction();

        try {
            /*
             * Lock order:
             * Booking → Payment → EventSeat
             */

            const booking = await Booking.findOne({
                where: {
                    id: candidate.id,
                    status: "pending",
                },
                transaction,
                lock: transaction.LOCK.UPDATE,
            });

            if (!booking) {
                await transaction.rollback();
                continue;
            }

            if (
                !booking.expires_at ||
                new Date(booking.expires_at) > new Date()
            ) {
                await transaction.rollback();
                continue;
            }

            const payment = await Payment.findOne({
                where: {
                    booking_id: booking.id,
                },
                transaction,
                lock: transaction.LOCK.UPDATE,
                order: [["created_at", "DESC"]],
            });

            const bookingItems =
                await BookingItem.findAll({
                    where: {
                        booking_id: booking.id,
                    },
                    transaction,
                });

            const eventSeatIds = bookingItems
                .map(
                    (item) => item.event_seat_id
                )
                .sort((a, b) => a - b);

            if (eventSeatIds.length > 0) {
                await EventSeat.findAll({
                    where: {
                        id: eventSeatIds,
                    },
                    transaction,
                    lock: transaction.LOCK.UPDATE,
                });

                await EventSeat.update(
                    {
                        status: "available",
                        hold_expires_at: null,
                    },
                    {
                        where: {
                            id: eventSeatIds,
                            status: "held",
                        },
                        transaction,
                    }
                );
            }

            if (
                payment &&
                payment.status === "pending"
            ) {
                await payment.update(
                    {
                        status: "expired",
                    },
                    {
                        transaction,
                    }
                );
            }

            await booking.update(
                {
                    status: "expired",
                    expires_at: null,
                },
                {
                    transaction,
                }
            );

            await transaction.commit();

            expiredCount += 1;

            if (eventSeatIds.length > 0) {
                seatUpdates.push({
                    event_id: booking.event_id,
                    event_seat_ids: eventSeatIds,
                });
            }
        } catch (error) {
            await transaction.rollback();

            console.error(
                `Failed to expire booking ${candidate.id}:`,
                error
            );
        }
    }

    for (const update of seatUpdates) {
        emitSeatUpdate(update);
    }

    return expiredCount;
};