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


export const create = async (req, res) => {
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
        if (error.message === "Booking not found") {
            return res.status(404).json({
                message: "Booking not found",
            });
        }

        if (error.message === "Access denied") {
            return res.status(403).json({
                message: "Access denied",
            });
        }

        if (error.message === "Booking is not available for payment") {
            return res.status(400).json({
                message: "Booking is not available for payment",
            });
        }

        if (error.message === "Booking has expired") {
            return res.status(400).json({
                message: "Booking has expired",
            });
        }

        console.error("Error creating payment:", error);

        return res.status(500).json({
            message: "Internal server error",
        });
    }
};


export const complete = async (req, res) => {
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
        if (error.message === "Payment not found") {
            return res.status(404).json({
                message: "Payment not found",
            });
        }

        if (error.message === "Payment is not pending") {
            return res.status(400).json({
                message: "Payment is not pending",
            });
        }

        if (error.message === "Booking not found") {
            return res.status(404).json({
                message: "Booking not found",
            });
        }

        if (error.message === "Booking is not pending") {
            return res.status(400).json({
                message: "Booking is not pending",
            });
        }

        if (error.message === "Booking has no items") {
            return res.status(400).json({
                message: "Booking has no items",
            });
        }

        if (error.message === "Booking has expired") {
            return res.status(400).json({
                message: "Booking has expired",
            });
        }

        if (error.message === "One or more event seats not found") {
            return res.status(404).json({
                message: "One or more event seats not found",
            });
        }

        if (error.message === "One or more event seats are not held") {
            return res.status(409).json({
                message: "One or more event seats are not held",
            });
        }

        console.error("Error completing payment:", error);

        return res.status(500).json({
            message: "Internal server error",
        });
    }
};


export const esewaSuccess = async (req, res) => {
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

        const generatedSignature =
            generateEsewaResponseSignature({
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

        // Safe for repeated callbacks
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

        const statusResponse =
            await checkEsewaTransactionStatus({
                transaction_uuid,
                total_amount: paymentRecord.amount,
            });

        if (statusResponse.status !== "COMPLETE") {
            return res.status(400).json({
                message: "eSewa payment is not complete",
                status: statusResponse.status,
            });
        }

        if (
            statusResponse.transactionUuid !==
            transaction_uuid
        ) {
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
        console.error(
            "eSewa success callback error:",
            error
        );

        if (error.message === "Payment not found") {
            return res.status(404).json({
                message: "Payment not found",
            });
        }

        if (error.message === "Payment is not pending") {
            return res.status(400).json({
                message: "Payment is not pending",
            });
        }

        if (error.message === "Booking not found") {
            return res.status(404).json({
                message: "Booking not found",
            });
        }

        if (error.message === "Booking is not pending") {
            return res.status(400).json({
                message: "Booking is not pending",
            });
        }

        if (error.message === "Booking has expired") {
            return res.status(400).json({
                message: "Booking has expired",
            });
        }

        if (error.message === "Booking has no items") {
            return res.status(400).json({
                message: "Booking has no items",
            });
        }

        if (error.message === "One or more event seats not found") {
            return res.status(404).json({
                message: "One or more event seats not found",
            });
        }

        if (error.message === "One or more event seats are not held") {
            return res.status(409).json({
                message: "One or more event seats are not held",
            });
        }

        if (error.message === "Invalid eSewa status response") {
            return res.status(502).json({
                message: "Invalid eSewa status response",
            });
        }

        if (error.message === "Invalid eSewa status amount") {
            return res.status(502).json({
                message: "Invalid eSewa status amount",
            });
        }

        return res.status(500).json({
            message: "Failed to process eSewa payment",
        });
    }
};


export const esewaFailure = (req, res) => {
    return res.redirect(
        `${process.env.FRONTEND_URL}/payment-failed`
    );
};


export const esewaForm = async (req, res) => {
    try {
        const paymentId = Number(req.params.id);

        if (!paymentId) {
            return res.status(400).send(
                "Invalid payment ID"
            );
        }

        const {
            payment_url,
            payment_payload,
        } = await getEsewaPayment({
            payment_id: paymentId,
            user_id: req.user.id,
        });

        const formFields = Object.entries(
            payment_payload
        )
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
        if (error.message === "Payment not found") {
            return res.status(404).json({
                message: "Payment not found",
            });
        }

        if (error.message === "Booking not found") {
            return res.status(404).json({
                message: "Booking not found",
            });
        }

        if (error.message === "Access denied") {
            return res.status(403).json({
                message: "Access denied",
            });
        }

        if (error.message === "Payment provider is not eSewa") {
            return res.status(400).json({
                message: "Payment provider is not eSewa",
            });
        }

        if (error.message === "Payment is not pending") {
            return res.status(400).json({
                message: "Payment is not pending",
            });
        }

        if (error.message === "Booking has expired") {
            return res.status(400).json({
                message: "Booking has expired",
            });
        }

        console.error("eSewa form error:", error);

        return res.status(500).json({
            message: "Internal server error",
        });
    }
};