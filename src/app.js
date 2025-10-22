/**
 * Main application controller for the web interface
 */

import { extractResultsId, getJsonUrl } from "./datasport-fetcher.js";
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
import { filterFinishers, getUniqueDistances } from "./utils.js";
import {
	generateHistogramSvg,
	generateNettoTimesSvg,
	generateStartBucketsSvg,
	generateStartVsFinishSvg,
} from "./visualizations.js";

// Umami event tracking helper
function trackEvent(eventName, eventData = {}) {
	// Skip tracking on localhost/development
	if (
		window.location.hostname === "localhost" ||
		window.location.hostname === "127.0.0.1"
	) {
		console.log("[Dev] Skipping event:", eventName, eventData);
		return;
	}

	if (window.umami) {
		try {
			window.umami.track(eventName, eventData);
		} catch (error) {
			console.warn("Failed to track event:", eventName, error);
		}
	}
}

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

// Distance filter elements
const filtersSection = document.getElementById("filters-section");
const distanceSelect = document.getElementById("distance-select");
const distanceInfo = document.getElementById("distance-info");
const bucketSizeSelect = document.getElementById("bucket-size-select");
const runnerSelectorsContainer = document.getElementById(
	"runner-selectors-container",
);
const addRunnerBtn = document.getElementById("add-runner-btn");
const filtersHeader = document.getElementById("filters-header");
const filtersHeaderText = document.getElementById("filters-header-text");
const filtersContent = document.getElementById("filters-content");

// Visualization containers
const nettoTimesContainer = document.getElementById("viz-netto-times");
const histogramContainer = document.getElementById("viz-histogram");
const startBucketsContainer = document.getElementById("viz-start-buckets");
const startVsFinishContainer = document.getElementById("viz-start-vs-finish");

// Store generated SVGs for download
const generatedSvgs = {
	"netto-times": "",
	histogram: "",
	"start-buckets": "",
	"start-vs-finish": "",
};

// Store current JSON URL for manual download
let currentJsonUrl = null;

// Store full dataset and current filter state
let fullDataset = null;
let availableDistances = [];
let currentResultId = null;

// Memory key for localStorage
const MEMORY_KEY = "datasport-analyzer-session";

/**
 * Save current session state to localStorage and result-specific state to IndexedDB
 */
function saveSessionState() {
	if (!currentResultId) return;

	try {
		const filterState = {
			distance: distanceSelect.value,
			bucketSize: bucketSizeSelect.value,
			runners: getSelectedRunners(),
		};

		// Save to localStorage for page refresh
		const sessionState = {
			resultId: currentResultId,
			...filterState,
			timestamp: Date.now(),
		};
		localStorage.setItem(MEMORY_KEY, JSON.stringify(sessionState));

		// Save filter state to the result in IndexedDB
		updateResult(currentResultId, { filterState }).catch((error) => {
			console.error("Failed to save filter state to result:", error);
		});
	} catch (error) {
		console.error("Failed to save session state:", error);
	}
}

/**
 * Load session state from localStorage
 * @returns {Object|null} Saved session state or null
 */
function loadSessionState() {
	try {
		const stateJson = localStorage.getItem(MEMORY_KEY);
		if (!stateJson) return null;

		const state = JSON.parse(stateJson);
		return state;
	} catch (error) {
		console.error("Failed to load session state:", error);
		return null;
	}
}

/**
 * Clear session state from localStorage
 */
function clearSessionState() {
	try {
		localStorage.removeItem(MEMORY_KEY);
	} catch (error) {
		console.error("Failed to clear session state:", error);
	}
}

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
	const dataInfo = document.getElementById("data-info");
	dataInfo.scrollIntoView({ behavior: "smooth", block: "start" });
}

// Store runners list globally for reuse
let availableRunners = [];

/**
 * Get currently selected runners from all inputs
 * @returns {Array<string>} Array of selected runner indices
 */
