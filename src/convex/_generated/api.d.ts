/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as analytics_analytics from "../analytics/analytics.js";
import type * as analytics_backfillOccupancyNights from "../analytics/backfillOccupancyNights.js";
import type * as analytics_index from "../analytics/index.js";
import type * as analytics_sumRollups from "../analytics/sumRollups.js";
import type * as auth_auth from "../auth/auth.js";
import type * as auth_authRoutes from "../auth/authRoutes.js";
import type * as auth_convexCreateAuthRateLimitHook from "../auth/convexCreateAuthRateLimitHook.js";
import type * as auth_emails_sendVerificationOTP from "../auth/emails/sendVerificationOTP.js";
import type * as auth_helpers_getAuthUserId from "../auth/helpers/getAuthUserId.js";
import type * as auth_helpers_requireAuthUserId from "../auth/helpers/requireAuthUserId.js";
import type * as auth_middleware_authMiddleware from "../auth/middleware/authMiddleware.js";
import type * as auth_queries_authQueries from "../auth/queries/authQueries.js";
import type * as auth_utils_getEmailFromAuthBody from "../auth/utils/getEmailFromAuthBody.js";
import type * as convexRateLimiter from "../convexRateLimiter.js";
import type * as crons from "../crons.js";
import type * as email_resend from "../email/resend.js";
import type * as email_sendAccommodationPublishedEmail from "../email/sendAccommodationPublishedEmail.js";
import type * as email_sendAccommodationSuspendedEmail from "../email/sendAccommodationSuspendedEmail.js";
import type * as email_sendBookingAutoDeclinedEmail from "../email/sendBookingAutoDeclinedEmail.js";
import type * as email_sendBookingCancelledEmail from "../email/sendBookingCancelledEmail.js";
import type * as email_sendBookingCancelledHostEmail from "../email/sendBookingCancelledHostEmail.js";
import type * as email_sendBookingConfirmedEmail from "../email/sendBookingConfirmedEmail.js";
import type * as email_sendBookingDeclinedEmail from "../email/sendBookingDeclinedEmail.js";
import type * as email_sendBookingMissedEmail from "../email/sendBookingMissedEmail.js";
import type * as email_sendBookingWithdrawnEmail from "../email/sendBookingWithdrawnEmail.js";
import type * as email_sendCreateAccommodationEmail from "../email/sendCreateAccommodationEmail.js";
import type * as email_sendCreateBookingEmail from "../email/sendCreateBookingEmail.js";
import type * as email_sendHostEarningsHeldEmail from "../email/sendHostEarningsHeldEmail.js";
import type * as email_sendListingFeeEmails from "../email/sendListingFeeEmails.js";
import type * as email_sendStayConfirmationRequestEmail from "../email/sendStayConfirmationRequestEmail.js";
import type * as email_sendStayConfirmedEmail from "../email/sendStayConfirmedEmail.js";
import type * as email_templates_accommodationPublished_accommodationPublishedTemplate from "../email/templates/accommodationPublished/accommodationPublishedTemplate.js";
import type * as email_templates_accommodationSuspended_accommodationSuspendedTemplate from "../email/templates/accommodationSuspended/accommodationSuspendedTemplate.js";
import type * as email_templates_bookingAutoDeclined_bookingAutoDeclinedTemplate from "../email/templates/bookingAutoDeclined/bookingAutoDeclinedTemplate.js";
import type * as email_templates_bookingCancelled_bookingCancelledHostTemplate from "../email/templates/bookingCancelled/bookingCancelledHostTemplate.js";
import type * as email_templates_bookingCancelled_bookingCancelledTemplate from "../email/templates/bookingCancelled/bookingCancelledTemplate.js";
import type * as email_templates_bookingConfirmed_bookingConfirmedTemplate from "../email/templates/bookingConfirmed/bookingConfirmedTemplate.js";
import type * as email_templates_bookingDeclined_bookingDeclinedTemplate from "../email/templates/bookingDeclined/bookingDeclinedTemplate.js";
import type * as email_templates_bookingMissed_bookingMissedTemplate from "../email/templates/bookingMissed/bookingMissedTemplate.js";
import type * as email_templates_bookingWithdrawn_bookingWithdrawnTemplate from "../email/templates/bookingWithdrawn/bookingWithdrawnTemplate.js";
import type * as email_templates_createAccommodation_createAccommodationTemplate from "../email/templates/createAccommodation/createAccommodationTemplate.js";
import type * as email_templates_createBooking_createBookingForGuestTemplate from "../email/templates/createBooking/createBookingForGuestTemplate.js";
import type * as email_templates_createBooking_createBookingForOwnerTemplate from "../email/templates/createBooking/createBookingForOwnerTemplate.js";
import type * as email_templates_footer_emailFooterTemplate from "../email/templates/footer/emailFooterTemplate.js";
import type * as email_templates_header_emailHeaderTemplate from "../email/templates/header/emailHeaderTemplate.js";
import type * as email_templates_hostEarningsHeld_hostEarningsHeldTemplate from "../email/templates/hostEarningsHeld/hostEarningsHeldTemplate.js";
import type * as email_templates_listingFee_listingFeeLapsedTemplate from "../email/templates/listingFee/listingFeeLapsedTemplate.js";
import type * as email_templates_listingFee_listingFeeReminderTemplate from "../email/templates/listingFee/listingFeeReminderTemplate.js";
import type * as email_templates_shared from "../email/templates/shared.js";
import type * as email_templates_stayConfirmation_stayConfirmationRequestTemplate from "../email/templates/stayConfirmation/stayConfirmationRequestTemplate.js";
import type * as email_templates_stayConfirmation_stayConfirmedTemplate from "../email/templates/stayConfirmation/stayConfirmedTemplate.js";
import type * as functions from "../functions.js";
import type * as helpers_convexGetRateLimitedUserId from "../helpers/convexGetRateLimitedUserId.js";
import type * as helpers_createDeleteMutation from "../helpers/createDeleteMutation.js";
import type * as http from "../http.js";
import type * as i18n_index from "../i18n/index.js";
import type * as pages_admin_dashboard_queries_fetchAdminDashboardPageSafe from "../pages/admin/dashboard/queries/fetchAdminDashboardPageSafe.js";
import type * as pages_admin_dashboard_types_adminDashboardTypes from "../pages/admin/dashboard/types/adminDashboardTypes.js";
import type * as pages_admin_queries_fetchAdminSidebarBadgesSafe from "../pages/admin/queries/fetchAdminSidebarBadgesSafe.js";
import type * as pages_guest_dashboard_queries_fetchGuestDashboardPageSafe from "../pages/guest/dashboard/queries/fetchGuestDashboardPageSafe.js";
import type * as pages_guest_dashboard_types_guestDashboardTypes from "../pages/guest/dashboard/types/guestDashboardTypes.js";
import type * as pages_guest_dashboard_utils_bookingToGuestTripSummary from "../pages/guest/dashboard/utils/bookingToGuestTripSummary.js";
import type * as pages_host_analytics_queries_fetchHostAnalyticsSafe from "../pages/host/analytics/queries/fetchHostAnalyticsSafe.js";
import type * as pages_host_analytics_types_hostAnalyticsTypes from "../pages/host/analytics/types/hostAnalyticsTypes.js";
import type * as pages_host_dashboard_queries_fetchHostDashboardPendingBookings from "../pages/host/dashboard/queries/fetchHostDashboardPendingBookings.js";
import type * as pages_host_dashboard_queries_fetchHostDashboardStats from "../pages/host/dashboard/queries/fetchHostDashboardStats.js";
import type * as pages_host_dashboard_types_hostDashboardTypes from "../pages/host/dashboard/types/hostDashboardTypes.js";
import type * as pagination_fetchOptimized_createSearchQuery from "../pagination/fetchOptimized/createSearchQuery.js";
import type * as pagination_fetchOptimized_fetchOptimized from "../pagination/fetchOptimized/fetchOptimized.js";
import type * as pagination_fetchOptimized_index from "../pagination/fetchOptimized/index.js";
import type * as pagination_fetchOptimized_kit from "../pagination/fetchOptimized/kit.js";
import type * as pagination_fetchOptimized_types from "../pagination/fetchOptimized/types.js";
import type * as pagination_paginationHelpers from "../pagination/paginationHelpers.js";
import type * as rateLimits_convexCreateRateLimit from "../rateLimits/convexCreateRateLimit.js";
import type * as rateLimits_convexCreateRateLimitInternal from "../rateLimits/convexCreateRateLimitInternal.js";
import type * as rateLimits_searchRateLimitMutations from "../rateLimits/searchRateLimitMutations.js";
import type * as schemas_schemas from "../schemas/schemas.js";
import type * as storage_convexStorage_storageMutations from "../storage/convexStorage/storageMutations.js";
import type * as storage_convexStorage_uploadedFiles from "../storage/convexStorage/uploadedFiles.js";
import type * as storage_crons_cleanupOrphanDataConvexStorage from "../storage/crons/cleanupOrphanDataConvexStorage.js";
import type * as storage_crons_cleanupOrphanDataR2 from "../storage/crons/cleanupOrphanDataR2.js";
import type * as storage_r2_r2 from "../storage/r2/r2.js";
import type * as storage_r2_uploadedFilesR2 from "../storage/r2/uploadedFilesR2.js";
import type * as storage_registerStorageCrons from "../storage/registerStorageCrons.js";
import type * as tables_accommodations_crons_backfillRegionPlaceIds from "../tables/accommodations/crons/backfillRegionPlaceIds.js";
import type * as tables_accommodations_crons_listingFeeSweepCron from "../tables/accommodations/crons/listingFeeSweepCron.js";
import type * as tables_accommodations_helpers_deleteApartmentImages from "../tables/accommodations/helpers/deleteApartmentImages.js";
import type * as tables_accommodations_helpers_resolveFavoriteAccommodations from "../tables/accommodations/helpers/resolveFavoriteAccommodations.js";
import type * as tables_accommodations_helpers_searchAccommodationsStream from "../tables/accommodations/helpers/searchAccommodationsStream.js";
import type * as tables_accommodations_mutations_createAccommodation from "../tables/accommodations/mutations/createAccommodation.js";
import type * as tables_accommodations_mutations_deleteAccommodation from "../tables/accommodations/mutations/deleteAccommodation.js";
import type * as tables_accommodations_mutations_grantFreePublish from "../tables/accommodations/mutations/grantFreePublish.js";
import type * as tables_accommodations_mutations_setApartmentFeatured from "../tables/accommodations/mutations/setApartmentFeatured.js";
import type * as tables_accommodations_mutations_switchListingMonetization from "../tables/accommodations/mutations/switchListingMonetization.js";
import type * as tables_accommodations_mutations_syncHostSuperhost from "../tables/accommodations/mutations/syncHostSuperhost.js";
import type * as tables_accommodations_mutations_updateAccommodation from "../tables/accommodations/mutations/updateAccommodation.js";
import type * as tables_accommodations_queries_fetchAccommodationById from "../tables/accommodations/queries/fetchAccommodationById.js";
import type * as tables_accommodations_queries_fetchAccommodationBySlugForBookSafe from "../tables/accommodations/queries/fetchAccommodationBySlugForBookSafe.js";
import type * as tables_accommodations_queries_fetchAccommodationBySlugSafe from "../tables/accommodations/queries/fetchAccommodationBySlugSafe.js";
import type * as tables_accommodations_queries_fetchFavoriteAccommodationsSafe from "../tables/accommodations/queries/fetchFavoriteAccommodationsSafe.js";
import type * as tables_accommodations_queries_fetchFeaturedAccommodations from "../tables/accommodations/queries/fetchFeaturedAccommodations.js";
import type * as tables_accommodations_queries_fetchMyAccommodations from "../tables/accommodations/queries/fetchMyAccommodations.js";
import type * as tables_accommodations_queries_fetchSearchAccommodationCardSafe from "../tables/accommodations/queries/fetchSearchAccommodationCardSafe.js";
import type * as tables_accommodations_queries_fetchSearchAccommodationsSafe from "../tables/accommodations/queries/fetchSearchAccommodationsSafe.js";
import type * as tables_accommodations_queries_fetchSearchMapMarkersSafe from "../tables/accommodations/queries/fetchSearchMapMarkersSafe.js";
import type * as tables_accommodations_queries_fetchSitemapAccommodations from "../tables/accommodations/queries/fetchSitemapAccommodations.js";
import type * as tables_accommodations_queries_listAccommodationsAdmin from "../tables/accommodations/queries/listAccommodationsAdmin.js";
import type * as tables_accommodations_registerAccommodationCrons from "../tables/accommodations/registerAccommodationCrons.js";
import type * as tables_accommodations_schemas_accommodationsSchemas from "../tables/accommodations/schemas/accommodationsSchemas.js";
import type * as tables_accommodations_utils_apartmentToSearchAccommodation from "../tables/accommodations/utils/apartmentToSearchAccommodation.js";
import type * as tables_apartmentBlocks_mutations_apartmentBlockMutations from "../tables/apartmentBlocks/mutations/apartmentBlockMutations.js";
import type * as tables_apartmentBlocks_queries_fetchApartmentCalendarSafe from "../tables/apartmentBlocks/queries/fetchApartmentCalendarSafe.js";
import type * as tables_auditLog_auditLogConfigs from "../tables/auditLog/auditLogConfigs.js";
import type * as tables_auditLog_crons_auditLogCron from "../tables/auditLog/crons/auditLogCron.js";
import type * as tables_auditLog_helpers_auditLogInternal from "../tables/auditLog/helpers/auditLogInternal.js";
import type * as tables_auditLog_helpers_logAudit from "../tables/auditLog/helpers/logAudit.js";
import type * as tables_auditLog_index from "../tables/auditLog/index.js";
import type * as tables_auditLog_queries_auditLogQueries from "../tables/auditLog/queries/auditLogQueries.js";
import type * as tables_auditLog_registerAuditLogCrons from "../tables/auditLog/registerAuditLogCrons.js";
import type * as tables_auditLog_schemas_auditLogSchema from "../tables/auditLog/schemas/auditLogSchema.js";
import type * as tables_auditLog_utils_auditLogUtils from "../tables/auditLog/utils/auditLogUtils.js";
import type * as tables_bookings_crons_bookingLifecycleCron from "../tables/bookings/crons/bookingLifecycleCron.js";
import type * as tables_bookings_helpers_collectScopedBookings from "../tables/bookings/helpers/collectScopedBookings.js";
import type * as tables_bookings_helpers_findOpenDuplicateRequest from "../tables/bookings/helpers/findOpenDuplicateRequest.js";
import type * as tables_bookings_helpers_findOverlappingPendingBookings from "../tables/bookings/helpers/findOverlappingPendingBookings.js";
import type * as tables_bookings_helpers_getUpcomingBookingForCurrentUser from "../tables/bookings/helpers/getUpcomingBookingForCurrentUser.js";
import type * as tables_bookings_helpers_hasAvailabilityConflict from "../tables/bookings/helpers/hasAvailabilityConflict.js";
import type * as tables_bookings_helpers_listUserBookings from "../tables/bookings/helpers/listUserBookings.js";
import type * as tables_bookings_helpers_resolveApartmentSummary from "../tables/bookings/helpers/resolveApartmentSummary.js";
import type * as tables_bookings_helpers_resolveReservationBooking from "../tables/bookings/helpers/resolveReservationBooking.js";
import type * as tables_bookings_mutations_cancelBookingAdmin from "../tables/bookings/mutations/cancelBookingAdmin.js";
import type * as tables_bookings_mutations_cancelBookingGuest from "../tables/bookings/mutations/cancelBookingGuest.js";
import type * as tables_bookings_mutations_cancelBookingOwner from "../tables/bookings/mutations/cancelBookingOwner.js";
import type * as tables_bookings_mutations_claimMyBookings from "../tables/bookings/mutations/claimMyBookings.js";
import type * as tables_bookings_mutations_clearPaymentFlag from "../tables/bookings/mutations/clearPaymentFlag.js";
import type * as tables_bookings_mutations_confirmBooking from "../tables/bookings/mutations/confirmBooking.js";
import type * as tables_bookings_mutations_confirmStay from "../tables/bookings/mutations/confirmStay.js";
import type * as tables_bookings_mutations_createBooking from "../tables/bookings/mutations/createBooking.js";
import type * as tables_bookings_mutations_declineBooking from "../tables/bookings/mutations/declineBooking.js";
import type * as tables_bookings_mutations_findMyReservation from "../tables/bookings/mutations/findMyReservation.js";
import type * as tables_bookings_mutations_requestStayConfirmation from "../tables/bookings/mutations/requestStayConfirmation.js";
import type * as tables_bookings_mutations_withdrawBookingGuest from "../tables/bookings/mutations/withdrawBookingGuest.js";
import type * as tables_bookings_queries_fetchBookingById from "../tables/bookings/queries/fetchBookingById.js";
import type * as tables_bookings_queries_fetchBookingByIdSafe from "../tables/bookings/queries/fetchBookingByIdSafe.js";
import type * as tables_bookings_queries_fetchHostBookingsSafe from "../tables/bookings/queries/fetchHostBookingsSafe.js";
import type * as tables_bookings_queries_fetchMyBookingsSafe from "../tables/bookings/queries/fetchMyBookingsSafe.js";
import type * as tables_bookings_queries_listBookingsAdmin from "../tables/bookings/queries/listBookingsAdmin.js";
import type * as tables_bookings_registerBookingCrons from "../tables/bookings/registerBookingCrons.js";
import type * as tables_bookings_schemas_bookingsSchemas from "../tables/bookings/schemas/bookingsSchemas.js";
import type * as tables_bookings_utils_bookingToBookingSafe from "../tables/bookings/utils/bookingToBookingSafe.js";
import type * as tables_favorites_mutations_mergeFavorites from "../tables/favorites/mutations/mergeFavorites.js";
import type * as tables_favorites_mutations_toggleFavorite from "../tables/favorites/mutations/toggleFavorite.js";
import type * as tables_favorites_queries_fetchMyFavoriteIdsSafe from "../tables/favorites/queries/fetchMyFavoriteIdsSafe.js";
import type * as tables_newsletter_mutations_subscribeToNewsletters from "../tables/newsletter/mutations/subscribeToNewsletters.js";
import type * as tables_reports_mutations_createReport from "../tables/reports/mutations/createReport.js";
import type * as tables_reports_mutations_setReportStatus from "../tables/reports/mutations/setReportStatus.js";
import type * as tables_reports_queries_listReportsSafe from "../tables/reports/queries/listReportsSafe.js";
import type * as tables_reports_schemas_reportsSchemas from "../tables/reports/schemas/reportsSchemas.js";
import type * as tables_users_userMutations from "../tables/users/userMutations.js";
import type * as tables_users_userQueries from "../tables/users/userQueries.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "analytics/analytics": typeof analytics_analytics;
  "analytics/backfillOccupancyNights": typeof analytics_backfillOccupancyNights;
  "analytics/index": typeof analytics_index;
  "analytics/sumRollups": typeof analytics_sumRollups;
  "auth/auth": typeof auth_auth;
  "auth/authRoutes": typeof auth_authRoutes;
  "auth/convexCreateAuthRateLimitHook": typeof auth_convexCreateAuthRateLimitHook;
  "auth/emails/sendVerificationOTP": typeof auth_emails_sendVerificationOTP;
  "auth/helpers/getAuthUserId": typeof auth_helpers_getAuthUserId;
  "auth/helpers/requireAuthUserId": typeof auth_helpers_requireAuthUserId;
  "auth/middleware/authMiddleware": typeof auth_middleware_authMiddleware;
  "auth/queries/authQueries": typeof auth_queries_authQueries;
  "auth/utils/getEmailFromAuthBody": typeof auth_utils_getEmailFromAuthBody;
  convexRateLimiter: typeof convexRateLimiter;
  crons: typeof crons;
  "email/resend": typeof email_resend;
  "email/sendAccommodationPublishedEmail": typeof email_sendAccommodationPublishedEmail;
  "email/sendAccommodationSuspendedEmail": typeof email_sendAccommodationSuspendedEmail;
  "email/sendBookingAutoDeclinedEmail": typeof email_sendBookingAutoDeclinedEmail;
  "email/sendBookingCancelledEmail": typeof email_sendBookingCancelledEmail;
  "email/sendBookingCancelledHostEmail": typeof email_sendBookingCancelledHostEmail;
  "email/sendBookingConfirmedEmail": typeof email_sendBookingConfirmedEmail;
  "email/sendBookingDeclinedEmail": typeof email_sendBookingDeclinedEmail;
  "email/sendBookingMissedEmail": typeof email_sendBookingMissedEmail;
  "email/sendBookingWithdrawnEmail": typeof email_sendBookingWithdrawnEmail;
  "email/sendCreateAccommodationEmail": typeof email_sendCreateAccommodationEmail;
  "email/sendCreateBookingEmail": typeof email_sendCreateBookingEmail;
  "email/sendHostEarningsHeldEmail": typeof email_sendHostEarningsHeldEmail;
  "email/sendListingFeeEmails": typeof email_sendListingFeeEmails;
  "email/sendStayConfirmationRequestEmail": typeof email_sendStayConfirmationRequestEmail;
  "email/sendStayConfirmedEmail": typeof email_sendStayConfirmedEmail;
  "email/templates/accommodationPublished/accommodationPublishedTemplate": typeof email_templates_accommodationPublished_accommodationPublishedTemplate;
  "email/templates/accommodationSuspended/accommodationSuspendedTemplate": typeof email_templates_accommodationSuspended_accommodationSuspendedTemplate;
  "email/templates/bookingAutoDeclined/bookingAutoDeclinedTemplate": typeof email_templates_bookingAutoDeclined_bookingAutoDeclinedTemplate;
  "email/templates/bookingCancelled/bookingCancelledHostTemplate": typeof email_templates_bookingCancelled_bookingCancelledHostTemplate;
  "email/templates/bookingCancelled/bookingCancelledTemplate": typeof email_templates_bookingCancelled_bookingCancelledTemplate;
  "email/templates/bookingConfirmed/bookingConfirmedTemplate": typeof email_templates_bookingConfirmed_bookingConfirmedTemplate;
  "email/templates/bookingDeclined/bookingDeclinedTemplate": typeof email_templates_bookingDeclined_bookingDeclinedTemplate;
  "email/templates/bookingMissed/bookingMissedTemplate": typeof email_templates_bookingMissed_bookingMissedTemplate;
  "email/templates/bookingWithdrawn/bookingWithdrawnTemplate": typeof email_templates_bookingWithdrawn_bookingWithdrawnTemplate;
  "email/templates/createAccommodation/createAccommodationTemplate": typeof email_templates_createAccommodation_createAccommodationTemplate;
  "email/templates/createBooking/createBookingForGuestTemplate": typeof email_templates_createBooking_createBookingForGuestTemplate;
  "email/templates/createBooking/createBookingForOwnerTemplate": typeof email_templates_createBooking_createBookingForOwnerTemplate;
  "email/templates/footer/emailFooterTemplate": typeof email_templates_footer_emailFooterTemplate;
  "email/templates/header/emailHeaderTemplate": typeof email_templates_header_emailHeaderTemplate;
  "email/templates/hostEarningsHeld/hostEarningsHeldTemplate": typeof email_templates_hostEarningsHeld_hostEarningsHeldTemplate;
  "email/templates/listingFee/listingFeeLapsedTemplate": typeof email_templates_listingFee_listingFeeLapsedTemplate;
  "email/templates/listingFee/listingFeeReminderTemplate": typeof email_templates_listingFee_listingFeeReminderTemplate;
  "email/templates/shared": typeof email_templates_shared;
  "email/templates/stayConfirmation/stayConfirmationRequestTemplate": typeof email_templates_stayConfirmation_stayConfirmationRequestTemplate;
  "email/templates/stayConfirmation/stayConfirmedTemplate": typeof email_templates_stayConfirmation_stayConfirmedTemplate;
  functions: typeof functions;
  "helpers/convexGetRateLimitedUserId": typeof helpers_convexGetRateLimitedUserId;
  "helpers/createDeleteMutation": typeof helpers_createDeleteMutation;
  http: typeof http;
  "i18n/index": typeof i18n_index;
  "pages/admin/dashboard/queries/fetchAdminDashboardPageSafe": typeof pages_admin_dashboard_queries_fetchAdminDashboardPageSafe;
  "pages/admin/dashboard/types/adminDashboardTypes": typeof pages_admin_dashboard_types_adminDashboardTypes;
  "pages/admin/queries/fetchAdminSidebarBadgesSafe": typeof pages_admin_queries_fetchAdminSidebarBadgesSafe;
  "pages/guest/dashboard/queries/fetchGuestDashboardPageSafe": typeof pages_guest_dashboard_queries_fetchGuestDashboardPageSafe;
  "pages/guest/dashboard/types/guestDashboardTypes": typeof pages_guest_dashboard_types_guestDashboardTypes;
  "pages/guest/dashboard/utils/bookingToGuestTripSummary": typeof pages_guest_dashboard_utils_bookingToGuestTripSummary;
  "pages/host/analytics/queries/fetchHostAnalyticsSafe": typeof pages_host_analytics_queries_fetchHostAnalyticsSafe;
  "pages/host/analytics/types/hostAnalyticsTypes": typeof pages_host_analytics_types_hostAnalyticsTypes;
  "pages/host/dashboard/queries/fetchHostDashboardPendingBookings": typeof pages_host_dashboard_queries_fetchHostDashboardPendingBookings;
  "pages/host/dashboard/queries/fetchHostDashboardStats": typeof pages_host_dashboard_queries_fetchHostDashboardStats;
  "pages/host/dashboard/types/hostDashboardTypes": typeof pages_host_dashboard_types_hostDashboardTypes;
  "pagination/fetchOptimized/createSearchQuery": typeof pagination_fetchOptimized_createSearchQuery;
  "pagination/fetchOptimized/fetchOptimized": typeof pagination_fetchOptimized_fetchOptimized;
  "pagination/fetchOptimized/index": typeof pagination_fetchOptimized_index;
  "pagination/fetchOptimized/kit": typeof pagination_fetchOptimized_kit;
  "pagination/fetchOptimized/types": typeof pagination_fetchOptimized_types;
  "pagination/paginationHelpers": typeof pagination_paginationHelpers;
  "rateLimits/convexCreateRateLimit": typeof rateLimits_convexCreateRateLimit;
  "rateLimits/convexCreateRateLimitInternal": typeof rateLimits_convexCreateRateLimitInternal;
  "rateLimits/searchRateLimitMutations": typeof rateLimits_searchRateLimitMutations;
  "schemas/schemas": typeof schemas_schemas;
  "storage/convexStorage/storageMutations": typeof storage_convexStorage_storageMutations;
  "storage/convexStorage/uploadedFiles": typeof storage_convexStorage_uploadedFiles;
  "storage/crons/cleanupOrphanDataConvexStorage": typeof storage_crons_cleanupOrphanDataConvexStorage;
  "storage/crons/cleanupOrphanDataR2": typeof storage_crons_cleanupOrphanDataR2;
  "storage/r2/r2": typeof storage_r2_r2;
  "storage/r2/uploadedFilesR2": typeof storage_r2_uploadedFilesR2;
  "storage/registerStorageCrons": typeof storage_registerStorageCrons;
  "tables/accommodations/crons/backfillRegionPlaceIds": typeof tables_accommodations_crons_backfillRegionPlaceIds;
  "tables/accommodations/crons/listingFeeSweepCron": typeof tables_accommodations_crons_listingFeeSweepCron;
  "tables/accommodations/helpers/deleteApartmentImages": typeof tables_accommodations_helpers_deleteApartmentImages;
  "tables/accommodations/helpers/resolveFavoriteAccommodations": typeof tables_accommodations_helpers_resolveFavoriteAccommodations;
  "tables/accommodations/helpers/searchAccommodationsStream": typeof tables_accommodations_helpers_searchAccommodationsStream;
  "tables/accommodations/mutations/createAccommodation": typeof tables_accommodations_mutations_createAccommodation;
  "tables/accommodations/mutations/deleteAccommodation": typeof tables_accommodations_mutations_deleteAccommodation;
  "tables/accommodations/mutations/grantFreePublish": typeof tables_accommodations_mutations_grantFreePublish;
  "tables/accommodations/mutations/setApartmentFeatured": typeof tables_accommodations_mutations_setApartmentFeatured;
  "tables/accommodations/mutations/switchListingMonetization": typeof tables_accommodations_mutations_switchListingMonetization;
  "tables/accommodations/mutations/syncHostSuperhost": typeof tables_accommodations_mutations_syncHostSuperhost;
  "tables/accommodations/mutations/updateAccommodation": typeof tables_accommodations_mutations_updateAccommodation;
  "tables/accommodations/queries/fetchAccommodationById": typeof tables_accommodations_queries_fetchAccommodationById;
  "tables/accommodations/queries/fetchAccommodationBySlugForBookSafe": typeof tables_accommodations_queries_fetchAccommodationBySlugForBookSafe;
  "tables/accommodations/queries/fetchAccommodationBySlugSafe": typeof tables_accommodations_queries_fetchAccommodationBySlugSafe;
  "tables/accommodations/queries/fetchFavoriteAccommodationsSafe": typeof tables_accommodations_queries_fetchFavoriteAccommodationsSafe;
  "tables/accommodations/queries/fetchFeaturedAccommodations": typeof tables_accommodations_queries_fetchFeaturedAccommodations;
  "tables/accommodations/queries/fetchMyAccommodations": typeof tables_accommodations_queries_fetchMyAccommodations;
  "tables/accommodations/queries/fetchSearchAccommodationCardSafe": typeof tables_accommodations_queries_fetchSearchAccommodationCardSafe;
  "tables/accommodations/queries/fetchSearchAccommodationsSafe": typeof tables_accommodations_queries_fetchSearchAccommodationsSafe;
  "tables/accommodations/queries/fetchSearchMapMarkersSafe": typeof tables_accommodations_queries_fetchSearchMapMarkersSafe;
  "tables/accommodations/queries/fetchSitemapAccommodations": typeof tables_accommodations_queries_fetchSitemapAccommodations;
  "tables/accommodations/queries/listAccommodationsAdmin": typeof tables_accommodations_queries_listAccommodationsAdmin;
  "tables/accommodations/registerAccommodationCrons": typeof tables_accommodations_registerAccommodationCrons;
  "tables/accommodations/schemas/accommodationsSchemas": typeof tables_accommodations_schemas_accommodationsSchemas;
  "tables/accommodations/utils/apartmentToSearchAccommodation": typeof tables_accommodations_utils_apartmentToSearchAccommodation;
  "tables/apartmentBlocks/mutations/apartmentBlockMutations": typeof tables_apartmentBlocks_mutations_apartmentBlockMutations;
  "tables/apartmentBlocks/queries/fetchApartmentCalendarSafe": typeof tables_apartmentBlocks_queries_fetchApartmentCalendarSafe;
  "tables/auditLog/auditLogConfigs": typeof tables_auditLog_auditLogConfigs;
  "tables/auditLog/crons/auditLogCron": typeof tables_auditLog_crons_auditLogCron;
  "tables/auditLog/helpers/auditLogInternal": typeof tables_auditLog_helpers_auditLogInternal;
  "tables/auditLog/helpers/logAudit": typeof tables_auditLog_helpers_logAudit;
  "tables/auditLog/index": typeof tables_auditLog_index;
  "tables/auditLog/queries/auditLogQueries": typeof tables_auditLog_queries_auditLogQueries;
  "tables/auditLog/registerAuditLogCrons": typeof tables_auditLog_registerAuditLogCrons;
  "tables/auditLog/schemas/auditLogSchema": typeof tables_auditLog_schemas_auditLogSchema;
  "tables/auditLog/utils/auditLogUtils": typeof tables_auditLog_utils_auditLogUtils;
  "tables/bookings/crons/bookingLifecycleCron": typeof tables_bookings_crons_bookingLifecycleCron;
  "tables/bookings/helpers/collectScopedBookings": typeof tables_bookings_helpers_collectScopedBookings;
  "tables/bookings/helpers/findOpenDuplicateRequest": typeof tables_bookings_helpers_findOpenDuplicateRequest;
  "tables/bookings/helpers/findOverlappingPendingBookings": typeof tables_bookings_helpers_findOverlappingPendingBookings;
  "tables/bookings/helpers/getUpcomingBookingForCurrentUser": typeof tables_bookings_helpers_getUpcomingBookingForCurrentUser;
  "tables/bookings/helpers/hasAvailabilityConflict": typeof tables_bookings_helpers_hasAvailabilityConflict;
  "tables/bookings/helpers/listUserBookings": typeof tables_bookings_helpers_listUserBookings;
  "tables/bookings/helpers/resolveApartmentSummary": typeof tables_bookings_helpers_resolveApartmentSummary;
  "tables/bookings/helpers/resolveReservationBooking": typeof tables_bookings_helpers_resolveReservationBooking;
  "tables/bookings/mutations/cancelBookingAdmin": typeof tables_bookings_mutations_cancelBookingAdmin;
  "tables/bookings/mutations/cancelBookingGuest": typeof tables_bookings_mutations_cancelBookingGuest;
  "tables/bookings/mutations/cancelBookingOwner": typeof tables_bookings_mutations_cancelBookingOwner;
  "tables/bookings/mutations/claimMyBookings": typeof tables_bookings_mutations_claimMyBookings;
  "tables/bookings/mutations/clearPaymentFlag": typeof tables_bookings_mutations_clearPaymentFlag;
  "tables/bookings/mutations/confirmBooking": typeof tables_bookings_mutations_confirmBooking;
  "tables/bookings/mutations/confirmStay": typeof tables_bookings_mutations_confirmStay;
  "tables/bookings/mutations/createBooking": typeof tables_bookings_mutations_createBooking;
  "tables/bookings/mutations/declineBooking": typeof tables_bookings_mutations_declineBooking;
  "tables/bookings/mutations/findMyReservation": typeof tables_bookings_mutations_findMyReservation;
  "tables/bookings/mutations/requestStayConfirmation": typeof tables_bookings_mutations_requestStayConfirmation;
  "tables/bookings/mutations/withdrawBookingGuest": typeof tables_bookings_mutations_withdrawBookingGuest;
  "tables/bookings/queries/fetchBookingById": typeof tables_bookings_queries_fetchBookingById;
  "tables/bookings/queries/fetchBookingByIdSafe": typeof tables_bookings_queries_fetchBookingByIdSafe;
  "tables/bookings/queries/fetchHostBookingsSafe": typeof tables_bookings_queries_fetchHostBookingsSafe;
  "tables/bookings/queries/fetchMyBookingsSafe": typeof tables_bookings_queries_fetchMyBookingsSafe;
  "tables/bookings/queries/listBookingsAdmin": typeof tables_bookings_queries_listBookingsAdmin;
  "tables/bookings/registerBookingCrons": typeof tables_bookings_registerBookingCrons;
  "tables/bookings/schemas/bookingsSchemas": typeof tables_bookings_schemas_bookingsSchemas;
  "tables/bookings/utils/bookingToBookingSafe": typeof tables_bookings_utils_bookingToBookingSafe;
  "tables/favorites/mutations/mergeFavorites": typeof tables_favorites_mutations_mergeFavorites;
  "tables/favorites/mutations/toggleFavorite": typeof tables_favorites_mutations_toggleFavorite;
  "tables/favorites/queries/fetchMyFavoriteIdsSafe": typeof tables_favorites_queries_fetchMyFavoriteIdsSafe;
  "tables/newsletter/mutations/subscribeToNewsletters": typeof tables_newsletter_mutations_subscribeToNewsletters;
  "tables/reports/mutations/createReport": typeof tables_reports_mutations_createReport;
  "tables/reports/mutations/setReportStatus": typeof tables_reports_mutations_setReportStatus;
  "tables/reports/queries/listReportsSafe": typeof tables_reports_queries_listReportsSafe;
  "tables/reports/schemas/reportsSchemas": typeof tables_reports_schemas_reportsSchemas;
  "tables/users/userMutations": typeof tables_users_userMutations;
  "tables/users/userQueries": typeof tables_users_userQueries;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  rateLimiter: import("@convex-dev/rate-limiter/_generated/component.js").ComponentApi<"rateLimiter">;
  betterAuth: import("../auth/component/_generated/component.js").ComponentApi<"betterAuth">;
  r2: import("@convex-dev/r2/_generated/component.js").ComponentApi<"r2">;
  analytics: import("@vllnt/convex-analytics/_generated/component.js").ComponentApi<"analytics">;
  resend: import("@convex-dev/resend/_generated/component.js").ComponentApi<"resend">;
  aggregateReports: import("@convex-dev/aggregate/_generated/component.js").ComponentApi<"aggregateReports">;
  aggregateApartments: import("@convex-dev/aggregate/_generated/component.js").ComponentApi<"aggregateApartments">;
  aggregateHostEarnings: import("@convex-dev/aggregate/_generated/component.js").ComponentApi<"aggregateHostEarnings">;
  aggregateUsers: import("@convex-dev/aggregate/_generated/component.js").ComponentApi<"aggregateUsers">;
  aggregateGmv: import("@convex-dev/aggregate/_generated/component.js").ComponentApi<"aggregateGmv">;
  aggregateGmvCancelled: import("@convex-dev/aggregate/_generated/component.js").ComponentApi<"aggregateGmvCancelled">;
  aggregateNightsBooked: import("@convex-dev/aggregate/_generated/component.js").ComponentApi<"aggregateNightsBooked">;
  aggregateNightsReleased: import("@convex-dev/aggregate/_generated/component.js").ComponentApi<"aggregateNightsReleased">;
};
