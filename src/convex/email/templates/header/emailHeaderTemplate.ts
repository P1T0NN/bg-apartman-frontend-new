// CONFIG
import { COMPANY_DATA } from '@/shared/constants.js';

// SHARED
import { EMAIL_THEME } from '../shared';

/**
 * Opening half of every email: the document head, the outer grey canvas, the white 600px card,
 * and the brand bar. It leaves the inner content cell **open** — a body template drops its
 * content in, then closes everything with {@link emailFooterTemplate}. Always pair the two.
 */
export function emailHeaderTemplate(locale: string): string {
	return `<!doctype html>
<html lang="${locale}">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="color-scheme" content="light" />
<title>${COMPANY_DATA.NAME}</title>
</head>
<body style="margin:0;padding:0;background:${EMAIL_THEME.bg};font-family:${EMAIL_THEME.font};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${EMAIL_THEME.bg};">
<tr><td align="center" style="padding:24px 12px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background:${EMAIL_THEME.card};border:1px solid ${EMAIL_THEME.border};border-radius:16px;overflow:hidden;">
<tr><td style="padding:20px 32px;border-bottom:1px solid ${EMAIL_THEME.border};">
<span style="font-size:18px;font-weight:700;letter-spacing:-0.01em;color:${EMAIL_THEME.text};">${COMPANY_DATA.NAME}</span>
</td></tr>
<tr><td style="padding:32px;">`;
}