function getSelectedRunners() {
	const inputs = runnerSelectorsContainer.querySelectorAll(".runner-selector-input");
	return Array.from(inputs)
		.map((input) => input.dataset.selectedIndex)
		.filter((value) => value !== "");
}

/**
 * Create a single runner selector with remove button
 * @param {string} [selectedValue] - Optional pre-selected runner index
 * @returns {HTMLElement} The selector row element
 */
function createRunnerSelector(selectedValue = "") {
	const row = document.createElement("div");
	row.className = "runner-selector-row";

	// Create container for input and dropdown
	const inputContainer = document.createElement("div");
	inputContainer.className = "runner-selector-container";

	// Create searchable input
	const input = document.createElement("input");
	input.type = "text";
	input.className = "runner-selector-input";
	input.placeholder = "Search for a runner...";
	input.setAttribute("aria-label", "Runner selection");
	input.setAttribute("autocomplete", "off");
	input.dataset.selectedIndex = selectedValue || "";

	// Set initial value if preselected
	if (selectedValue) {
		const preselectedRunner = availableRunners.find(
			r => r.index.toString() === selectedValue
		);
		if (preselectedRunner) {
			input.value = preselectedRunner.displayName;
		}
	}

	// Create dropdown for autocomplete results
	const dropdown = document.createElement("div");
	dropdown.className = "runner-selector-dropdown";
	dropdown.style.display = "none";

	// Track focused item index
	let focusedItemIndex = -1;

	// Filter and display runners based on input
	const updateDropdown = () => {
		const searchTerm = input.value.toLowerCase().trim();
		
		if (searchTerm.length === 0) {
			dropdown.style.display = "none";
			return;
		}

		// Filter runners matching search term
		const matches = availableRunners.filter(runner => 
			runner.displayName.toLowerCase().includes(searchTerm) ||
			runner.name.toLowerCase().includes(searchTerm) ||
			runner.bib.includes(searchTerm)
		).slice(0, 50); // Limit to 50 results for performance

		if (matches.length === 0) {
			dropdown.innerHTML = '<div class="runner-selector-item no-results">No runners found</div>';
			positionDropdown();
			dropdown.style.display = "block";
			return;
		}

		dropdown.innerHTML = matches.map((runner, index) => 
			`<div class="runner-selector-item" data-index="${runner.index}" data-item-index="${index}">${runner.displayName}</div>`
		).join("");
		positionDropdown();
		dropdown.style.display = "block";
		focusedItemIndex = -1;

		// Add click listeners to items
		const items = dropdown.querySelectorAll(".runner-selector-item:not(.no-results)");
		items.forEach(item => {
			item.addEventListener("click", () => {
				const runnerIndex = item.dataset.index;
				const runner = availableRunners.find(r => r.index.toString() === runnerIndex);
				if (runner) {
					input.value = runner.displayName;
					input.dataset.selectedIndex = runnerIndex;
					dropdown.style.display = "none";
					trackEvent("filter-runner-selected");
					regenerateVisualizations();
				}
			});
		});
	};

	// Position dropdown using fixed positioning to avoid overflow issues
	const positionDropdown = () => {
		const rect = input.getBoundingClientRect();
		dropdown.style.position = "fixed";
		dropdown.style.left = `${rect.left}px`;
		dropdown.style.top = `${rect.bottom + 4}px`;
		dropdown.style.width = `${rect.width}px`;
	};

	// Input event listener
	input.addEventListener("input", () => {
		// Clear selection when user types
		if (input.dataset.selectedIndex) {
			input.dataset.selectedIndex = "";
		}
		updateDropdown();
	});

	// Focus event listener
	input.addEventListener("focus", () => {
		if (input.value.length > 0) {
			positionDropdown();
			updateDropdown();
		}
	});

	// Update dropdown position on scroll
	let scrollListener = null;
	input.addEventListener("focusin", () => {
		if (!scrollListener) {
			scrollListener = () => {
				if (dropdown.style.display === "block") {
					positionDropdown();
				}
			};
			window.addEventListener("scroll", scrollListener, true);
			window.addEventListener("resize", scrollListener);
		}
	});

	input.addEventListener("focusout", () => {
		if (scrollListener) {
			window.removeEventListener("scroll", scrollListener, true);
			window.removeEventListener("resize", scrollListener);
			scrollListener = null;
		}
	});

	// Blur event listener (with delay to allow clicking dropdown items)
	input.addEventListener("blur", () => {
		setTimeout(() => {
			dropdown.style.display = "none";
		}, 200);
	});

	// Keyboard navigation
	input.addEventListener("keydown", (e) => {
		const items = dropdown.querySelectorAll(".runner-selector-item:not(.no-results)");
		
		if (e.key === "ArrowDown") {
			e.preventDefault();
			if (items.length > 0) {
				focusedItemIndex = Math.min(focusedItemIndex + 1, items.length - 1);
				items.forEach((item, idx) => {
					item.classList.toggle("focused", idx === focusedItemIndex);
				});
				items[focusedItemIndex]?.scrollIntoView({ block: "nearest" });
			}
		} else if (e.key === "ArrowUp") {
			e.preventDefault();
			if (items.length > 0) {
				focusedItemIndex = Math.max(focusedItemIndex - 1, 0);
				items.forEach((item, idx) => {
					item.classList.toggle("focused", idx === focusedItemIndex);
				});
				items[focusedItemIndex]?.scrollIntoView({ block: "nearest" });
			}
		} else if (e.key === "Enter") {
			e.preventDefault();
			if (focusedItemIndex >= 0 && items[focusedItemIndex]) {
				items[focusedItemIndex].click();
			}
		} else if (e.key === "Escape") {
			dropdown.style.display = "none";
		}
	});


	inputContainer.appendChild(input);
	inputContainer.appendChild(dropdown);

	const removeBtn = document.createElement("button");
	removeBtn.type = "button";
	removeBtn.className = "remove-runner-btn";
	removeBtn.title = "Remove this runner";
	removeBtn.innerHTML = `
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
			<line x1="18" y1="6" x2="6" y2="18"></line>
			<line x1="6" y1="6" x2="18" y2="18"></line>
		</svg>
	`;

	removeBtn.addEventListener("click", () => {
		trackEvent("filter-runner-removed");
		row.remove();
		regenerateVisualizations();
		updateAddButtonVisibility();
	});
	
	row.appendChild(inputContainer);
	row.appendChild(removeBtn);
	return row;
}

