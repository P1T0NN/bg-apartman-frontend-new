const fs = require('fs');
const path = require('path');
const ROOT = 'D:/Stvari/Programiranje/BGApartman/bg-apartman-frontend-new';
const D = (...p) => path.join(ROOT, ...p);
let failures = 0;

function apply(file, fns) {
  const p = D(file);
  let c = fs.readFileSync(p, 'utf8');
  for (const [find, replacement, label] of fns) {
    let next;
    if (find instanceof RegExp) {
      if (!find.test(c)) { console.error('NOT FOUND regex [' + label + '] in ' + file); failures++; continue; }
      next = c.replace(find, replacement);
    } else {
      if (!c.includes(find)) { console.error('NOT FOUND [' + label + '] in ' + file + ': ' + JSON.stringify(find.slice(0, 70))); failures++; continue; }
      next = c.split(find).join(replacement);
    }
    c = next;
  }
  fs.writeFileSync(p, c, 'utf8');
  console.log('OK ' + file);
}

// ============ host-dashboard-header.svelte ============
apply('src/components/pages/(protected)/host/dashboard/host-dashboard-header.svelte', [
  [
    "\timport { currentLocale } from '$lib/paraglide/runtime.js';",
    "\timport { currentLocale } from '$lib/paraglide/runtime.js';\n\timport { m } from '$lib/paraglide/messages.js';",
    'hdHeader import'
  ],
  [
    '>Dashboard</h1>',
    ">{m['hostDashboard.HostDashboardHeader.title']()}</h1>",
    'hdHeader title'
  ],
  [
    /Your accommodations at a glance\. · \{todayLabel\}/,
    "{m['hostDashboard.HostDashboardHeader.subtitle']({ date: todayLabel })}",
    'hdHeader subtitle'
  ]
]);

// ============ reservations-header.svelte ============
apply('src/components/pages/(protected)/host/reservations/reservations-header.svelte', [
  [
    "// Copy is configurable so the guest \"My bookings\" page can reuse the exact layout.",
    "// Copy is configurable so the guest \"My bookings\" page can reuse the exact layout.\n// I18N\nimport { m } from '$lib/paraglide/messages.js';",
    'resHeader import'
  ],
  [
    "title = 'Reservations'",
    "title = m['hostReservations.ReservationsHeader.title']()",
    'resHeader title'
  ],
  [
    "description = 'Review new requests, keep an eye on upcoming stays and manage your guests — all in one place.'",
    "description = m['hostReservations.ReservationsHeader.description']()",
    'resHeader description'
  ]
]);

// ============ reservations-table.svelte ============
apply('src/components/pages/(protected)/host/reservations/reservations-table.svelte', [
  [
    "import { ErrorComponent } from '@/components/ui/error-component/index.js';",
    "// I18N\nimport { m } from '$lib/paraglide/messages.js';\n\n// COMPONENTS\nimport { ErrorComponent } from '@/components/ui/error-component/index.js';",
    'resTable import'
  ],
  [
    'title="Couldn\'t load reservations"',
    "title={m['hostReservations.ReservationsTable.errorTitle']()}",
    'resTable errorTitle'
  ],
  [
    'description="Something went wrong while loading your reservations. Please try again."',
    "description={m['hostReservations.ReservationsTable.errorDescription']()}",
    'resTable errorDescription'
  ]
]);

// ============ host-analytics-period-picker.svelte ============
apply('src/components/pages/(protected)/host/analytics/host-analytics-period-picker.svelte', [
  [
    "import { getLocalTimeZone, parseDate, today } from '@internationalized/date';",
    "// I18N\nimport { m } from '$lib/paraglide/messages.js';\n\n// LIBRARIES\nimport { getLocalTimeZone, parseDate, today } from '@internationalized/date';",
    'periodPicker import'
  ],
  [
    "toast.error(`Select at least ${MIN_CUSTOM_DAYS} days.`);",
    "toast.error(m['hostAnalytics.HostAnalyticsPeriodPicker.minDaysError']({ days: MIN_CUSTOM_DAYS }));",
    'periodPicker minDaysError'
  ],
  [
    ": 'Custom'",
    ": m['hostAnalytics.HostAnalyticsPeriodPicker.custom']()",
    'periodPicker custom fallback'
  ],
  [
    "aria-label=\"Select custom date range\"",
    "aria-label={m['hostAnalytics.HostAnalyticsPeriodPicker.selectCustomRange']()}",
    'periodPicker ariaLabel'
  ],
  [
    /^(\t+)\bCustom\b$/m,
    "$1{m['hostAnalytics.HostAnalyticsPeriodPicker.custom']()}",
    'periodPicker button Custom'
  ]
]);

