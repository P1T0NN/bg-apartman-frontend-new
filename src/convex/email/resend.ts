// LIBRARIES
import { Resend } from '@convex-dev/resend';
import { components } from '../_generated/api';

// CONFIG
import { COMPANY_DATA } from '@/shared/constants.js';

// TYPES
import type { MutationCtx, ActionCtx } from '../_generated/server';

export type EmailCtx = MutationCtx | ActionCtx;

/**
 * Durable transactional email via the `@convex-dev/resend` component: each send is enqueued in a
 * Convex table with retries + rate-limiting, so a failed Resend API call doesn't drop the email
 * (unlike a fire-and-forget `fetch`). Triggered from the mutation/action that owns the data.
 *
 * `testMode: false` → real delivery. In test mode the component only sends to Resend-approved test
 * addresses, so production mail would silently not arrive.
 */
export const resend = new Resend(components.resend, { testMode: false });

/** Enqueue one HTML email to a single recipient. */
export async function sendEmail(
	ctx: EmailCtx,
	to: string,
	email: { subject: string; html: string }
): Promise<void> {
	const FROM = `${COMPANY_DATA.NAME} <${COMPANY_DATA.RESEND_EMAIL}>`;

	await resend.sendEmail(ctx, { from: FROM, to, subject: email.subject, html: email.html });
}

export const homeUrl = (): string => process.env.SITE_URL!;
export const reservationUrl = (bookingId: string): string => `${process.env.SITE_URL!}/reservations/${bookingId}`;
export const hostReservationsUrl = (): string => `${process.env.SITE_URL!}/host/reservations`;
export const editAccommodationUrl = (apartmentId: string): string =>
	`${process.env.SITE_URL!}/host/my-accommodations/edit-accommodation/${apartmentId}`;
