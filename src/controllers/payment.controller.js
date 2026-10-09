
import {
    createPayment,
    completePayment,
    getEsewaPayment,
} from "../services/payment.service.js";

import {
    generateEsewaResponseSignature,
} from "../utils/esewa.js";

import {
    checkEsewaTransactionStatus,
} from "../services/esewa.service.js";

import Payment from "../models/Payment.js";

// Forward errors to the centralized error middleware.
const forwardError = (error, next, statusMap = {}) => {
    error.statusCode = statusMap[error.message] ?? 500;
    return next(error);
};

export const create = async (req, res, next) => {
    try {
        const { booking_id, provider } = req.body;

        if (!booking_id || !provider) {
            return res.status(400).json({
                message: "Booking ID and payment provider are required",
            });
        }

        const payment = await createPayment({
            user_id: req.user.id,
            booking_id,
            provider,
        });

        return res.status(201).json({
            message: "Payment created successfully",
            ...payment,
        });
    } catch (error) {
        return forwardError(error, next, {
            "Booking not found": 404,
            "Access denied": 403,
            "Booking is not available for payment": 400,
            "Booking has expired": 400,
        });
    }
};

export const complete = async (req, res, next) => {
    try {
        const {
            transaction_uuid,
            reference_id,
        } = req.body;

        if (!transaction_uuid) {
            return res.status(400).json({
                message: "Transaction UUID is required",
            });
        }

        const payment = await completePayment({
            transaction_uuid,
            reference_id,
        });

        return res.status(200).json({
            message: "Payment completed successfully",
            payment,
        });
    } catch (error) {
        return forwardError(error, next, {
            "Payment not found": 404,
            "Payment is not pending": 400,
            "Booking not found": 404,
            "Booking is not pending": 400,
            "Booking has no items": 400,
            "Booking has expired": 400,
            "One or more event seats not found": 404,
            "One or more event seats are not held": 409,
        });
    }
};

export const esewaSuccess = async (req, res, next) => {
    try {
        const { data } = req.query;

        if (!data) {
            return res.status(400).json({
                message: "eSewa response data is required",
            });
        }

        let esewaResponse;

        try {
            const decodedData = Buffer
                .from(data, "base64")
                .toString("utf-8");

            esewaResponse = JSON.parse(decodedData);
        } catch {
            return res.status(400).json({
                message: "Invalid eSewa response data",
            });
        }

        const {
            transaction_code,
            status,
            total_amount,
            transaction_uuid,
            product_code,
            signed_field_names,
            signature,
        } = esewaResponse;

        if (
            !transaction_code ||
            !status ||
            !total_amount ||
            !transaction_uuid ||
            !product_code ||
            !signed_field_names ||
            !signature
        ) {
            return res.status(400).json({
                message: "Invalid eSewa response",
            });
        }

        const generatedSignature = generateEsewaResponseSignature({
            signed_field_names,
            data: esewaResponse,
        });

        if (generatedSignature !== signature) {
            return res.status(400).json({
                message: "Invalid eSewa response signature",
            });
        }

        if (product_code !== process.env.ESEWA_PRODUCT_CODE) {
            return res.status(400).json({
                message: "Invalid eSewa product code",
            });
        }

        const paymentRecord = await Payment.findOne({
            where: {
                transaction_uuid,
            },
        });

        if (!paymentRecord) {
            return res.status(404).json({
                message: "Payment not found",
            });
        }

        if (paymentRecord.provider !== "esewa") {
            return res.status(400).json({
                message: "Payment provider is not eSewa",
            });
        }

        // Make repeated successful callbacks safe.
        if (paymentRecord.status === "success") {
            return res.redirect(
                `${process.env.FRONTEND_URL}/payment-success?booking_id=${paymentRecord.booking_id}`
            );
        }

        if (paymentRecord.status !== "pending") {
            return res.status(400).json({
                message: "Payment is not pending",
            });
        }

        if (
            Number(paymentRecord.amount) !==
            Number(total_amount)
        ) {
            return res.status(400).json({
                message: "Payment amount mismatch",
            });
        }

        const statusResponse = await checkEsewaTransactionStatus({
            transaction_uuid,
            total_amount: paymentRecord.amount,
        });

        if (statusResponse.status !== "COMPLETE") {
            return res.status(400).json({
                message: "eSewa payment is not complete",
                status: statusResponse.status,
            });
        }

        if (statusResponse.transactionUuid !== transaction_uuid) {
            return res.status(400).json({
                message: "eSewa transaction UUID mismatch",
            });
        }

        if (
            statusResponse.productCode !==
            process.env.ESEWA_PRODUCT_CODE
        ) {
            return res.status(400).json({
                message: "eSewa product code mismatch",
            });
        }

        if (
            Number(statusResponse.totalAmount) !==
            Number(paymentRecord.amount)
        ) {
            return res.status(400).json({
                message: "Payment amount mismatch",
            });
        }

        const payment = await completePayment({
            transaction_uuid,
            reference_id: statusResponse.referenceId,
        });

        return res.redirect(
            `${process.env.FRONTEND_URL}/payment-success?booking_id=${payment.booking_id}`
        );
    } catch (error) {
        return forwardError(error, next, {
            "Payment not found": 404,
            "Payment is not pending": 400,
            "Booking not found": 404,
            "Booking is not pending": 400,
            "Booking has expired": 400,
            "Booking has no items": 400,
            "One or more event seats not found": 404,
            "One or more event seats are not held": 409,
            "Invalid eSewa status response": 502,
            "Invalid eSewa status amount": 502,
        });
    }
};

export const esewaFailure = (req, res) => {
    console.log("eSewa payment failed callback received:", req.query);

    return res.redirect(
        `${process.env.FRONTEND_URL}/payment-failed`
    );
};

export const esewaForm = async (req, res, next) => {
    try {
        const paymentId = Number(req.params.id);

        if (!paymentId) {
            return res.status(400).send("Invalid payment ID");
        }

        const {
            payment_url,
            payment_payload,
        } = await getEsewaPayment({
            payment_id: paymentId,
            user_id: req.user.id,
        });

        const formFields = Object.entries(payment_payload)
            .map(
                ([key, value]) =>
                    `<input type="hidden" name="${key}" value="${String(value).replace(/"/g, "&quot;")}">`
            )
            .join("\n");

        const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Redirecting to eSewa</title>
</head>
<body>
    <p>Redirecting to eSewa...</p>

    <form
        id="esewa-form"
        action="${payment_url}"
        method="POST"
    >
        ${formFields}
    </form>

    <script>
        document.getElementById("esewa-form").submit();
    </script>
</body>
</html>
`;

        return res.status(200).send(html);
    } catch (error) {
        return forwardError(error, next, {
            "Payment not found": 404,
            "Booking not found": 404,
            "Access denied": 403,
            "Payment provider is not eSewa": 400,
            "Payment is not pending": 400,
            "Booking has expired": 400,
        });
    }
};
