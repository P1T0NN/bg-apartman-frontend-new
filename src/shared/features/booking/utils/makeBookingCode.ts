// Guest-readable alphabet — no 0/O/1/I so a code can be read off a screen or over the phone.
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function makeBookingCode(): string {
	let code = 'BK';
	for (let i = 0; i < 8; i++)
		code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
	return code;
}