// ============ hostAnalyticsTableData.ts ============
apply('src/components/pages/(protected)/host/analytics/hostAnalyticsTableData.ts', [
  [
    "// UTILS\nimport { formatCurrency, formatDateShort } from '@/utils/formatters';",
    "// I18N\nimport { m } from '$lib/paraglide/messages.js';\n\n// UTILS\nimport { formatCurrency, formatDateShort } from '@/utils/formatters';",
    'analyticsTableData import'
  ],
  [
    "header: 'Accommodation',",
    "header: m['hostAnalytics.HostAnalyticsTableData.accommodation'](),",
    'analyticsTableData accommodation'
  ],
  [
    "header: 'Occupancy',",
    "header: m['hostAnalytics.HostAnalyticsTableData.occupancy'](),",
    'analyticsTableData occupancy'
  ],
  [
    "header: 'Revenue',",
    "header: m['hostAnalytics.HostAnalyticsTableData.revenue'](),",
    'analyticsTableData revenue'
  ],
  [
    "header: 'Next check-in',",
    "header: m['hostAnalytics.HostAnalyticsTableData.nextCheckIn'](),",
    'analyticsTableData nextCheckIn'
  ]
]);

// ============ host-analytics-header.svelte ============
apply('src/components/pages/(protected)/host/analytics/host-analytics-header.svelte', [
  [
    "import HostAnalyticsPeriodPicker, {",
    "// I18N\nimport { m } from '$lib/paraglide/messages.js';\n\n// COMPONENTS\nimport HostAnalyticsPeriodPicker, {",
    'analyticsHeader import'
  ],
  [
    '>Analytics</h1>',
    ">{m['hostAnalytics.HostAnalyticsHeader.title']()}</h1>",
    'analyticsHeader title'
  ],
  [
    /How your accommodations are performing — trend and per-listing\./,
    "{m['hostAnalytics.HostAnalyticsHeader.description']()}",
    'analyticsHeader description'
  ]
]);

// ============ host-analytics-empty.svelte ============
apply('src/components/pages/(protected)/host/analytics/empty/host-analytics-empty.svelte', [
  [
    "import ChartColumnIcon from '@lucide/svelte/icons/chart-column';",
    "// I18N\nimport { m } from '$lib/paraglide/messages.js';\n\n// LUCIDE ICONS\nimport ChartColumnIcon from '@lucide/svelte/icons/chart-column';",
    'analyticsEmpty import'
  ],
  [
    '>Nothing here for this period</h2>',
    ">{m['hostAnalytics.HostAnalyticsEmpty.emptyTitle']()}</h2>",
    'analyticsEmpty title'
  ],
  [
    /Try a longer range — numbers appear with your first confirmed booking\./,
    "{m['hostAnalytics.HostAnalyticsEmpty.emptyDescription']()}",
    'analyticsEmpty description'
  ]
]);

// ============ host-analytics-per-accommodation-table.svelte ============
apply('src/components/pages/(protected)/host/analytics/host-analytics-per-accommodation-table.svelte', [
  [
    "import { PROTECTED_PAGE_ENDPOINTS } from '@/config/routeEndpoints';",
    "// I18N\nimport { m } from '$lib/paraglide/messages.js';\n\n// CONFIG\nimport { PROTECTED_PAGE_ENDPOINTS } from '@/config/routeEndpoints';",
    'perAccommodation import'
  ],
  [
    '>By accommodation</h2>',
    ">{m['hostAnalytics.HostAnalyticsPerAccommodationTable.byAccommodation']()}</h2>",
    'perAccommodation heading'
  ],
  [
    'caption="By accommodation"',
    "caption={m['hostAnalytics.HostAnalyticsPerAccommodationTable.byAccommodation']()}",
    'perAccommodation caption'
  ]
]);

// ============ host-analytics-revenue-chart.svelte ============
apply('src/components/pages/(protected)/host/analytics/host-analytics-revenue-chart.svelte', [
  [
    "import { currentLocale } from '$lib/paraglide/runtime.js';",
    "// I18N\nimport { m } from '$lib/paraglide/messages.js';\n\n// UTILS\nimport { formatCurrency } from '@/utils/formatters';\nimport { cn } from '@/utils/utils.js';\nimport { currentLocale } from '$lib/paraglide/runtime.js';",
    'revenueChart import'
  ],
  [
    "label: metric === 'revenue' ? 'Revenue' : 'Bookings',",
    "label: metric === 'revenue' ? m['hostAnalytics.HostAnalyticsRevenueChart.revenue']() : m['hostAnalytics.HostAnalyticsRevenueChart.bookings'](),",
    'revenueChart config label'
  ],
  [
    "{ value: 'revenue', label: 'Revenue' },",
    "{ value: 'revenue', label: m['hostAnalytics.HostAnalyticsRevenueChart.revenue']() },",
    'revenueChart metrics revenue'
  ],
  [
    "{ value: 'bookings', label: 'Bookings' }",
    "{ value: 'bookings', label: m['hostAnalytics.HostAnalyticsRevenueChart.bookings']() }",
    'revenueChart metrics bookings'
  ],
  [
    "{metric === 'revenue' ? 'Total revenue' : 'Total bookings'}",
    "{metric === 'revenue' ? m['hostAnalytics.HostAnalyticsRevenueChart.totalRevenue']() : m['hostAnalytics.HostAnalyticsRevenueChart.totalBookings']()}",
    'revenueChart total'
  ],
  [
    'title="Revenue & bookings"',
    "title={m['hostAnalytics.HostAnalyticsRevenueChart.revenueAndBookings']()}",
    'revenueChart title'
  ]
]);

console.log('FAILURES: ' + failures);
