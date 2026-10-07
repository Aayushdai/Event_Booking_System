import {Op} from "sequelize";
import sequelize from "../config/db.js";
import Booking from "../models/Booking.js";
import BookingItem from "../models/BookingItem.js";
import EventSeat from "../models/EventSeat.js";
import Payment from "../models/Payment.js";

export const expireBookings= async() => {
    const transaction = await sequelize.transaction();

    try{
        const expiredBookings = await Booking.findAll({
            where: {
                status: "pending",
                expires_at: {
                    [Op.lt]: new Date(),
                },
            },
            transaction,
            lock: transaction.LOCK.UPDATE,
        });

        for (const booking of expiredBookings) {
            const bookingItems = await BookingItem.findAll({
                where: {
                    booking_id: booking.id,
                },
                transaction
            });

            const eventSeatIds = bookingItems.map(
                (item) => item.event_seat_id
            );

            if(eventSeatIds.length > 0){
                await EventSeat.update(
                    {
                        status: "available",
                        hold_expires_at: null
                    },
                    {
                        where: {
                            id: eventSeatIds,
                            status: "held"
                        },
                        transaction
                    }
                );
            }
            await Payment.update(
                {
                    status: "expired"
                },
                {
                    where: {
                        booking_id: booking.id,
                        status: "pending"
                    },
                    transaction
                }
            );
            await booking.update(
                {
                    status: "expired"
                },
                {
                    transaction
                }
            );
        }
        await transaction.commit();

        return expiredBookings.length;
    }catch(error){
        await transaction.rollback();
        throw error;
                }
        
    };
