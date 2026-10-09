
import cron from "node-cron";
import { Op } from "sequelize";

import Payment from "../models/Payment.js";
import Booking from "../models/Booking.js";
import { checkEsewaTransactionStatus } from "../services/esewa.service.js";
import { completePayment } from "../services/payment.service.js";
import logger from "../utils/logger.js";

const enabled =
    process.env.ESEWA_RECONCILIATION_ENABLED === "true";

const retryAfter = new Map();
let isRunning = false;

export const reconcilePendingEsewaPayments = async () => {
    if (!enabled || isRunning) {
        return;
    }

    isRunning = true;

    try {
        const payments = await Payment.findAll({
            where: {
                provider: "esewa",
                status: "pending",
                created_at: {
                    [Op.lte]: new Date(Date.now() - 5000),
                },
            },
            order: [["created_at", "ASC"]],
            limit: 20,
        });

        for (const payment of payments) {
            if (
                (retryAfter.get(payment.id) || 0) > Date.now()
            ) {
                continue;
            }

            retryAfter.set(
                payment.id,
                Date.now() + 30000
            );

            try {
                const booking = await Booking.findByPk(
                    payment.booking_id
                );

                if (
                    !booking ||
                    booking.status !== "pending" ||
                    (
                        booking.expires_at &&
                        new Date(booking.expires_at) <= new Date()
                    )
                ) {
                    continue;
                }

                const result =
                    await checkEsewaTransactionStatus({
                        transaction_uuid: payment.transaction_uuid,
                        total_amount: payment.amount,
                    });

                if (result.status !== "COMPLETE") {
                    continue;
                }

                const matches =
                    result.transactionUuid ===
                        payment.transaction_uuid &&
                    result.productCode ===
                        process.env.ESEWA_PRODUCT_CODE &&
                    Number(result.totalAmount) ===
                        Number(payment.amount) &&
                    Boolean(result.referenceId);

                if (!matches) {
                    logger.error(
                        { paymentId: payment.id },
                        "eSewa reconciliation mismatch"
                    );
                    continue;
                }

                await completePayment({
                    transaction_uuid: payment.transaction_uuid,
                    reference_id: result.referenceId,
                });

                retryAfter.delete(payment.id);

                logger.info(
                    { paymentId: payment.id },
                    "eSewa payment reconciled successfully"
                );
            } catch (error) {
                logger.error(
                    {
                        err: error,
                        paymentId: payment.id,
                    },
                    "Failed to reconcile eSewa payment"
                );
            }
        }
    } finally {
        isRunning = false;
    }
};

if (enabled) {
    cron.schedule("* * * * *", () => {
        reconcilePendingEsewaPayments().catch((error) => {
            logger.error(
                { err: error },
                "Payment reconciliation job failed"
            );
        });
    });
}