/**
 * Update visibility of add button based on number of selectors
 */
function updateAddButtonVisibility() {
	const count = runnerSelectorsContainer.querySelectorAll(
		".runner-selector-row",
	).length;
	// Limit to 10 runners for performance
	addRunnerBtn.style.display = count >= 10 ? "none" : "flex";
}

/**
 * Setup runner selector system
 * @param {Array} data - Full race results data
 * @param {Array} [preselectedRunners] - Optional array of runner indices to preselect
 */
function setupRunnerSelector(data, preselectedRunners = null) {
	// Create list of runners with their names, bib numbers, and age categories
	availableRunners = data
		.map((entry, index) => {
			const name = `${entry.nazwisko || ""} ${entry.imie || ""}`.trim();
			const bib = entry.numer || "";
			const category = entry.katw || "";

			// Build display name: Name (Category) #Bib or Name (Category) or Name #Bib or Name
			let displayName = name;
			if (category && bib) {
				displayName = `${name} (${category}) #${bib}`;
			} else if (category) {
				displayName = `${name} (${category})`;
			} else if (bib) {
				displayName = `${name} #${bib}`;
			}

			return {
				index,
				name,
				bib,
				category,
				displayName,
				entry,
			};
		})
		.filter((r) => r.name)
		.sort((a, b) => a.name.localeCompare(b.name));

	// Clear existing selectors
	runnerSelectorsContainer.innerHTML = "";

	// Add preselected runners or one empty selector
	if (
		preselectedRunners &&
		Array.isArray(preselectedRunners) &&
		preselectedRunners.length > 0
	) {
		for (const runnerIndex of preselectedRunners) {
			if (availableRunners.some((r) => r.index.toString() === runnerIndex)) {
				runnerSelectorsContainer.appendChild(createRunnerSelector(runnerIndex));
			}
		}
	} else {
		// Add one empty selector by default
		runnerSelectorsContainer.appendChild(createRunnerSelector());
	}

	updateAddButtonVisibility();
}

