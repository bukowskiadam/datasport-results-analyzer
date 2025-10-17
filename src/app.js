/**
 * Main application controller for the web interface
 */

import { getJsonUrl } from "./datasport-fetcher.js";
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
 * Initialize the application
 */
function init() {
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

	console.log("Datasport Results Analyzer initialized");
}

// Initialize when DOM is ready
if (document.readyState === "loading") {
	document.addEventListener("DOMContentLoaded", init);
} else {
	init();
}
