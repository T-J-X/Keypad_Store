export type ShippingMethodQuote = {
    id: string;
    code: string;
    name: string;
    description: string;
    priceWithTax: number;
};

export type PaymentMethodQuote = {
    id: string;
    code: string;
    name: string;
    description: string;
    isEligible: boolean;
    eligibilityMessage: string | null;
};

export type CheckoutOrderLine = {
    id: string;
    quantity: number;
    linePriceWithTax: number;
    customFields?: {
        configuration?: string | null;
    } | null;
    productVariant?: {
        id: string;
        name: string;
        currencyCode: string;
        product?: {
            id: string;
            slug: string | null;
            name: string | null;
            featuredAsset?: {
                preview: string | null;
                source: string | null;
            } | null;
        } | null;
    } | null;
};

export type CheckoutOrder = {
    id: string;
    code: string;
    state: string | null;
    currencyCode: string;
    totalQuantity: number;
    subTotalWithTax: number;
    shippingWithTax: number;
    totalWithTax: number;
    lines: CheckoutOrderLine[];
};

export type CheckoutSessionData = {
    order: CheckoutOrder | null;
    shippingMethods: ShippingMethodQuote[];
    paymentMethods: PaymentMethodQuote[];
};
