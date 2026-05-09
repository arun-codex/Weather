import '@testing-library/jest-dom';

// vitest jsdom globals are used; this file ensures jest-dom matchers are available

function createLocalStorageMock() {
	let store = {};
	return {
		getItem(key) { return Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null; },
		setItem(key, value) { store[key] = String(value); },
		removeItem(key) { delete store[key]; },
		clear() { store = {}; },
	};
}

// Provide a simple localStorage polyfill for the test environment if missing or partial
if (
	typeof globalThis.localStorage === 'undefined' ||
	!globalThis.localStorage ||
	typeof globalThis.localStorage.clear !== 'function'
) {
	Object.defineProperty(globalThis, 'localStorage', {
		value: createLocalStorageMock(),
		configurable: true,
	});
} else {
	try {
		globalThis.localStorage.clear();
	} catch {
		Object.defineProperty(globalThis, 'localStorage', {
			value: createLocalStorageMock(),
			configurable: true,
		});
	}
}

// Ensure document has required basic metadata for accessibility checks
if (typeof document !== 'undefined') {
	if (!document.title) document.title = 'Test - Weather App';
	if (!document.documentElement.lang) document.documentElement.lang = 'en';
}

if (typeof globalThis.requestAnimationFrame === 'undefined') {
	globalThis.requestAnimationFrame = (callback) => setTimeout(() => callback(Date.now()), 16);
	globalThis.cancelAnimationFrame = (id) => clearTimeout(id);
}

if (typeof window !== 'undefined') {
	window.requestAnimationFrame = globalThis.requestAnimationFrame;
	window.cancelAnimationFrame = globalThis.cancelAnimationFrame;
}

if (typeof HTMLCanvasElement !== 'undefined') {
	HTMLCanvasElement.prototype.getContext = () => null;
}
