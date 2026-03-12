/**
 * Shared search utilities for select input components
 */

/**
 * Calculates a fuzzy match score between a query and target string.
 * Higher scores indicate better matches.
 *
 * @param query - The search query
 * @param target - The string to match against
 * @returns A score (0 = no match, higher = better match)
 */
export function fuzzyScore(query: string, target: string): number {
	const q = query.toLowerCase();
	const t = target.toLowerCase();

	// Exact match - highest priority
	if (t === q) return 1000;

	// Starts with query - very high priority
	if (t.startsWith(q)) return 500 + (q.length / t.length) * 100;

	// Contains query - high priority
	if (t.includes(q)) return 300 + (q.length / t.length) * 100;

	// Character-by-character fuzzy matching
	let score = 0;
	let targetIndex = 0;
	let consecutiveBonus = 0;
	let lastMatchIndex = -1;

	for (let i = 0; i < q.length; i++) {
		const char = q[i];
		const foundIndex = t.indexOf(char, targetIndex);

		if (foundIndex === -1) return 0; // Character not found

		// Bonus for consecutive characters
		if (foundIndex === lastMatchIndex + 1) {
			consecutiveBonus += 10;
		} else {
			consecutiveBonus = 0;
		}

		// Bonus for matching at word boundaries
		if (
			foundIndex === 0 ||
			t[foundIndex - 1] === ' ' ||
			t[foundIndex - 1] === '_' ||
			t[foundIndex - 1] === '-'
		) {
			score += 20;
		}

		score += 10 + consecutiveBonus;
		lastMatchIndex = foundIndex;
		targetIndex = foundIndex + 1;
	}

	// Penalty for length difference
	score -= (t.length - q.length) * 2;
	return Math.max(score, 1);
}

/**
 * Filters and sorts items using fuzzy search.
 *
 * @param items - Array of items with label and optional description
 * @param query - Search query string
 * @param maxResults - Maximum number of results to return (0 = unlimited)
 * @returns Filtered and sorted array of items
 */
export function fuzzyFilter<T extends { label: string; description?: string }>(
	items: T[],
	query: string,
	maxResults: number = 0
): T[] {
	if (!query) {
		return maxResults > 0 ? items.slice(0, maxResults) : items;
	}

	const scored = items
		.map((item) => ({
			item,
			score: Math.max(
				fuzzyScore(query, item.label),
				item.description ? fuzzyScore(query, item.description) * 0.5 : 0
			)
		}))
		.filter((entry) => entry.score > 0)
		.sort((a, b) => b.score - a.score);

	const results = scored.map((entry) => entry.item);
	return maxResults > 0 ? results.slice(0, maxResults) : results;
}

/**
 * Debounces a function call.
 *
 * @param func - The function to debounce
 * @param wait - Delay in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
	func: T,
	wait: number
): (...args: Parameters<T>) => void {
	let timeout: ReturnType<typeof setTimeout> | null = null;

	return function (...args: Parameters<T>) {
		if (timeout) {
			clearTimeout(timeout);
		}
		timeout = setTimeout(() => {
			func(...args);
		}, wait);
	};
}
