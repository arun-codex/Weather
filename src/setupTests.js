import '@testing-library/jest-dom';

// vitest jsdom globals are used; this file ensures jest-dom matchers are available

// Provide a simple localStorage polyfill for the test environment if missing
if (typeof globalThis.localStorage === 'undefined' || !globalThis.localStorage) {
	globalThis.localStorage = (function () {
		let store = {};
		return {
			getItem(key) { return Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null; },
			setItem(key, value) { store[key] = String(value); },
			removeItem(key) { delete store[key]; },
			clear() { store = {}; },
		};
	})();
}

// Ensure document has required basic metadata for accessibility checks
if (typeof document !== 'undefined') {
	if (!document.title) document.title = 'Test - Weather App';
	if (!document.documentElement.lang) document.documentElement.lang = 'en';
}