/**
 * Setup distance filter UI
 * @param {Array} data - Full race results data
 * @param {string} [preselectedDistance] - Optional distance to preselect
 */
function setupDistanceFilter(data, preselectedDistance = null) {
	fullDataset = data;
	availableDistances = getUniqueDistances(data);

	// Always show the filter section
	filtersSection.style.display = "flex";

	// Populate select options
	distanceSelect.innerHTML = '<option value="">All Distances</option>';
	for (const distance of availableDistances) {
		const option = document.createElement("option");
		option.value = distance.value;
		option.textContent = distance.label;
		distanceSelect.appendChild(option);
	}

	// If only one distance, preselect it and disable the dropdown
	if (availableDistances.length === 1) {
		distanceSelect.value = availableDistances[0].value;
		distanceSelect.disabled = true;
	} else if (
		preselectedDistance &&
		availableDistances.some((d) => d.value === preselectedDistance)
	) {
		// Restore preselected distance if valid
		distanceSelect.value = preselectedDistance;
		distanceSelect.disabled = false;
	} else {
		distanceSelect.value = "";
		distanceSelect.disabled = false;
	}

	updateDistanceInfo(data);
}

/**
 * Update distance info display
 * @param {Array} data - Current filtered data
 */
function updateDistanceInfo(data) {
	const selectedDistance = distanceSelect.value;
	if (selectedDistance) {
		distanceInfo.textContent = `Showing ${data.length} results`;
	} else {
		if (availableDistances.length > 1) {
			distanceInfo.textContent = `${data.length} total results across ${availableDistances.length} distances`;
		} else if (availableDistances.length === 1) {
			distanceInfo.textContent = `${data.length} results`;
		} else {
			distanceInfo.textContent = "";
		}
	}
}

/**
 * Filter data by selected distance
 * @returns {Array} Filtered race results data
 */
function getFilteredData() {
	if (!fullDataset) {
		return [];
	}

	const selectedDistance = distanceSelect.value;
	if (!selectedDistance) {
		return fullDataset;
	}

	return fullDataset.filter((result) => result.odleglosc === selectedDistance);
}

/**
 * Generate and display all visualizations
 * @param {Array} data - Race results data
 * @param {Object} [savedState] - Optional saved state to restore filters
 */
