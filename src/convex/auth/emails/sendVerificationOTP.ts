// LIBRARIES
import { Resend as ResendAPI } from 'resend';

// CONFIG
import { CONVEX_PROJECT_SETTINGS } from '../../projectSettings';

type OtpType = 'sign-in' | 'email-verification' | 'forget-password' | 'change-email';

export async function sendVerificationOTP({
	email,
	otp,
	type
}: {
	email: string;
	otp: string;
	type: OtpType;
}) {
	const apiKey = process.env.RESEND_API_KEY;
	if (!apiKey) throw new Error('RESEND_API_KEY is not set');
	const resend = new ResendAPI(apiKey);

	const subjects: Record<OtpType, string> = {
		'sign-in': `Sign in to ${CONVEX_PROJECT_SETTINGS.NAME}`,
		'email-verification': `Verify your email for ${CONVEX_PROJECT_SETTINGS.NAME}`,
		'forget-password': `Reset your ${CONVEX_PROJECT_SETTINGS.NAME} password`,
		'change-email': `Confirm your new email for ${CONVEX_PROJECT_SETTINGS.NAME}`
	};

	const { error } = await resend.emails.send({
		from: `${CONVEX_PROJECT_SETTINGS.NAME} <${CONVEX_PROJECT_SETTINGS.RESEND_EMAIL}>`,
		to: [email],
		subject: subjects[type],
		text: `Your code is ${otp}`
	});
	if (error) throw new Error('Could not send verification email');
}
