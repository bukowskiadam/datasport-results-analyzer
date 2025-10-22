/**
 * Result card component for displaying stored race results
 */

import { formatSize } from "../storage.js";

/**
 * Create HTML for a result card
 * @param {Object} result - Result metadata
 * @returns {string} HTML string
 */
export function createResultCard(result) {
	const date = new Date(result.uploadDate).toLocaleString();
	const hasUrl = result.sourceUrl?.trim();

	return `
		<div class="result-card" data-id="${result.id}">
			<div class="result-card-header">
				<div class="result-name" contenteditable="true" data-id="${result.id}" spellcheck="false">${result.name}</div>
				<button class="delete-btn" data-id="${result.id}" title="Delete">×</button>
			</div>
			<div class="result-meta">
				<div class="result-meta-item">
					<span>📊 ${result.recordCount} records</span>
				</div>
				<div class="result-meta-item">
					<span>💾 ${formatSize(result.size)}</span>
				</div>
				<div class="result-meta-item">
					<span>📅 ${date}</span>
				</div>
				<div class="result-meta-item result-url">
					${
						hasUrl
							? `
						<a href="${result.sourceUrl}" target="_blank" rel="noopener" onclick="event.stopPropagation()" title="Open datasport page">🔗 View online</a>
					`
							: `
						<span class="no-url">No URL</span>
					`
					}
					<button class="edit-url-btn" data-id="${result.id}" title="${hasUrl ? "Edit URL" : "Add URL"}">✏️</button>
				</div>
			</div>
		</div>
	`;
}