function generateVisualizations(data, savedState = null) {
	try {
		// Restore bucket size if provided
		if (savedState?.bucketSize) {
			bucketSizeSelect.value = savedState.bucketSize;
		}

		// Setup distance filter with full dataset
		setupDistanceFilter(data, savedState?.distance);

		// Setup runner selector
		setupRunnerSelector(data, savedState?.runners);

		// Get filtered data
		const filteredData = getFilteredData();
		const bucketSize = Number.parseInt(bucketSizeSelect.value, 10);
		const selectedRunners = getSelectedRunners()
			.map((indexStr) => Number.parseInt(indexStr, 10))
			.map((index) => data[index])
			.filter(Boolean);

		// Generate net times visualization
		const nettoTimesSvg = generateNettoTimesSvg(filteredData, selectedRunners);
		nettoTimesContainer.innerHTML = nettoTimesSvg;
		generatedSvgs["netto-times"] = nettoTimesSvg;

		// Generate histogram visualization
		const histogramSvg = generateHistogramSvg(
			filteredData,
			bucketSize,
			selectedRunners,
		);
		histogramContainer.innerHTML = histogramSvg;
		generatedSvgs["histogram"] = histogramSvg;

		// Generate start buckets visualization
		const startBucketsSvg = generateStartBucketsSvg(
			filteredData,
			bucketSize,
			selectedRunners,
		);
		startBucketsContainer.innerHTML = startBucketsSvg;
		generatedSvgs["start-buckets"] = startBucketsSvg;

		// Generate start vs finish visualization
		const startVsFinishSvg = generateStartVsFinishSvg(
			filteredData,
			selectedRunners,
		);
		startVsFinishContainer.innerHTML = startVsFinishSvg;
		generatedSvgs["start-vs-finish"] = startVsFinishSvg;

		showResults();

		// Save session state after successful visualization
		saveSessionState();
	} catch (error) {
		throw new Error(`Failed to generate visualizations: ${error.message}`);
	}
}

/**
 * Regenerate visualizations with current filter
 */
