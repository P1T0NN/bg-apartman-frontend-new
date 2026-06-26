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
import type * as analytics_index from "../analytics/index.js";
import type * as analytics_queries_analyticsQueries from "../analytics/queries/analyticsQueries.js";
import type * as auth_auth from "../auth/auth.js";
import type * as auth_authRoutes from "../auth/authRoutes.js";
import type * as auth_convexCreateAuthRateLimitHook from "../auth/convexCreateAuthRateLimitHook.js";
import type * as auth_emails_sendVerificationOTP from "../auth/emails/sendVerificationOTP.js";
import type * as auth_helpers_getAuthUserId from "../auth/helpers/getAuthUserId.js";
import type * as auth_middleware_authMiddleware from "../auth/middleware/authMiddleware.js";
import type * as auth_queries_authQueries from "../auth/queries/authQueries.js";
import type * as auth_utils_getEmailFromAuthBody from "../auth/utils/getEmailFromAuthBody.js";
import type * as convexRateLimiter from "../convexRateLimiter.js";
import type * as crons from "../crons.js";
import type * as helpers_convexGetRateLimitedUserId from "../helpers/convexGetRateLimitedUserId.js";
import type * as helpers_createDeleteMutation from "../helpers/createDeleteMutation.js";
import type * as helpers_createSearchQuery from "../helpers/createSearchQuery.js";
import type * as helpers_fetchOptimized from "../helpers/fetchOptimized.js";
import type * as helpers_paginationHelpers from "../helpers/paginationHelpers.js";
import type * as http from "../http.js";
import type * as pages_guest_dashboard_config from "../pages/guest/dashboard/config.js";
import type * as pages_guest_dashboard_queries_fetchGuestDashboardPageSafe from "../pages/guest/dashboard/queries/fetchGuestDashboardPageSafe.js";
import type * as pages_guest_dashboard_types_guestDashboardTypes from "../pages/guest/dashboard/types/guestDashboardTypes.js";
import type * as pages_guest_dashboard_utils_bookingToGuestTripSummary from "../pages/guest/dashboard/utils/bookingToGuestTripSummary.js";
import type * as projectSettings from "../projectSettings.js";
import type * as rateLimits_convexCreateRateLimit from "../rateLimits/convexCreateRateLimit.js";
import type * as rateLimits_convexCreateRateLimitInternal from "../rateLimits/convexCreateRateLimitInternal.js";
import type * as rateLimits_registry from "../rateLimits/registry.js";
import type * as rateLimits_searchRateLimitMutations from "../rateLimits/searchRateLimitMutations.js";
import type * as schemas_schemas from "../schemas/schemas.js";
import type * as storage_convexStorage_storageMutations from "../storage/convexStorage/storageMutations.js";
import type * as storage_convexStorage_uploadedFiles from "../storage/convexStorage/uploadedFiles.js";
import type * as storage_crons_cleanupOrphanDataConvexStorage from "../storage/crons/cleanupOrphanDataConvexStorage.js";
import type * as storage_crons_cleanupOrphanDataR2 from "../storage/crons/cleanupOrphanDataR2.js";
import type * as storage_r2_r2 from "../storage/r2/r2.js";
import type * as storage_r2_uploadedFilesR2 from "../storage/r2/uploadedFilesR2.js";
import type * as storage_registerStorageCrons from "../storage/registerStorageCrons.js";
import type * as tables_accommodations_helpers_deleteApartmentImages from "../tables/accommodations/helpers/deleteApartmentImages.js";
import type * as tables_accommodations_mutations_createAccommodation from "../tables/accommodations/mutations/createAccommodation.js";
import type * as tables_accommodations_mutations_deleteAccommodation from "../tables/accommodations/mutations/deleteAccommodation.js";
import type * as tables_accommodations_mutations_updateAccommodation from "../tables/accommodations/mutations/updateAccommodation.js";
import type * as tables_accommodations_queries_fetchAccommodationById from "../tables/accommodations/queries/fetchAccommodationById.js";
import type * as tables_accommodations_queries_fetchAccommodationBySlugForBookSafe from "../tables/accommodations/queries/fetchAccommodationBySlugForBookSafe.js";
import type * as tables_accommodations_queries_fetchAccommodationBySlugSafe from "../tables/accommodations/queries/fetchAccommodationBySlugSafe.js";
import type * as tables_accommodations_queries_fetchFavoriteAccommodationsSafe from "../tables/accommodations/queries/fetchFavoriteAccommodationsSafe.js";
import type * as tables_accommodations_queries_fetchMyAccommodations from "../tables/accommodations/queries/fetchMyAccommodations.js";
import type * as tables_accommodations_queries_fetchSearchAccommodationsSafe from "../tables/accommodations/queries/fetchSearchAccommodationsSafe.js";
import type * as tables_accommodations_schemas_accommodationsSchemas from "../tables/accommodations/schemas/accommodationsSchemas.js";
import type * as tables_accommodations_utils_apartmentToSearchListing from "../tables/accommodations/utils/apartmentToSearchListing.js";
import type * as tables_auditLog_auditLogConfigs from "../tables/auditLog/auditLogConfigs.js";
import type * as tables_auditLog_crons_auditLogCron from "../tables/auditLog/crons/auditLogCron.js";
import type * as tables_auditLog_helpers_auditLogInternal from "../tables/auditLog/helpers/auditLogInternal.js";
import type * as tables_auditLog_helpers_logAudit from "../tables/auditLog/helpers/logAudit.js";
import type * as tables_auditLog_index from "../tables/auditLog/index.js";
import type * as tables_auditLog_queries_auditLogQueries from "../tables/auditLog/queries/auditLogQueries.js";
import type * as tables_auditLog_registerAuditLogCrons from "../tables/auditLog/registerAuditLogCrons.js";
import type * as tables_auditLog_schemas_auditLogSchema from "../tables/auditLog/schemas/auditLogSchema.js";
import type * as tables_auditLog_utils_auditLogUtils from "../tables/auditLog/utils/auditLogUtils.js";
import type * as tables_bookings_helpers_getUpcomingBookingForCurrentUser from "../tables/bookings/helpers/getUpcomingBookingForCurrentUser.js";
import type * as tables_bookings_helpers_resolveApartmentSummary from "../tables/bookings/helpers/resolveApartmentSummary.js";
import type * as tables_bookings_mutations_createBooking from "../tables/bookings/mutations/createBooking.js";
import type * as tables_bookings_queries_getBookingById from "../tables/bookings/queries/getBookingById.js";
import type * as tables_bookings_schemas_bookingsSchemas from "../tables/bookings/schemas/bookingsSchemas.js";
import type * as tables_users_userMutations from "../tables/users/userMutations.js";
import type * as tables_users_userQueries from "../tables/users/userQueries.js";
import type * as types_convexTypes from "../types/convexTypes.js";
import type * as utils_convexValidationUtils from "../utils/convexValidationUtils.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "analytics/analytics": typeof analytics_analytics;
  "analytics/index": typeof analytics_index;
  "analytics/queries/analyticsQueries": typeof analytics_queries_analyticsQueries;
  "auth/auth": typeof auth_auth;
  "auth/authRoutes": typeof auth_authRoutes;
  "auth/convexCreateAuthRateLimitHook": typeof auth_convexCreateAuthRateLimitHook;
  "auth/emails/sendVerificationOTP": typeof auth_emails_sendVerificationOTP;
  "auth/helpers/getAuthUserId": typeof auth_helpers_getAuthUserId;
  "auth/middleware/authMiddleware": typeof auth_middleware_authMiddleware;
  "auth/queries/authQueries": typeof auth_queries_authQueries;
  "auth/utils/getEmailFromAuthBody": typeof auth_utils_getEmailFromAuthBody;
  convexRateLimiter: typeof convexRateLimiter;
  crons: typeof crons;
  "helpers/convexGetRateLimitedUserId": typeof helpers_convexGetRateLimitedUserId;
  "helpers/createDeleteMutation": typeof helpers_createDeleteMutation;
  "helpers/createSearchQuery": typeof helpers_createSearchQuery;
  "helpers/fetchOptimized": typeof helpers_fetchOptimized;
  "helpers/paginationHelpers": typeof helpers_paginationHelpers;
  http: typeof http;
  "pages/guest/dashboard/config": typeof pages_guest_dashboard_config;
  "pages/guest/dashboard/queries/fetchGuestDashboardPageSafe": typeof pages_guest_dashboard_queries_fetchGuestDashboardPageSafe;
  "pages/guest/dashboard/types/guestDashboardTypes": typeof pages_guest_dashboard_types_guestDashboardTypes;
  "pages/guest/dashboard/utils/bookingToGuestTripSummary": typeof pages_guest_dashboard_utils_bookingToGuestTripSummary;
  projectSettings: typeof projectSettings;
  "rateLimits/convexCreateRateLimit": typeof rateLimits_convexCreateRateLimit;
  "rateLimits/convexCreateRateLimitInternal": typeof rateLimits_convexCreateRateLimitInternal;
  "rateLimits/registry": typeof rateLimits_registry;
  "rateLimits/searchRateLimitMutations": typeof rateLimits_searchRateLimitMutations;
  "schemas/schemas": typeof schemas_schemas;
  "storage/convexStorage/storageMutations": typeof storage_convexStorage_storageMutations;
  "storage/convexStorage/uploadedFiles": typeof storage_convexStorage_uploadedFiles;
  "storage/crons/cleanupOrphanDataConvexStorage": typeof storage_crons_cleanupOrphanDataConvexStorage;
  "storage/crons/cleanupOrphanDataR2": typeof storage_crons_cleanupOrphanDataR2;
  "storage/r2/r2": typeof storage_r2_r2;
  "storage/r2/uploadedFilesR2": typeof storage_r2_uploadedFilesR2;
  "storage/registerStorageCrons": typeof storage_registerStorageCrons;
  "tables/accommodations/helpers/deleteApartmentImages": typeof tables_accommodations_helpers_deleteApartmentImages;
  "tables/accommodations/mutations/createAccommodation": typeof tables_accommodations_mutations_createAccommodation;
  "tables/accommodations/mutations/deleteAccommodation": typeof tables_accommodations_mutations_deleteAccommodation;
  "tables/accommodations/mutations/updateAccommodation": typeof tables_accommodations_mutations_updateAccommodation;
  "tables/accommodations/queries/fetchAccommodationById": typeof tables_accommodations_queries_fetchAccommodationById;
  "tables/accommodations/queries/fetchAccommodationBySlugForBookSafe": typeof tables_accommodations_queries_fetchAccommodationBySlugForBookSafe;
  "tables/accommodations/queries/fetchAccommodationBySlugSafe": typeof tables_accommodations_queries_fetchAccommodationBySlugSafe;
  "tables/accommodations/queries/fetchFavoriteAccommodationsSafe": typeof tables_accommodations_queries_fetchFavoriteAccommodationsSafe;
  "tables/accommodations/queries/fetchMyAccommodations": typeof tables_accommodations_queries_fetchMyAccommodations;
  "tables/accommodations/queries/fetchSearchAccommodationsSafe": typeof tables_accommodations_queries_fetchSearchAccommodationsSafe;
  "tables/accommodations/schemas/accommodationsSchemas": typeof tables_accommodations_schemas_accommodationsSchemas;
  "tables/accommodations/utils/apartmentToSearchListing": typeof tables_accommodations_utils_apartmentToSearchListing;
  "tables/auditLog/auditLogConfigs": typeof tables_auditLog_auditLogConfigs;
  "tables/auditLog/crons/auditLogCron": typeof tables_auditLog_crons_auditLogCron;
  "tables/auditLog/helpers/auditLogInternal": typeof tables_auditLog_helpers_auditLogInternal;
  "tables/auditLog/helpers/logAudit": typeof tables_auditLog_helpers_logAudit;
  "tables/auditLog/index": typeof tables_auditLog_index;
  "tables/auditLog/queries/auditLogQueries": typeof tables_auditLog_queries_auditLogQueries;
  "tables/auditLog/registerAuditLogCrons": typeof tables_auditLog_registerAuditLogCrons;
  "tables/auditLog/schemas/auditLogSchema": typeof tables_auditLog_schemas_auditLogSchema;
  "tables/auditLog/utils/auditLogUtils": typeof tables_auditLog_utils_auditLogUtils;
  "tables/bookings/helpers/getUpcomingBookingForCurrentUser": typeof tables_bookings_helpers_getUpcomingBookingForCurrentUser;
  "tables/bookings/helpers/resolveApartmentSummary": typeof tables_bookings_helpers_resolveApartmentSummary;
  "tables/bookings/mutations/createBooking": typeof tables_bookings_mutations_createBooking;
  "tables/bookings/queries/getBookingById": typeof tables_bookings_queries_getBookingById;
  "tables/bookings/schemas/bookingsSchemas": typeof tables_bookings_schemas_bookingsSchemas;
  "tables/users/userMutations": typeof tables_users_userMutations;
  "tables/users/userQueries": typeof tables_users_userQueries;
  "types/convexTypes": typeof types_convexTypes;
  "utils/convexValidationUtils": typeof utils_convexValidationUtils;
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
  analytics: import("@piton-/analytics-convex/_generated/component.js").ComponentApi<"analytics">;
};
