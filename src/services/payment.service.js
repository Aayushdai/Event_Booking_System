
import logger from "../utils/logger.js";
import crypto from "crypto";

import Payment from "../models/Payment.js";
import Booking from "../models/Booking.js";
import BookingItem from "../models/BookingItem.js";
import Event from "../models/Event.js";
import EventSeat from "../models/EventSeat.js";
import User from "../models/User.js";
import sequelize from "../config/db.js";

import { generateEsewaSignature } from "../utils/esewa.js";
import { getIO } from "../socket.js";

const buildEsewaPaymentPayload = (payment) => {
    const amount = Number(payment.amount).toFixed(2);

    const signature = generateEsewaSignature({
        total_amount: amount,
        transaction_uuid: payment.transaction_uuid,
        product_code: process.env.ESEWA_PRODUCT_CODE,
    });

    return {
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
        logger.error(
            {
                err: socketError,
                eventId: event_id,
                eventSeatIds: event_seat_ids,
            },
            "Socket notification failed during payment processing"
        );
    }
};

export const createPayment = async ({
    user_id,
    booking_id,
    provider,
}) => {
    const transaction = await sequelize.transaction();

    try {
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
                "Booking is not available for payment"
            );
        }

        if (
            booking.expires_at &&
            new Date(booking.expires_at) <= new Date()
        ) {
            throw new Error("Booking has expired");
        }

        const existingPayment = await Payment.findOne({
            where: {
                booking_id,
                status: "pending",
            },
            transaction,
            lock: transaction.LOCK.UPDATE,
            order: [["created_at", "DESC"]],
        });

        if (existingPayment) {
            await transaction.commit();

            return {
                payment: existingPayment,
                payment_url: process.env.ESEWA_PAYMENT_URL,
                payment_payload: buildEsewaPaymentPayload(
                    existingPayment
                ),
            };
        }

        const transactionUuid = crypto.randomUUID();

        const payment = await Payment.create(
            {
                booking_id,
                provider,
                transaction_uuid: transactionUuid,
                amount: booking.total_amount,
                status: "pending",
            },
            {
                transaction,
            }
        );

        await transaction.commit();

        return {
            payment,
            payment_url: process.env.ESEWA_PAYMENT_URL,
            payment_payload: buildEsewaPaymentPayload(payment),
        };
    } catch (error) {
        if (!transaction.finished) {
            await transaction.rollback();
        }

        throw error;
    }
};

export const completePayment = async ({
    transaction_uuid,
    reference_id,
}) => {
    const transaction = await sequelize.transaction();

    try {
        /*
         * Lock order:
         * Booking → Payment → EventSeat
         */

        // Find the payment first to get its booking ID.
        const paymentInfo = await Payment.findOne({
            where: {
                transaction_uuid,
            },
            attributes: ["id", "booking_id"],
            transaction,
        });

        if (!paymentInfo) {
            throw new Error("Payment not found");
        }

        // Lock the booking first.
        const booking = await Booking.findByPk(
            paymentInfo.booking_id,
            {
                transaction,
                lock: transaction.LOCK.UPDATE,
            }
        );

        if (!booking) {
            throw new Error("Booking not found");
        }

        // Lock the payment after the booking.
        const payment = await Payment.findOne({
            where: {
                id: paymentInfo.id,
            },
            transaction,
            lock: transaction.LOCK.UPDATE,
        });

        if (!payment) {
            throw new Error("Payment not found");
        }

        // Repeated successful callbacks are idempotent.
        if (payment.status === "success") {
            await transaction.commit();
            return payment;
        }

        if (payment.status !== "pending") {
            throw new Error("Payment is not pending");
        }

        if (booking.status !== "pending") {
            throw new Error("Booking is not pending");
        }

        if (
            booking.expires_at &&
            new Date(booking.expires_at) <= new Date()
        ) {
            throw new Error("Booking has expired");
        }

        const bookingItems = await BookingItem.findAll({
            where: {
                booking_id: booking.id,
            },
            transaction,
        });

        if (bookingItems.length === 0) {
            throw new Error("Booking has no items");
        }

        const eventSeatIds = bookingItems
            .map((item) => item.event_seat_id)
            .sort((a, b) => a - b);

        const eventSeats = await EventSeat.findAll({
            where: {
                id: eventSeatIds,
            },
            transaction,
            lock: transaction.LOCK.UPDATE,
        });

        if (eventSeats.length !== eventSeatIds.length) {
            throw new Error(
                "One or more event seats not found"
            );
        }

        const unavailableSeat = eventSeats.find(
            (eventSeat) => eventSeat.status !== "held"
        );

        if (unavailableSeat) {
            throw new Error(
                "One or more event seats are not held"
            );
        }

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

        await booking.update(
            {
                status: "confirmed",
                expires_at: null,
            },
            {
                transaction,
            }
        );

        await transaction.commit();

        emitSeatUpdate({
            event_id: booking.event_id,
            event_seat_ids: eventSeatIds,
            status: "booked",
            hold_expires_at: null,
        });

        return payment;
    } catch (error) {
        if (!transaction.finished) {
            await transaction.rollback();
        }

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

    if (payment.provider !== "esewa") {
        throw new Error("Payment provider is not eSewa");
    }

    const booking = await Booking.findOne({
        where: {
            id: payment.booking_id,
            user_id,
        },
    });

    if (!booking) {
        throw new Error("Booking not found");
    }

    if (payment.status !== "pending") {
        throw new Error("Payment is not pending");
    }

    if (booking.status !== "pending") {
        throw new Error(
            "Booking is not available for payment"
        );
    }

    if (
        booking.expires_at &&
        new Date(booking.expires_at) <= new Date()
    ) {
        throw new Error("Booking has expired");
    }

    return {
        payment,
        payment_url: process.env.ESEWA_PAYMENT_URL,
        payment_payload: buildEsewaPaymentPayload(payment),
    };
};

export const getAllPaymentsAdmin = async () => {
    return Payment.findAll({
        order: [["created_at", "DESC"]],
        include: [
            {
                model: Booking,
                include: [
                    {
                        model: User,
                        attributes: ["id", "name", "email"],
                    },
                    {
                        model: Event,
                        attributes: ["id", "title"],
                    },
                ],
            },
        ],
    });
};