function regenerateVisualizations() {
	if (!fullDataset) {
		return;
	}

	const filteredData = getFilteredData();
	const bucketSize = Number.parseInt(bucketSizeSelect.value, 10);
	const selectedRunners = getSelectedRunners()
		.map((indexStr) => Number.parseInt(indexStr, 10))
		.map((index) => fullDataset[index])
		.filter(Boolean);
	updateDistanceInfo(filteredData);

	try {
		// Regenerate all visualizations with filtered data
		const nettoTimesSvg = generateNettoTimesSvg(filteredData, selectedRunners);
		nettoTimesContainer.innerHTML = nettoTimesSvg;
		generatedSvgs["netto-times"] = nettoTimesSvg;

		const histogramSvg = generateHistogramSvg(
			filteredData,
			bucketSize,
			selectedRunners,
		);
		histogramContainer.innerHTML = histogramSvg;
		generatedSvgs["histogram"] = histogramSvg;

		const startBucketsSvg = generateStartBucketsSvg(
			filteredData,
			bucketSize,
			selectedRunners,
		);
		startBucketsContainer.innerHTML = startBucketsSvg;
		generatedSvgs["start-buckets"] = startBucketsSvg;

		const startVsFinishSvg = generateStartVsFinishSvg(
			filteredData,
			selectedRunners,
		);
		startVsFinishContainer.innerHTML = startVsFinishSvg;
		generatedSvgs["start-vs-finish"] = startVsFinishSvg;

		// Save session state after regenerating
		saveSessionState();
	} catch (error) {
		console.error("Failed to regenerate visualizations:", error);
		showError(`Failed to regenerate visualizations: ${error.message}`);
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
 * Convert SVG to PNG blob
 * @param {string} svgString - SVG markup
 * @param {number} width - Desired width
 * @param {number} height - Desired height
 * @returns {Promise<Blob>} PNG blob
 */
async function svgToPng(svgString, width, height) {
	return new Promise((resolve, reject) => {
		const canvas = document.createElement('canvas');
		canvas.width = width * 2; // 2x for better quality
		canvas.height = height * 2;
		const ctx = canvas.getContext('2d');
		
		const img = new Image();
		const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
		const url = URL.createObjectURL(blob);
		
		img.onload = () => {
			ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
			URL.revokeObjectURL(url);
			
			canvas.toBlob((pngBlob) => {
				if (pngBlob) {
					resolve(pngBlob);
				} else {
					reject(new Error('Failed to convert to PNG'));
				}
			}, 'image/png');
		};
		
		img.onerror = () => {
			URL.revokeObjectURL(url);
			reject(new Error('Failed to load SVG'));
		};
		
		img.src = url;
	});
}

/**
 * Handle sharing a visualization
 * @param {string} vizType - Type of visualization (key for generatedSvgs)
 * @param {string} svgContent - SVG content
 */
function handleShareVisualization(vizType, svgContent) {
	try {
		const raceName = filtersHeaderText.textContent || "Race Results";
		
		// Visualization name mapping
		const vizNames = {
			'netto-times': 'Net Finish Times',
			'histogram': 'Finish Times Histogram',
			'start-buckets': 'Start Time Buckets Histogram',
			'start-vs-finish': 'Start vs Finish Time Analysis'
		};
		
		const vizName = vizNames[vizType] || vizType;
		showShareModal(svgContent, vizName, raceName, vizType);
		trackEvent('visualization-share-clicked', { visualization: vizType });
	} catch (error) {
		console.error("Failed to share visualization:", error);
		showError(`Failed to share visualization: ${error.message}`);
	}
}

/**
 * Show share modal with options
 * @param {string} svgContent - Generated SVG content
 * @param {string} vizName - Visualization name
 * @param {string} raceName - Race name
 * @param {string} vizType - Visualization type key
 */
function showShareModal(svgContent, vizName, raceName, vizType) {
	// Create modal overlay
	const modal = document.createElement("div");
	modal.className = "share-modal-overlay";
	modal.innerHTML = `
		<div class="share-modal">
			<div class="share-modal-header">
				<h3>Share ${vizName}</h3>
				<button class="share-modal-close" title="Close">&times;</button>
			</div>
			<div class="share-modal-content">
				<div class="share-preview">
					${svgContent}
				</div>
				<div class="share-actions">
					<button class="share-action-btn native-share-btn" data-action="native-share">
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
							<circle cx="18" cy="5" r="3"></circle>
							<circle cx="6" cy="12" r="3"></circle>
							<circle cx="18" cy="19" r="3"></circle>
							<line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
							<line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
						</svg>
						Share via...
					</button>
					<button class="share-action-btn twitter-btn" data-action="twitter">
						<svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
							<path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path>
						</svg>
						Share on X
					</button>
					<button class="share-action-btn facebook-btn" data-action="facebook">
						<svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
							<path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"></path>
						</svg>
						Share on Facebook
					</button>
				</div>
				<div class="share-info">
					<p><strong>Tip:</strong> Use "Share via..." to post directly to social media apps (mobile), or share to X/Facebook (all devices).</p>
				</div>
				<div class="share-support">
					<p>☕ Enjoying this tool? <a href="https://tipped.pl/bukowski" target="_blank" rel="noopener">Buy me a coffee</a> to support development!</p>
				</div>
			</div>
		</div>
	`;

	document.body.appendChild(modal);
	
	// Generate share text
	const appUrl = "https://bukowskiadam.github.io/datasport-results-analyzer/";
	const shareText = `Check out this ${vizName} from ${raceName}! Analyzed with datasport-results-analyzer`;
	
	// Add event listeners
	const closeBtn = modal.querySelector(".share-modal-close");
	closeBtn.addEventListener("click", () => {
		document.body.removeChild(modal);
	});

	// Close on overlay click
	modal.addEventListener("click", (e) => {
		if (e.target === modal) {
			document.body.removeChild(modal);
		}
	});

	// Action buttons
	const nativeShareBtn = modal.querySelector('[data-action="native-share"]');
	nativeShareBtn.addEventListener("click", async () => {
		try {
			const filename = `${raceName.replace(/\s+/g, "-")}-${vizType}.png`;
			const pngBlob = await svgToPng(svgContent, 1200, 600);
			
			// Check if Web Share API is available
			if (navigator.share && navigator.canShare) {
				const file = new File([pngBlob], filename, { type: 'image/png' });
				const shareData = {
					files: [file],
					title: vizName,
					text: shareText
				};
				
				if (navigator.canShare(shareData)) {
					await navigator.share(shareData);
					trackEvent('visualization-shared-native', { visualization: vizType });
				} else {
					// Fallback: download the image
					const url = URL.createObjectURL(pngBlob);
					const link = document.createElement('a');
					link.href = url;
					link.download = filename;
					document.body.appendChild(link);
					link.click();
					document.body.removeChild(link);
					URL.revokeObjectURL(url);
					showError('Native sharing not available. Image downloaded instead.');
				}
			} else {
				// Fallback: download the image
				const url = URL.createObjectURL(pngBlob);
				const link = document.createElement('a');
				link.href = url;
				link.download = filename;
				document.body.appendChild(link);
				link.click();
				document.body.removeChild(link);
				URL.revokeObjectURL(url);
				showError('Native sharing not supported on this browser. Image downloaded instead.');
			}
		} catch (error) {
			if (error.name === 'AbortError') {
				// User cancelled the share
				console.log('Share cancelled by user');
			} else {
				console.error('Failed to share:', error);
				showError('Failed to share. Please try downloading PNG instead.');
			}
		}
	});

	const twitterBtn = modal.querySelector('[data-action="twitter"]');
	twitterBtn.addEventListener("click", () => {
		const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(appUrl)}`;
		window.open(twitterUrl, "_blank", "width=550,height=420");
		trackEvent("visualization-shared-twitter", { visualization: vizType });
	});

	const facebookBtn = modal.querySelector('[data-action="facebook"]');
	facebookBtn.addEventListener("click", () => {
		const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(appUrl)}&quote=${encodeURIComponent(shareText)}`;
		window.open(facebookUrl, "_blank", "width=550,height=420");
		trackEvent("visualization-shared-facebook", { visualization: vizType });
	});
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

		// Track URL preparation event
		const resultsId = extractResultsId(url);
		if (resultsId) {
			trackEvent("url-prepared", { event: resultsId });
		}

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

		// Filter to only include finishers (those with czasnetto)
		const finishers = filterFinishers(data);
		const dnfCount = data.length - finishers.length;

		// Track file upload event
		trackEvent("data-loaded-upload");

		// Show success message in distance filter section
		const dataInfo = document.getElementById("data-info");
		dataInfo.style.display = "block";
		if (dnfCount > 0) {
			dataInfo.textContent = `✓ Loaded ${finishers.length} finishers from ${file.name} (${dnfCount} DNF/DNS excluded)`;
		} else {
			dataInfo.textContent = `✓ Loaded ${finishers.length} results from ${file.name}`;
		}

		// Update filters header with filename
		filtersHeaderText.textContent = file.name;

		// Save to storage (save original data)
		try {
			const sourceUrl = urlInput.value.trim() || null;
			const resultId = await saveResult(file.name, data, sourceUrl, file.size);
			currentResultId = resultId;
			await loadStoredResults();
		} catch (storageError) {
			console.error("Failed to save to storage:", storageError);
			// Continue anyway - visualization still works
		}

		// Generate visualizations with finishers only
		generateVisualizations(finishers);

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
 * @param {Object} [savedState] - Optional saved state to restore filters
 */
async function handleStoredResultClick(id, savedState = null) {
	try {
		hideError();

		const result = await getResult(id);
		if (!result || !result.data) {
			throw new Error("Result not found");
		}

		// Update current result ID
		currentResultId = id;

		// Filter to only include finishers
		const finishers = filterFinishers(result.data);
		const dnfCount = result.data.length - finishers.length;

		// Prioritize result's saved filter state, then savedState parameter (from page refresh)
		const stateToRestore = result.filterState || savedState;

		// Generate visualizations with saved state if available
		generateVisualizations(finishers, stateToRestore);

		// Track stored result loading event
		trackEvent("data-loaded-storage");

		// Show success message in distance filter section
		const dataInfo = document.getElementById("data-info");
		dataInfo.style.display = "block";
		if (dnfCount > 0) {
			dataInfo.textContent = `✓ Loaded ${finishers.length} finishers from storage: ${result.name} (${dnfCount} DNF/DNS excluded)`;
		} else {
			dataInfo.textContent = `✓ Loaded ${finishers.length} results from storage: ${result.name}`;
		}

		// Update filters header with result name
		filtersHeaderText.textContent = result.name;

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

		// Clear session state if we deleted the current result
		if (currentResultId === id) {
			currentResultId = null;
			clearSessionState();
		}

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

		const newUrl = prompt(
			"Enter the datasport.pl URL:",
			result.sourceUrl || "",
		);

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

		// Clear session state since all results are gone
		currentResultId = null;
		clearSessionState();

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

	// Download PNG button handlers
	document.querySelectorAll(".download-png-btn").forEach((btn) => {
		btn.addEventListener("click", async (e) => {
			const vizType = e.target.dataset.viz;
			const svgContent = generatedSvgs[vizType];
			if (svgContent) {
				try {
					const raceName = filtersHeaderText.textContent || "race-results";
					const filename = `${raceName.replace(/\s+/g, "-")}-${vizType}.png`;
					const pngBlob = await svgToPng(svgContent, 1200, 600);
					const url = URL.createObjectURL(pngBlob);
					const link = document.createElement('a');
					link.href = url;
					link.download = filename;
					document.body.appendChild(link);
					link.click();
					document.body.removeChild(link);
					URL.revokeObjectURL(url);
					trackEvent('visualization-downloaded-png', { visualization: vizType });
				} catch (error) {
					console.error('Failed to download PNG:', error);
					showError('Failed to download PNG. Please try downloading SVG instead.');
				}
			}
		});
	});

	// Share button handlers
	document.querySelectorAll(".share-btn").forEach((btn) => {
		btn.addEventListener("click", (e) => {
			const vizType = e.target.dataset.viz;
			const svgContent = generatedSvgs[vizType];
			if (svgContent) {
				handleShareVisualization(vizType, svgContent);
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

	// Distance filter change
	distanceSelect.addEventListener("change", () => {
		const selectedDistance = distanceSelect.value;
		trackEvent("filter-distance-changed", {
			distance: selectedDistance === "" ? "all" : selectedDistance,
		});
		regenerateVisualizations();
	});

	// Bucket size filter change
	bucketSizeSelect.addEventListener("change", () => {
		const bucketSize = bucketSizeSelect.value;
		trackEvent("filter-bucket-size-changed", {
			value: bucketSize,
		});
		regenerateVisualizations();
	});

	// Add runner button click
	addRunnerBtn.addEventListener("click", () => {
		trackEvent("filter-runner-input-added");
		runnerSelectorsContainer.appendChild(createRunnerSelector());
		updateAddButtonVisibility();
	});

	// Filters toggle header
	filtersHeader.addEventListener("click", () => {
		const isExpanded = filtersHeader.getAttribute("aria-expanded") === "true";
		filtersHeader.setAttribute("aria-expanded", !isExpanded);
		filtersContent.classList.toggle("collapsed");
	});

	filtersHeader.addEventListener("keydown", (e) => {
		if (e.key === "Enter" || e.key === " ") {
			e.preventDefault();
			filtersHeader.click();
		}
	});

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
	storedResultsList.addEventListener(
		"blur",
		async (e) => {
			if (e.target.classList.contains("result-name")) {
				const id = Number.parseInt(e.target.dataset.id, 10);
				const newName = e.target.textContent.trim();
				await handleRenameResult(id, newName);
			}
		},
		true,
	);

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

		// Try to restore last session
		const savedState = loadSessionState();
		if (savedState?.resultId) {
			console.log("Restoring last session:", savedState);
			try {
				await handleStoredResultClick(savedState.resultId, savedState);
			} catch (error) {
				console.error("Failed to restore last session:", error);
				// Clear invalid session state
				clearSessionState();
			}
		}
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
