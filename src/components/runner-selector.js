/**
 * Runner selector component with searchable autocomplete
 */

/**
 * Create a single runner selector with remove button
 * @param {Array} availableRunners - List of all runners with metadata
 * @param {Function} onChangeCallback - Callback when selection changes
 * @param {Function} trackEvent - Analytics tracking function
 * @param {string} [selectedValue] - Optional pre-selected runner index
 * @returns {HTMLElement} The selector row element
 */
export function createRunnerSelector(
	availableRunners,
	onChangeCallback,
	trackEvent,
	selectedValue = "",
) {
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
			(r) => r.index.toString() === selectedValue,
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

	// Position dropdown using fixed positioning to avoid overflow issues
	const positionDropdown = () => {
		const rect = input.getBoundingClientRect();
		dropdown.style.position = "fixed";
		dropdown.style.left = `${rect.left}px`;
		dropdown.style.top = `${rect.bottom + 4}px`;
		dropdown.style.width = `${rect.width}px`;
	};

	// Filter and display runners based on input
	const updateDropdown = () => {
		const searchTerm = input.value.toLowerCase().trim();

		if (searchTerm.length === 0) {
			dropdown.style.display = "none";
			return;
		}

		// Filter runners matching search term
		const matches = availableRunners
			.filter(
				(runner) =>
					runner.displayName.toLowerCase().includes(searchTerm) ||
					runner.name.toLowerCase().includes(searchTerm) ||
					runner.bib.includes(searchTerm),
			)
			.slice(0, 50); // Limit to 50 results for performance

		if (matches.length === 0) {
			dropdown.innerHTML =
				'<div class="runner-selector-item no-results">No runners found</div>';
			positionDropdown();
			dropdown.style.display = "block";
			return;
		}

		dropdown.innerHTML = matches
			.map(
				(runner, index) =>
					`<div class="runner-selector-item" data-index="${runner.index}" data-item-index="${index}">${runner.displayName}</div>`,
			)
			.join("");
		positionDropdown();
		dropdown.style.display = "block";
		focusedItemIndex = -1;

		// Add click listeners to items
		const items = dropdown.querySelectorAll(
			".runner-selector-item:not(.no-results)",
		);
		items.forEach((item) => {
			item.addEventListener("click", () => {
				const runnerIndex = item.dataset.index;
				const runner = availableRunners.find(
					(r) => r.index.toString() === runnerIndex,
				);
				if (runner) {
					input.value = runner.displayName;
					input.dataset.selectedIndex = runnerIndex;
					dropdown.style.display = "none";
					trackEvent("filter-runner-selected");
					onChangeCallback();
				}
			});
		});
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
		const items = dropdown.querySelectorAll(
			".runner-selector-item:not(.no-results)",
		);

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
		onChangeCallback();
	});

	row.appendChild(inputContainer);
	row.appendChild(removeBtn);
	return row;
}

/**
 * Get currently selected runners from container
 * @param {HTMLElement} container - Container with runner selector inputs
 * @returns {Array<string>} Array of selected runner indices
 */
export function getSelectedRunners(container) {
	const inputs = container.querySelectorAll(".runner-selector-input");
	return Array.from(inputs)
		.map((input) => input.dataset.selectedIndex)
		.filter((value) => value !== "");
}

/**
 * Prepare runners list for selection
 * @param {Array} data - Full race results data
 * @returns {Array} Sorted list of runners with display names
 */
export function prepareRunnersList(data) {
	// Check if there are multiple distances in the dataset
	const uniqueDistances = new Set(
		data.map((entry) => entry.odleglosc).filter(Boolean),
	);
	const hasMultipleDistances = uniqueDistances.size > 1;

	return data
		.map((entry, index) => {
			const name = `${entry.nazwisko || ""} ${entry.imie || ""}`.trim();
			const bib = entry.numer || "";
			const category = entry.katw || "";
			const distance = entry.odleglosc || "";

			// Format distance for display (convert meters to km)
			let formattedDistance = "";
			if (distance && hasMultipleDistances) {
				const meters = parseFloat(distance);
				if (!Number.isNaN(meters)) {
					const km = meters / 1000;
					formattedDistance = `${km.toFixed(2)}km`;
				}
			}

			// Build display name based on available data
			// Format: Name (Category) Distance #Bib
			const parts = [name];

			if (category) {
				parts.push(`(${category})`);
			}

			if (formattedDistance) {
				parts.push(formattedDistance);
			}

			if (bib) {
				parts.push(`#${bib}`);
			}

            const displayName = parts.join(" ");

			return {
				index,
				name,
				bib,
				category,
				distance,
				displayName,
				entry,
			};
		})
		.filter((r) => r.name)
		.sort((a, b) => a.name.localeCompare(b.name));
}
