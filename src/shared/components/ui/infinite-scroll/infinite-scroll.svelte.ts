// TYPES
import type { Attachment } from 'svelte/attachments';

type InfiniteScrollOptions = {
	/** Called when the sentinel scrolls into view and a load is allowed. */
	onLoadMore: () => void;
	/** Stop firing once there's nothing left. Defaults to true. */
	hasMore?: boolean;
	/** Skip while a load is in flight. Defaults to false. */
	loading?: boolean;
	/** Prefetch distance before the sentinel is fully visible. Defaults to '200px'. */
	rootMargin?: string;
	/** Scroll container. Defaults to the viewport. */
	root?: Element | null;
};

// NOTE: Canonical infinite-loading recipe. No server `fetchInfinite` needed — a
// `fetchOptimized` cursor query already returns { page, isDone, continueCursor }, and
// `usePaginatedQuery` (@mmailaender/convex-svelte) accumulates the pages reactively.
// Same array feeds the list and the map; this attachment is only the "load more" trigger.
//
//   const list = usePaginatedQuery(api.tables.x.fetchX, () => ({ /* filters */ }), {
//     initialNumItems: 30
//   });
//
//   <GoogleMap markers={list.results} fitBounds={{ once: true }} />
//   {#each list.results as item (item._id)} … {/each}
//   <div {@attach infiniteScroll(() => ({
//     onLoadMore: () => list.loadMore(30),
//     hasMore: list.status === 'CanLoadMore'  // also blocks a double-fire while loading
//   }))}></div>

/**
 * Headless infinite-scroll trigger. Attach to a sentinel element at the bottom of a
 * list; it fires `onLoadMore` when that element enters view. Data-source agnostic —
 * wire `onLoadMore`/`hasMore`/`loading` from Convex, fetch, anything.
 *
 * Pass a getter so `hasMore`/`loading` stay reactive: when they change the attachment
 * re-runs and re-observes, which re-fires if the sentinel is still in view — that
 * handles short pages that never produce a second scroll.
 */
export function infiniteScroll(options: () => InfiniteScrollOptions): Attachment {
	return (node) => {
		const {
			onLoadMore,
			hasMore = true,
			loading = false,
			rootMargin = '200px',
			root = null
		} = options();
		if (!hasMore || loading) return;

		const observer = new IntersectionObserver(([entry]) => entry?.isIntersecting && onLoadMore(), {
			root,
			rootMargin
		});
		observer.observe(node);
		return () => observer.disconnect();
	};
}
