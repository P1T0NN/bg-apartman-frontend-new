// Consolidate messages/en.json groups: every component family / page gets exactly
// ONE group. Direct text sits flat under the group ("Sidebar.title"), sub-components
// nest under it with their exact names ("Sidebar.SidebarRail.toggle").
// Rewrites matching m['...'] references across src/.
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const SRC = path.join(ROOT, 'src');
const srcFile = path.join(ROOT, 'messages/en.json');

// old group prefix → new group prefix (boundary-matched, so order is irrelevant)
const RULES = [
	// Header family → one "Header" group; the header's own text is flat,
	// sub-components keep their exact names
	['NormalHeaderAuthActions', 'Header.NormalHeaderAuthActions'],
	['NormalHeaderMobile', 'Header.NormalHeaderMobile'],
	['NormalHeader', 'Header'],
	['normalHeader', 'Header'],
	// Sidebar family
	['SidebarRail', 'Sidebar.SidebarRail'],
	['SidebarTrigger', 'Sidebar.SidebarTrigger'],
	// Footer
	['footer', 'Footer'],
	// Logout
	['logoutButton', 'LogoutButton'],
	// Breadcrumb
	['BreadcrumbEllipsis', 'Breadcrumb.BreadcrumbEllipsis'],
	// Pagination
	['PaginationNext', 'Pagination.PaginationNext'],
	['PaginationPrevious', 'Pagination.PaginationPrevious'],
	// Bookings detail sheet family
	['BookingsDetailSheetActions', 'BookingsDetailSheet.BookingsDetailSheetActions'],
	['BookingsDetailSheetCancellation', 'BookingsDetailSheet.BookingsDetailSheetCancellation'],
	['BookingsDetailSheetGuestContact', 'BookingsDetailSheet.BookingsDetailSheetGuestContact'],
	['BookingsDetailSheetPriceBreakdown', 'BookingsDetailSheet.BookingsDetailSheetPriceBreakdown'],
	['BookingsDetailSheetPropertyInfo', 'BookingsDetailSheet.BookingsDetailSheetPropertyInfo'],
	['BookingsDetailSheetSpecialRequests', 'BookingsDetailSheet.BookingsDetailSheetSpecialRequests'],
	['BookingsDetailSheetStayInfo', 'BookingsDetailSheet.BookingsDetailSheetStayInfo'],
	// Email verification family
	['EmailVerificationResend', 'EmailVerificationForm.EmailVerificationResend'],
	// Accommodation card family
	['AccommodationCardBody', 'AccommodationCard.AccommodationCardBody'],
	// Upload file family
	['UploadFileEmpty', 'UploadFile.UploadFileEmpty'],
	['UploadFileItemMultiple', 'UploadFile.UploadFileItemMultiple'],
	['UploadFileItemSingle', 'UploadFile.UploadFileItemSingle'],
	['UploadFileMultipleDropzone', 'UploadFile.UploadFileMultipleDropzone'],
	['UploadFileMultipleList', 'UploadFile.UploadFileMultipleList'],
	['UploadFileSingleContent', 'UploadFile.UploadFileSingleContent'],
	['UploadFileSingleDropzone', 'UploadFile.UploadFileSingleDropzone'],
	// Sign up page (exact spelling) + its two form variants
	['SignUpFormNoImage', 'SignUpPage.SignUpFormNoImage'],
	['SignUpFormWithImage', 'SignUpPage.SignUpFormWithImage'],
	['SignupPage', 'SignUpPage'],
	// Login page + its two form variants
	['LoginFormNoImage', 'LoginPage.LoginFormNoImage'],
	['LoginFormWithImage', 'LoginPage.LoginFormWithImage'],
	// Lowercase page groups duplicating their uppercase page
	['accommodationPage', 'AccommodationPage'],
	['adminReportsPage', 'AdminReportsPage'],
	['hostAnalyticsPage', 'HostAnalyticsPage'],
	['hostMyAccommodationsPage', 'HostMyAccommodationsPage'],
	['searchPage', 'SearchPage'],
	// Admin add-accommodation page components
	['AdminAddAccommodationForm', 'AdminAddAccommodationPage.AdminAddAccommodationForm'],
	['AdminAddAccommodationHeader', 'AdminAddAccommodationPage.AdminAddAccommodationHeader'],
	['AdminAmenitiesField', 'AdminAddAccommodationPage.AdminAmenitiesField'],
	// Layout naming consistency (HostLayout / AdminLayout exist)
	['Guest', 'GuestLayout'],
	// Form modules → uppercase first letter, nested under their page
	['addAccommodationForm', 'HostAddAccommodationPage.AddAccommodationForm'],
	['editAccommodationForm', 'HostEditAccommodationPage.EditAccommodationForm'],
	['bookGuestForm', 'BookPage.BookGuestForm'],
	['adminAddAccommodationForm', 'AdminAddAccommodationPage.AdminAddAccommodationForm'],
	['passwordResetFormModel', 'ForgotPasswordPage.PasswordResetFormModel'],
	['subscribeToNewsletterForm', 'HomePage.SubscribeToNewsletterForm'],
	// Search input family (children live in the search-input/ folder)
	['SearchDropdown', 'SearchInput.SearchDropdown'],
	['SearchEmpty', 'SearchInput.SearchEmpty'],
	// Mutation form family
	['CounterField', 'MutationForm.CounterField'],
	// Availability calendar family
	['AvailabilityCalendarLegend', 'AvailabilityCalendar.AvailabilityCalendarLegend'],
	// Accommodation card family
	['NewAccommodationBadge', 'AccommodationCard.NewAccommodationBadge'],
	// Bookings detail sheet family (dialogs + stay panel render in the sheet subtree)
	['StayConfirmationPanel', 'BookingsDetailSheet.StayConfirmationPanel'],
	['CancelBookingDialog', 'BookingsDetailSheet.CancelBookingDialog'],
	['DeclineBookingDialog', 'BookingsDetailSheet.DeclineBookingDialog'],
	['ConfirmBookingDialog', 'BookingsDetailSheet.ConfirmBookingDialog'],
	['ConfirmBookingButton', 'BookingsDetailSheet.ConfirmBookingDialog.ConfirmBookingButton'],
	// Bookings table family
	['ActionsField', 'BookingsTable.ActionsField'],
	// Feature components → FeaturesNameFeature.(ComponentName); nested children follow
	// their root (e.g. BookingsFeature.BookingsDetailSheet.BookingsDetailSheetActions)
	['AccommodationCard', 'AccommodationsFeature.AccommodationCard'],
	['SuperhostBadge', 'AccommodationsFeature.SuperhostBadge'],
	['SameDayDisplay', 'AccommodationsFeature.SameDayDisplay'],
	['SingleStayDisplay', 'AccommodationsFeature.SingleStayDisplay'],
	['AuthErrorBanner', 'AuthFeature.AuthErrorBanner'],
	['EmailVerificationForm', 'AuthFeature.EmailVerificationForm'],
	['GoogleLoginButton', 'AuthFeature.GoogleLoginButton'],
	['LoginButton', 'AuthFeature.LoginButton'],
	['LogoutButton', 'AuthFeature.LogoutButton'],
	['PasswordInput', 'AuthFeature.PasswordInput'],
	['PasswordResetForm', 'AuthFeature.PasswordResetForm'],
	['BookingsTable', 'BookingsFeature.BookingsTable'],
	['BookingExpiryBadge', 'BookingsFeature.BookingExpiryBadge'],
	['BookingsDetailSheet', 'BookingsFeature.BookingsDetailSheet'],
	['GuestBookingActions', 'BookingsFeature.GuestBookingActions'],
	['GuestStayConfirmation', 'BookingsFeature.GuestStayConfirmation'],
	['ToggleFavoriteButton', 'FavoritesFeature.ToggleFavoriteButton'],
	['UploadFile', 'UploadFileFeature.UploadFile'],
	['SaveUploadedFile', 'UploadFileFeature.SaveUploadedFile']
];

