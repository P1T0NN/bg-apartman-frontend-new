import { tick } from 'svelte';

/**
 * Scroll the first invalid field inside `container` into view and focus it.
 *
 * Universal by design: it keys off the `aria-invalid="true"` that accessible fields
 * already set on a failed submit — so any form gets "jump to the first problem" for
 * free, with no per-field wiring. Call it right after you set validation errors.
 *
 * Awaits a tick first so the just-set errors have flipped `aria-invalid` in the DOM,
 * and respects `prefers-reduced-motion`. Focusing a non-focusable wrapper is a no-op,
 * so the scroll still happens either way.
 */
export async function focusFirstError(container: HTMLElement | null | undefined): Promise<void> {
	if (!container) return;
	await tick();

	const el = container.querySelector<HTMLElement>('[aria-invalid="true"]');
	if (!el) return;

	const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
	el.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
	el.focus({ preventScroll: true });
}
