
const normalizeEsewaStatusResponse = (data) => {
    if (!data || typeof data !== "object" || !data.status) {
        throw new Error("Invalid eSewa status response");
    }

    const status = String(data.status).trim().toUpperCase();

    let totalAmount = null;

    if (
        data.total_amount !== undefined &&
        data.total_amount !== null &&
        data.total_amount !== ""
    ) {
        totalAmount = Number(data.total_amount);

        if (!Number.isFinite(totalAmount)) {
            throw new Error("Invalid eSewa status amount");
        }
    }

    const transactionUuid = data.transaction_uuid ?? null;
    const productCode = data.product_code ?? null;
    const referenceId = data.ref_id ?? null;

    if (
        status === "COMPLETE" &&
        (
            totalAmount === null ||
            !transactionUuid ||
            !productCode ||
            !referenceId
        )
    ) {
        throw new Error("Invalid eSewa status response");
    }

    return {
        status,
        totalAmount,
        transactionUuid,
        productCode,
        referenceId,
    };
};

export const checkEsewaTransactionStatus = async ({
    transaction_uuid,
    total_amount,
}) => {
    const productCode = process.env.ESEWA_PRODUCT_CODE;
    const statusUrl = process.env.ESEWA_STATUS_URL;

    if (!statusUrl || !productCode) {
        throw new Error("eSewa status configuration is missing");
    }

    const params = new URLSearchParams({
        product_code: productCode,
        total_amount: String(total_amount),
        transaction_uuid,
    });

    const url = `${statusUrl}?${params.toString()}`;

    let response;

    try {
        response = await fetch(url, {
            signal: AbortSignal.timeout(
                Number(process.env.ESEWA_STATUS_TIMEOUT_MS || 5000)
            ),
        });
    } catch (error) {
        if (
            error.name === "TimeoutError" ||
            error.name === "AbortError"
        ) {
            throw new Error("eSewa status API request timed out");
        }

        throw error;
    }

    if (!response.ok) {
        throw new Error(
            `eSewa status API returned ${response.status}`
        );
    }

    let data;

    try {
        data = await response.json();
    } catch {
        throw new Error("Invalid eSewa status response");
    }

    return normalizeEsewaStatusResponse(data);
};
