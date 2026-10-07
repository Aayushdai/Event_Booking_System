const normalizeEsewaStatusResponse = (data) => {
    const {
        status,
        total_amount,
        transaction_uuid,
        product_code,
        ref_id,
    } = data;

    if (
        !status ||
        total_amount === undefined ||
        total_amount === null ||
        !transaction_uuid ||
        !product_code ||
        !ref_id
    ) {
        throw new Error("Invalid eSewa status response");
    }

    const totalAmount = Number(total_amount);

    if (!Number.isFinite(totalAmount)) {
        throw new Error("Invalid eSewa status amount");
    }

    return {
        status,
        totalAmount,
        transactionUuid: transaction_uuid,
        productCode: product_code,
        referenceId: ref_id,
    };
};

export const checkEsewaTransactionStatus = async({
    transaction_uuid,
    total_amount,
})=> {
    const productCode = process.env.ESEWA_PRODUCT_CODE;

    const params = new URLSearchParams({
        product_code: productCode,
        total_amount:String(total_amount),
        transaction_uuid,
    });

    const url =
    `${process.env.ESEWA_STATUS_URL}?${params.toString()}`;

    const response = await fetch(url);

    if(!response.ok){
        throw new Error(
            `eSewa status API returned ${response.status}`
        );
    }
    const data = await response.json();

    return normalizeEsewaStatusResponse(data);
};
