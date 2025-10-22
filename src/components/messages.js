/**
 * Message display components for user feedback
 */

/**
 * Show error message to user
 * @param {string} message - Error message to display
 * @param {HTMLElement} errorElement - Error message element
 */
export function showError(message, errorElement) {
	errorElement.textContent = message;
	errorElement.classList.add("visible");
	setTimeout(() => {
		errorElement.classList.remove("visible");
	}, 8000);
}

/**
 * Hide error message
 * @param {HTMLElement} errorElement - Error message element
 */
export function hideError(errorElement) {
	errorElement.classList.remove("visible");
}
