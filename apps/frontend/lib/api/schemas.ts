import { z } from 'zod';

function trimString(value: string) {
  return value.trim();
}

function requiredTrimmedString(message: string) {
  return z
    .string({ error: message })
    .transform(trimString)
    .refine((value) => value.length > 0, { message });
}

const optionalTrimmedString = z.string().transform(trimString).optional();

function normalizeIntegerInput(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.floor(value);
  }
  return value;
}

const CHECKOUT_REQUIRED_MESSAGE = 'Missing required checkout fields (contact and shipping address).';

export const savedConfigurationCreateBodySchema = z
  .object({
    name: requiredTrimmedString('Configuration name cannot be empty.'),
    keypadModel: requiredTrimmedString('Keypad model is required.'),
    configuration: z.unknown(),
  })
  .passthrough();

export const savedConfigurationUpdateBodySchema = z
  .object({
    name: requiredTrimmedString('Configuration name cannot be empty.'),
    keypadModel: optionalTrimmedString,
    configuration: z.unknown(),
  })
  .passthrough();

export const savedConfigurationEnquiryBodySchema = z
  .object({
    note: optionalTrimmedString,
  })
  .passthrough();

export const cartAddItemBodySchema = z
  .object({
    productVariantId: requiredTrimmedString('Missing productVariantId'),
    quantity: z.preprocess(
      (value) => (value === undefined ? undefined : normalizeIntegerInput(value)),
      z
        .number({ error: 'Invalid quantity' })
        .int('Invalid quantity')
        .positive('Invalid quantity')
        .default(1),
    ),
    customFields: z
      .object({
        configuration: z.unknown().optional(),
      })
      .passthrough()
      .nullable()
      .optional(),
  })
  .passthrough();

export const cartUpdateLineBodySchema = z
  .object({
    orderLineId: requiredTrimmedString('Missing orderLineId'),
    quantity: z.preprocess(
      normalizeIntegerInput,
      z.number({ error: 'Invalid quantity' }).int('Invalid quantity'),
    ),
    configuration: z.unknown().optional(),
  })
  .passthrough();

export const checkoutSubmitBodySchema = z
  .object({
    emailAddress: requiredTrimmedString(CHECKOUT_REQUIRED_MESSAGE),
    firstName: requiredTrimmedString(CHECKOUT_REQUIRED_MESSAGE),
    lastName: requiredTrimmedString(CHECKOUT_REQUIRED_MESSAGE),
    streetLine1: requiredTrimmedString(CHECKOUT_REQUIRED_MESSAGE),
    city: requiredTrimmedString(CHECKOUT_REQUIRED_MESSAGE),
    postalCode: requiredTrimmedString(CHECKOUT_REQUIRED_MESSAGE),
    countryCode: requiredTrimmedString(CHECKOUT_REQUIRED_MESSAGE),
    phoneNumber: optionalTrimmedString,
    streetLine2: optionalTrimmedString,
    province: optionalTrimmedString,
    shippingMethodId: optionalTrimmedString,
    paymentMethodCode: optionalTrimmedString,
  })
  .passthrough();

export const googleAuthBodySchema = z
  .object({
    token: optionalTrimmedString,
    code: optionalTrimmedString,
    redirectUri: optionalTrimmedString,
  })
  .passthrough()
  .superRefine((value, ctx) => {
    if (!value.token && !value.code) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Missing Google token or authorization code',
      });
    }
  });

export const orderExportPdfBodySchema = z
  .object({
    orderCode: optionalTrimmedString,
    designName: optionalTrimmedString,
    modelCode: optionalTrimmedString,
    configuration: z.unknown(),
  })
  .passthrough();

export function getRequestBodyErrorMessage(error: z.ZodError, fallback = 'Invalid request body.') {
  return error.issues[0]?.message || fallback;
}
