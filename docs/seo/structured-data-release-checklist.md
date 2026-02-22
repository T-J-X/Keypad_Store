# Structured Data Release Checklist

Use this gate before shipping metadata, product schema, or catalog-content changes.

## Required URL Samples

- Homepage: `/`
- One keypad product page: `/shop/product/<keypad-slug>`
- One button insert product page: `/shop/product/<insert-slug>`

## Validation Steps

1. Run each sample URL through Google Rich Results Test.
2. Run each sample URL through Schema Markup Validator.
3. Confirm canonical URL in metadata matches expected route.
4. Confirm product schema fields are present and valid:
- `name`
- `description`
- `image`
- `offers.price`
- `offers.availability`
- `sku` or equivalent product identifier when available
5. Confirm no unsupported or malformed canonical override values in product custom fields.

## Release Gate

A release is blocked for SEO if any sampled URL fails schema validation or exposes malformed canonical metadata.
