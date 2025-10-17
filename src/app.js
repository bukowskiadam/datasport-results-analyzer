/**
 * Main application controller for the web interface
 */

import { getJsonUrl } from "./datasport-fetcher.js";
import {
	clearAllResults,
	deleteResult,
	formatSize,
	getAllResults,
	getResult,
	getStorageInfo,
	initStorage,
	saveResult,
	updateResult,
} from "./storage.js";
import {
	generateHistogramSvg,
	generateNettoTimesSvg,
	generateStartBucketsSvg,
} from "./visualizations.js";

// DOM elements
const urlInput = document.getElementById("datasport-url");
const prepareDownloadBtn = document.getElementById("prepare-download-btn");
const errorMessage = document.getElementById("error-message");
const resultsSection = document.getElementById("results-section");

// Manual mode elements
const manualDownloadSection = document.getElementById(
	"manual-download-section",
);
const openJsonBtn = document.getElementById("open-json-btn");
const uploadSection = document.getElementById("upload-section");
const dropZone = document.getElementById("drop-zone");
const fileInput = document.getElementById("file-input");
const browseBtn = document.getElementById("browse-btn");
const fileInfo = document.getElementById("file-info");

// Stored results elements
const storedResultsList = document.getElementById("stored-results-list");
const storageUsageEl = document.getElementById("storage-usage");
const clearAllBtn = document.getElementById("clear-all-btn");

// Visualization containers
const nettoTimesContainer = document.getElementById("viz-netto-times");
const histogramContainer = document.getElementById("viz-histogram");
const startBucketsContainer = document.getElementById("viz-start-buckets");

// Store generated SVGs for download
const generatedSvgs = {
	"netto-times": "",
	histogram: "",
	"start-buckets": "",
};

// Store current JSON URL for manual download
let currentJsonUrl = null;

/**
 * Show error message to user
 * @param {string} message - Error message to display
 */
function showError(message) {
	errorMessage.textContent = message;
	errorMessage.classList.add("visible");
	setTimeout(() => {
		errorMessage.classList.remove("visible");
	}, 8000);
}

/**
 * Hide error message
 */
function hideError() {
	errorMessage.classList.remove("visible");
}

/**
 * Show results section
 */
function showResults() {
	resultsSection.style.display = "block";
	resultsSection.scrollIntoView({ behavior: "smooth", block: "start" });
}

/**
 * Generate and display all visualizations
 * @param {Array} data - Race results data
 */
function generateVisualizations(data) {
	try {
		// Generate net times visualization
		const nettoTimesSvg = generateNettoTimesSvg(data);
		nettoTimesContainer.innerHTML = nettoTimesSvg;
		generatedSvgs["netto-times"] = nettoTimesSvg;

		// Generate histogram visualization
		const histogramSvg = generateHistogramSvg(data);
		histogramContainer.innerHTML = histogramSvg;
		generatedSvgs["histogram"] = histogramSvg;

		// Generate start buckets visualization
		const startBucketsSvg = generateStartBucketsSvg(data);
		startBucketsContainer.innerHTML = startBucketsSvg;
		generatedSvgs["start-buckets"] = startBucketsSvg;

		showResults();
	} catch (error) {
		throw new Error(`Failed to generate visualizations: ${error.message}`);
	}
}

/**
 * Download SVG as a file
 * @param {string} svgContent - SVG markup
 * @param {string} filename - Desired filename
 */
function downloadSvg(svgContent, filename) {
	const blob = new Blob([svgContent], { type: "image/svg+xml" });
	const url = URL.createObjectURL(blob);
	const link = document.createElement("a");
	link.href = url;
	link.download = filename;
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
	URL.revokeObjectURL(url);
}

/**
 * Handle prepare download button click
 */
function handlePrepareDownload() {
	const url = urlInput.value.trim();

	if (!url) {
		showError("Please enter a datasport.pl URL");
		return;
	}

	hideError();

	try {
		const jsonUrl = getJsonUrl(url);
		currentJsonUrl = jsonUrl;

		manualDownloadSection.style.display = "block";
		uploadSection.style.display = "block";
		openJsonBtn.disabled = false;

		// Scroll to manual section
		manualDownloadSection.scrollIntoView({
			behavior: "smooth",
			block: "start",
		});
	} catch (error) {
		console.error("Failed to construct JSON URL:", error);
		showError(error.message || "Invalid URL format");
	}
}

/**
 * Handle file upload (drag-drop or browse)
 * @param {File} file - Uploaded file
 */
