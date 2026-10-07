import crypto from "crypto";
import Payment from "../models/Payment.js";
import Booking from "../models/Booking.js";
import sequelize from "../config/db.js";
import BookingItem from "../models/BookingItem.js";
import EventSeat from "../models/EventSeat.js";
import { generateEsewaSignature } from "../utils/esewa.js";

const buildEsewaPaymentPayload= (payment)=> {
    const amount = Number(payment.amount).toFixed(2);

    const signature = generateEsewaSignature({
    total_amount: amount,
    transaction_uuid: payment.transaction_uuid,
    product_code: process.env.ESEWA_PRODUCT_CODE,
});

return{
    amount,
    tax_amount: "0",
    total_amount: amount,
    transaction_uuid: payment.transaction_uuid,
    product_code: process.env.ESEWA_PRODUCT_CODE,
    product_service_charge: "0",
    product_delivery_charge: "0",
    success_url: process.env.ESEWA_SUCCESS_URL,
    failure_url: process.env.ESEWA_FAILURE_URL,
    signed_field_names:
        "total_amount,transaction_uuid,product_code",
    signature,
};
};



export const createPayment = async ({
    user_id,
    booking_id,
    provider,
}) => {
    const booking = await Booking.findByPk(booking_id);

    if (!booking) {
        throw new Error("Booking not found");
    }

    if (booking.user_id !== user_id) {
        throw new Error("Access denied");
    }

    if (booking.status !== "pending") {
        throw new Error("Booking is not available for payment");
    }

    if (
        booking.expires_at &&
        new Date(booking.expires_at) < new Date()
    ) {
        throw new Error("Booking has expired");
    }

    const existingPayment = await Payment.findOne({
        where: {
            booking_id,
            status: "pending",
        },
    });

    if (existingPayment) {
        return {
            payment: existingPayment,
            payment_url: process.env.ESEWA_PAYMENT_URL,
            payment_payload: buildEsewaPaymentPayload(existingPayment),
        };
    }

    const transactionUuid = crypto.randomUUID();

  

    const payment = await Payment.create({
        booking_id,
        provider,
        transaction_uuid: transactionUuid,
        amount: booking.total_amount,
        status: "pending",
    });

    const paymentPayload = buildEsewaPaymentPayload(payment);

    return {
        payment,
        payment_url: process.env.ESEWA_PAYMENT_URL,
        payment_payload: paymentPayload,
        };
    };




export const completePayment = async ({ transaction_uuid, reference_id }) => {
    const transaction = await sequelize.transaction();

    try {
        // 1. Find and lock the payment
        const payment = await Payment.findOne({
            where: { transaction_uuid },
            transaction,
            lock: transaction.LOCK.UPDATE,
        });

        if (!payment) {
            throw new Error("Payment not found");
        }

        // 2. Prevent processing the same successful payment again
        if (payment.status === "success") {
            await transaction.commit();
            return payment;
        }

        if (payment.status !== "pending") {
            throw new Error("Payment is not pending");
        }

        // 3. Find and lock the booking
        const booking = await Booking.findByPk(payment.booking_id, {
            transaction,
            lock: transaction.LOCK.UPDATE,
        });

        if (!booking) {
            throw new Error("Booking not found");
        }

        if (booking.status !== "pending") {
            throw new Error("Booking is not pending");
        }

        // 4. Check whether the booking has expired
        if (
            booking.expires_at &&
            new Date(booking.expires_at) < new Date()
        ) {
            throw new Error("Booking has expired");
        }

        // 5. Get booking items
        const bookingItems = await BookingItem.findAll({
            where: {
                booking_id: booking.id,
            },
            transaction,
        });

        if (bookingItems.length === 0) {
            throw new Error("Booking has no items");
        }

        // 6. Get the event seat IDs
        const eventSeatIds = bookingItems.map(
            (item) => item.event_seat_id
        );

        // 7. Find and lock those event seats
        const eventSeats = await EventSeat.findAll({
            where: {
                id: eventSeatIds,
            },
            transaction,
            lock: transaction.LOCK.UPDATE,
        });

        if (eventSeats.length !== eventSeatIds.length) {
            throw new Error("One or more event seats not found");
        }

        // 8. Make sure all seats are still held
        const unavailableSeat = eventSeats.find(
            (eventSeat) => eventSeat.status !== "held"
        );

        if (unavailableSeat) {
            throw new Error("One or more event seats are not held");
        }

        // 9. Change seats from HELD → BOOKED
        await EventSeat.update(
            {
                status: "booked",
                hold_expires_at: null,
            },
            {
                where: {
                    id: eventSeatIds,
                },
                transaction,
            }
        );

        // 10. Change payment from PENDING → SUCCESS
        await payment.update(
            {
                status: "success",
                reference_id,
                paid_at: new Date(),
            },
            {
                transaction,
            }
        );

        // 11. Change booking from PENDING → CONFIRMED
        await booking.update(
            {
                status: "confirmed",
                expires_at: null,
            },
            {
                transaction,
            }
        );

        // 12. Make everything permanent
        await transaction.commit();

        return payment;

    } catch (error) {
        await transaction.rollback();
        throw error;
    }
};

export const getEsewaPayment = async ({
    payment_id,
    user_id,
}) => {
    const payment = await Payment.findByPk(payment_id);

    if (!payment) {
        throw new Error("Payment not found");
    }

    const booking = await Booking.findByPk(payment.booking_id);

    if (!booking) {
        throw new Error("Booking not found");
    }

    if (booking.user_id !== user_id) {
        throw new Error("Access denied");
    }

    if (payment.provider !== "esewa") {
        throw new Error("Payment provider is not eSewa");
    }

    if (payment.status !== "pending") {
        throw new Error("Payment is not pending");
    }

    if (
        booking.expires_at &&
        new Date(booking.expires_at) < new Date()
    ) {
        throw new Error("Booking has expired");
    }

    return {
        payment,
        payment_url: process.env.ESEWA_PAYMENT_URL,
        payment_payload: buildEsewaPaymentPayload(payment),
    };
};