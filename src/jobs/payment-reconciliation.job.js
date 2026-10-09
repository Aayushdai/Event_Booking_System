
import cron from "node-cron";
import { Op } from "sequelize";

import Payment from "../models/Payment.js";
import Booking from "../models/Booking.js";
import { checkEsewaTransactionStatus } from "../services/esewa.service.js";
import { completePayment } from "../services/payment.service.js";

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
            if ((retryAfter.get(payment.id) || 0) > Date.now()) {
                continue;
            }

            retryAfter.set(payment.id, Date.now() + 30000);

            try {
                const booking = await Booking.findByPk(
                    payment.booking_id
                );

                // Never confirm an expired or cancelled booking.
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

                const result = await checkEsewaTransactionStatus({
                    transaction_uuid: payment.transaction_uuid,
                    total_amount: payment.amount,
                });

                // Do not change anything for uncertain or unsuccessful states.
                if (result.status !== "COMPLETE") {
                    continue;
                }

                const matches =
                    result.transactionUuid === payment.transaction_uuid &&
                    result.productCode === process.env.ESEWA_PRODUCT_CODE &&
                    Number(result.totalAmount) === Number(payment.amount) &&
                    Boolean(result.referenceId);

                if (!matches) {
                    console.error(
                        `Reconciliation mismatch for payment ${payment.id}`
                    );
                    continue;
                }

                await completePayment({
                    transaction_uuid: payment.transaction_uuid,
                    reference_id: result.referenceId,
                });

                retryAfter.delete(payment.id);

                console.log(
                    `Reconciled eSewa payment ${payment.id}`
                );
            } catch (error) {
                console.error(
                    `Could not reconcile payment ${payment.id}:`,
                    error.message
                );
            }
        }
    } finally {
        isRunning = false;
    }
};

if (enabled) {
    // Check pending payments once per minute.
    cron.schedule("* * * * *", () => {
        reconcilePendingEsewaPayments().catch((error) => {
            console.error("Payment reconciliation job failed:", error);
        });
    });
}