async function handleFileUpload(file) {
	if (!file) return;

	if (!file.name.endsWith(".json")) {
		showError("Please upload a JSON file");
		return;
	}

	try {
		hideError();

		const text = await file.text();
		const data = JSON.parse(text);

		if (!Array.isArray(data)) {
			throw new Error("Invalid JSON format. Expected an array of results.");
		}

		// Show success message
		fileInfo.style.display = "block";
		fileInfo.textContent = `✓ Loaded ${data.length} results from ${file.name}`;

		// Save to storage
		try {
			const sourceUrl = urlInput.value.trim() || null;
			await saveResult(file.name, data, sourceUrl, file.size);
			await loadStoredResults();
		} catch (storageError) {
			console.error("Failed to save to storage:", storageError);
			// Continue anyway - visualization still works
		}

		// Generate visualizations
		generateVisualizations(data);

		console.log(`Successfully analyzed ${data.length} race results from file`);
	} catch (error) {
		console.error("File processing error:", error);
		showError(
			error.message ||
				"Failed to process the uploaded file. Please ensure it's a valid JSON file.",
		);
		fileInfo.style.display = "none";
	}
}

/**
 * Load and display stored results
 */
async function loadStoredResults() {
	try {
		const results = await getAllResults();

		if (results.length === 0) {
			storedResultsList.innerHTML =
				'<p class="empty-message">No stored results yet. Upload a file to get started.</p>';
			clearAllBtn.style.display = "none";
		} else {
			storedResultsList.innerHTML = results
				.sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate))
				.map((result) => createResultCard(result))
				.join("");
			clearAllBtn.style.display = "inline-block";
		}

		// Update storage info
		await updateStorageInfo();
	} catch (error) {
		console.error("Failed to load stored results:", error);
	}
}

/**
 * Create HTML for a result card
 * @param {Object} result - Result metadata
 * @returns {string} HTML string
 */
