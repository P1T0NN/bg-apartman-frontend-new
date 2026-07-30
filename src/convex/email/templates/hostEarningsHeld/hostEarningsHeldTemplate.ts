// SHARED
import { emailBody } from '../shared';
import { emailHeaderTemplate } from '../header/emailHeaderTemplate';
import { emailFooterTemplate } from '../footer/emailFooterTemplate';
import { t, pickLocale } from '@/convex/i18n';

/**
 * Stage 3 of host onboarding (PaymentsSystemDesign.md §2): the ONE ask, sent at the
 * dopamine peak — the host just earned money.
 *
 * Copy rules this template exists to enforce, and which are as binding as the flow:
 *  - It says "add your payout details to receive €X". It NEVER says "verify your
 *    identity", "KYC" or "compliance" — the regulatory steps live inside the
 *    provider-hosted flow, which asks only what is legally required, incrementally.
 *  - It goes out when the balance GROWS (each new capture), never on a timer. The growing
 *    number is the whole drip campaign.
 *  - Nothing expires and nothing is lost by ignoring it. A host can decline forever.
 */
type HostEarningsHeldData = {
	hostName: string;
	/** Whole euros the host just earned from one booking. */
	earnedEuros: number;
	/** Whole euros waiting in total. */
	heldEuros: number;
	dashboardUrl: string;
	/** Host's locale; unknown values fall back to `en`. */
	locale: string;
};

export function hostEarningsHeldTemplate(data: HostEarningsHeldData): {
	subject: string;
	html: string;
} {
	const locale = pickLocale(data.locale);
	const ns = 'hostEarningsHeld';

	// Money formatted for humans in the ONE place that is allowed to (emails render
	// server-side by nature — GeneralSystemDesignRule.md § backend returns data, exception 2).
	const money = new Intl.NumberFormat(locale, {
		style: 'currency',
		currency: 'EUR',
		maximumFractionDigits: 0
	});

	const earned = money.format(data.earnedEuros);
	const held = money.format(data.heldEuros);

	const subject = t(locale, `${ns}.subject`, { amount: earned });

	const html =
		emailHeaderTemplate(locale) +
		emailBody({
			heading: t(locale, `${ns}.heading`, { amount: earned }),
			intro: t(locale, `${ns}.intro`, { name: data.hostName, amount: earned, held }),
			rows: [
				{ label: t(locale, `${ns}.rowEarned`), value: earned },
				{ label: t(locale, `${ns}.rowHeld`), value: held }
			],
			cta: { label: t(locale, `${ns}.cta`), url: data.dashboardUrl }
		}) +
		emailFooterTemplate(locale);

	return { subject, html };
}