const data = JSON.parse(fs.readFileSync(srcFile, 'utf8'));

function flatten(node, prefix = '', out = {}) {
	for (const [k, v] of Object.entries(node)) {
		const id = prefix ? `${prefix}.${k}` : k;
		if (v && typeof v === 'object') flatten(v, id, out);
		else out[id] = v;
	}
	return out;
}

function mapId(id) {
	for (const [oldP, newP] of RULES) {
		if (id === oldP || id.startsWith(`${oldP}.`)) return newP + id.slice(oldP.length);
	}
	return id;
}

function nest(flat) {
	const out = {};
	for (const [id, value] of Object.entries(flat)) {
		const parts = id.split('.');
		let node = out;
		for (const seg of parts.slice(0, -1)) {
			node[seg] ??= {};
			node = node[seg];
		}
		node[parts.at(-1)] = value;
	}
	return out;
}

const flat = flatten(data);
const mapped = {};
let moved = 0;
for (const [id, value] of Object.entries(flat)) {
	const mid = mapId(id);
	if (mapped[mid] !== undefined && mapped[mid] !== value)
		throw new Error(`COLLISION on "${mid}": ${JSON.stringify(mapped[mid])} vs ${JSON.stringify(value)}`);
	if (mid !== id) moved++;
	mapped[mid] = value;
}

// Verify every m['...'] reference in src still resolves against the OLD ids,
// so the rewrite below is complete.
const refs = new Set();
function walk(dir) {
	for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
		if (f.name === 'paraglide' || f.name === 'node_modules') continue;
		const p = path.join(dir, f.name);
		if (f.isDirectory()) walk(p);
		else if (/\.(svelte|ts|js)$/.test(f.name)) {
			const text = fs.readFileSync(p, 'utf8');
			for (const m of text.matchAll(/m\[['"]([^'"]+)['"]\]/g)) refs.add(m[1]);
		}
	}
}
walk(SRC);
const unknown = [...refs].filter((r) => !(r in flat));
if (unknown.length) {
	console.error('REFERENCES TO UNKNOWN IDS (left untouched):');
	for (const u of unknown) console.error(`  ${u}`);
}

const renames = Object.fromEntries(
	[...refs].filter((r) => r in flat && mapId(r) !== r).map((r) => [r, mapId(r)])
);
let filesChanged = 0;
(function walk(dir) {
	for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
		if (f.name === 'paraglide' || f.name === 'node_modules') continue;
		const p = path.join(dir, f.name);
		if (f.isDirectory()) walk(p);
		else if (/\.(svelte|ts|js)$/.test(f.name)) {
			let text = fs.readFileSync(p, 'utf8');
			const before = text;
			for (const [oldId, newId] of Object.entries(renames)) {
				text = text.split(`m['${oldId}']`).join(`m['${newId}']`);
				text = text.split(`m["${oldId}"]`).join(`m["${newId}"]`);
			}
			if (text !== before) {
				fs.writeFileSync(p, text);
				filesChanged++;
			}
		}
	}
})(SRC);

fs.writeFileSync(srcFile, JSON.stringify({ $schema: data.$schema, ...nest(mapped) }, null, '\t') + '\n');

console.log(`mapped ${moved} of ${Object.keys(flat).length} message ids`);
console.log(`top-level groups: ${Object.keys(nest(mapped)).length}`);
console.log(`updated ${filesChanged} source files`);
