/**
 * Bangladeshi mobile numbers: 11 digits starting 01, operator digit 3-9.
 * Accepts local format (01712345678); we normalize/store this exact format
 * (no +880 prefix) so lookups stay simple and consistent everywhere.
 */
export const BD_MOBILE_REGEX = /^01[3-9]\d{8}$/;