function createResultCard(result) {
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
					${hasUrl ? `
						<a href="${result.sourceUrl}" target="_blank" rel="noopener" onclick="event.stopPropagation()" title="Open datasport page">🔗 View online</a>
					` : `
						<span class="no-url">No URL</span>
					`}
					<button class="edit-url-btn" data-id="${result.id}" title="${hasUrl ? 'Edit URL' : 'Add URL'}">✏️</button>
				</div>
			</div>
		</div>
	`;
}

/**
 * Update storage usage display
 */
async function updateStorageInfo() {
	try {
		const { usage, quota } = await getStorageInfo();
		if (quota > 0) {
			const usagePercent = ((usage / quota) * 100).toFixed(1);
			storageUsageEl.textContent = `Storage: ${formatSize(usage)} / ${formatSize(quota)} (${usagePercent}%)`;
		}
	} catch (error) {
		console.error("Failed to get storage info:", error);
	}
}

/**
 * Handle clicking on a stored result card
 * @param {number} id - Result ID
 */
async function handleStoredResultClick(id) {
	try {
		hideError();

		const result = await getResult(id);
		if (!result || !result.data) {
			throw new Error("Result not found");
		}

		// Generate visualizations
		generateVisualizations(result.data);

		// Show info
		fileInfo.style.display = "block";
		fileInfo.textContent = `✓ Loaded ${result.recordCount} results from storage: ${result.name}`;

		console.log(`Analyzed stored result: ${result.name}`);
	} catch (error) {
		console.error("Failed to load stored result:", error);
		showError("Failed to load stored result. It may have been deleted.");
	}
}

/**
 * Handle deleting a stored result
 * @param {number} id - Result ID
 */
async function handleDeleteResult(id) {
	if (!confirm("Are you sure you want to delete this result?")) {
		return;
	}

	try {
		await deleteResult(id);
		await loadStoredResults();
		console.log(`Deleted result ID: ${id}`);
	} catch (error) {
		console.error("Failed to delete result:", error);
		showError("Failed to delete result.");
	}
}

/**
 * Handle renaming a stored result
 * @param {number} id - Result ID
 * @param {string} newName - New name
 */
async function handleRenameResult(id, newName) {
	if (!newName || !newName.trim()) {
		await loadStoredResults(); // Reload to reset the name
		return;
	}

	try {
		await updateResult(id, { name: newName.trim() });
		console.log(`Renamed result ID ${id} to: ${newName}`);
	} catch (error) {
		console.error("Failed to rename result:", error);
		showError("Failed to rename result.");
		await loadStoredResults();
	}
}

/**
 * Handle editing URL for a stored result
 * @param {number} id - Result ID
 */
async function handleEditUrl(id) {
	try {
		const result = await getResult(id);
		if (!result) {
			throw new Error("Result not found");
		}

		const newUrl = prompt("Enter the datasport.pl URL:", result.sourceUrl || "");
		
		if (newUrl === null) {
			// User cancelled
			return;
		}

		await updateResult(id, { sourceUrl: newUrl.trim() || null });
		await loadStoredResults();
		console.log(`Updated URL for result ID ${id}`);
	} catch (error) {
		console.error("Failed to update URL:", error);
		showError("Failed to update URL.");
	}
}

/**
 * Handle clearing all stored results
 */
async function handleClearAll() {
	if (
		!confirm(
			"Are you sure you want to delete ALL stored results? This cannot be undone.",
		)
	) {
		return;
	}

	try {
		await clearAllResults();
		await loadStoredResults();
		fileInfo.style.display = "none";
		console.log("Cleared all stored results");
	} catch (error) {
		console.error("Failed to clear all results:", error);
		showError("Failed to clear all results.");
	}
}

/**
 * Initialize the application
 */
async function init() {
	// Prepare download button click handler
	prepareDownloadBtn.addEventListener("click", handlePrepareDownload);

	// Enter key in URL input
	urlInput.addEventListener("keypress", (e) => {
		if (e.key === "Enter") {
			handlePrepareDownload();
		}
	});

	// Download button handlers
	document.querySelectorAll(".download-btn").forEach((btn) => {
		btn.addEventListener("click", (e) => {
			const vizType = e.target.dataset.viz;
			const svgContent = generatedSvgs[vizType];
			if (svgContent) {
				downloadSvg(svgContent, `${vizType}.svg`);
			}
		});
	});

	// Open JSON button
	openJsonBtn.addEventListener("click", () => {
		if (currentJsonUrl) {
			window.open(currentJsonUrl, "_blank");
		}
	});

	// Browse button
	browseBtn.addEventListener("click", (e) => {
		e.stopPropagation(); // Prevent event from bubbling to drop zone
		fileInput.click();
	});

	// File input change
	fileInput.addEventListener("change", (e) => {
		const file = e.target.files?.[0];
		if (file) {
			handleFileUpload(file);
		}
	});

	// Drag and drop handlers
	dropZone.addEventListener("click", () => {
		fileInput.click();
	});

	dropZone.addEventListener("dragover", (e) => {
		e.preventDefault();
		dropZone.classList.add("drag-over");
	});

	dropZone.addEventListener("dragleave", () => {
		dropZone.classList.remove("drag-over");
	});

	dropZone.addEventListener("drop", (e) => {
		e.preventDefault();
		dropZone.classList.remove("drag-over");
		const file = e.dataTransfer?.files?.[0];
		if (file) {
			handleFileUpload(file);
		}
	});

	// Clear all button
	clearAllBtn.addEventListener("click", handleClearAll);

	// Stored results list event delegation
	storedResultsList.addEventListener("click", (e) => {
		const deleteBtn = e.target.closest(".delete-btn");
		const editUrlBtn = e.target.closest(".edit-url-btn");
		const card = e.target.closest(".result-card");

		if (deleteBtn) {
			e.stopPropagation();
			const id = Number.parseInt(deleteBtn.dataset.id, 10);
			handleDeleteResult(id);
		} else if (editUrlBtn) {
			e.stopPropagation();
			const id = Number.parseInt(editUrlBtn.dataset.id, 10);
			handleEditUrl(id);
		} else if (card && !e.target.closest(".result-name")) {
			const id = Number.parseInt(card.dataset.id, 10);
			handleStoredResultClick(id);
		}
	});

	// Handle name editing with blur and enter key
	storedResultsList.addEventListener("blur", async (e) => {
		if (e.target.classList.contains("result-name")) {
			const id = Number.parseInt(e.target.dataset.id, 10);
			const newName = e.target.textContent.trim();
			await handleRenameResult(id, newName);
		}
	}, true);

	storedResultsList.addEventListener("keydown", (e) => {
		if (e.target.classList.contains("result-name") && e.key === "Enter") {
			e.preventDefault();
			e.target.blur();
		}
	});

	// Initialize storage and load stored results
	try {
		await initStorage();
		await loadStoredResults();
	} catch (error) {
		console.error("Failed to initialize storage:", error);
	}

	console.log("Datasport Results Analyzer initialized");
}

// Initialize when DOM is ready
if (document.readyState === "loading") {
	document.addEventListener("DOMContentLoaded", init);
} else {
	init();
}
