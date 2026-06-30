/**
 * Shared primitives for the HTML email templates. Framework-free (plain TS + Intl) so Convex
 * can bundle it — no `.svelte`, no `$app`, no browser globals. Email clients only reliably
 * render tables + inline styles, so everything here emits exactly that.
 */

// UTILS
import { escapeHtml } from '@/shared/utils/escapeHtml';

/** Brand palette + sizes, in one place so header/footer/body stay visually consistent. */
export const EMAIL_THEME = {
	bg: '#f4f4f5',
	card: '#ffffff',
	border: '#e4e4e7',
	text: '#18181b',
	muted: '#71717a',
	brand: '#18181b',
	brandText: '#ffffff',
	font: "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif"
} as const;

/** Primary call-to-action button. `href` is always an app-built URL (never user input). */
export function emailButton(label: string, href: string): string {
	return `<a href="${href}" style="display:inline-block;background:${EMAIL_THEME.brand};color:${EMAIL_THEME.brandText};text-decoration:none;font-weight:600;font-size:15px;padding:12px 24px;border-radius:10px;">${escapeHtml(label)}</a>`;
}

/** One `label … value` row in a details table. Both sides are escaped. */
export function detailRow(label: string, value: string): string {
	return `<tr>
<td style="padding:10px 0;border-bottom:1px solid #f4f4f5;color:${EMAIL_THEME.muted};font-size:14px;">${escapeHtml(label)}</td>
<td align="right" style="padding:10px 0;border-bottom:1px solid #f4f4f5;color:${EMAIL_THEME.text};font-size:14px;font-weight:600;">${escapeHtml(value)}</td>
</tr>`;
}

/**
 * The shared body layout every email uses: headline, intro paragraph, optional monospace code box,
 * a details table, and a primary button. Returns the inner HTML that sits between
 * {@link emailHeaderTemplate} and {@link emailFooterTemplate}.
 *
 * All text here is treated as plain text and escaped at this boundary (`heading`, `intro`,
 * `code`; rows via {@link detailRow}; the button label via {@link emailButton}). Callers pass
 * already-localized copy and raw values — never pre-escaped HTML.
 */
export function emailBody(content: {
	heading: string;
	intro: string;
	/** Optional highlighted code (e.g. a booking confirmation code). */
	code?: { label: string; value: string };
	rows: { label: string; value: string }[];
	cta: { label: string; url: string };
}): string {
	const codeBox = content.code
		? `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;border:1px dashed ${EMAIL_THEME.border};border-radius:12px;background:#fafafa;">
<tr><td align="center" style="padding:16px;">
<p style="margin:0 0 4px;font-size:11px;font-weight:600;letter-spacing:1px;text-transform:uppercase;color:${EMAIL_THEME.muted};">${escapeHtml(content.code.label)}</p>
<p style="margin:0;font-size:26px;font-weight:700;letter-spacing:4px;color:${EMAIL_THEME.text};font-family:monospace;">${escapeHtml(content.code.value)}</p>
</td></tr>
</table>`
		: '';

	return `
<h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:${EMAIL_THEME.text};">${escapeHtml(content.heading)}</h1>
<p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:${EMAIL_THEME.muted};">${escapeHtml(content.intro)}</p>
${codeBox}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
${content.rows.map((row) => detailRow(row.label, row.value)).join('')}
</table>

<table role="presentation" cellpadding="0" cellspacing="0"><tr><td>
${emailButton(content.cta.label, content.cta.url)}
</td></tr></table>`;
}
