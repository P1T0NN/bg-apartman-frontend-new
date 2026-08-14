<script lang="ts">
	// I18N
	import { m } from '@/lib/paraglide/messages';
</script>

<!-- Chart empty state — one line, no CTA (AdminDashboardPageSystemDesign.md §6). True
     whenever MONETIZATION is 'none' and nothing has been booked: honest zeros, not a bug. -->
<p class="rounded-xl border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
	{m['AdminDashboardPage.AdminDashboardChartEmpty.noBookingsYet']()}
</p>
