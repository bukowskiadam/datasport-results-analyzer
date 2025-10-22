/**
 * Share modal component for social media sharing
 */

/**
 * Convert SVG to PNG blob
 * @param {string} svgString - SVG markup
 * @param {number} width - Desired width
 * @param {number} height - Desired height
 * @returns {Promise<Blob>} PNG blob
 */
async function svgToPng(svgString, width, height) {
	return new Promise((resolve, reject) => {
		const canvas = document.createElement("canvas");
		canvas.width = width * 2; // 2x for better quality
		canvas.height = height * 2;
		const ctx = canvas.getContext("2d");

		const img = new Image();
		const blob = new Blob([svgString], {
			type: "image/svg+xml;charset=utf-8",
		});
		const url = URL.createObjectURL(blob);

		img.onload = () => {
			ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
			URL.revokeObjectURL(url);

			canvas.toBlob(
				(pngBlob) => {
					if (pngBlob) {
						resolve(pngBlob);
					} else {
						reject(new Error("Failed to convert to PNG"));
					}
				},
				"image/png",
			);
		};

		img.onerror = () => {
			URL.revokeObjectURL(url);
			reject(new Error("Failed to load SVG"));
		};

		img.src = url;
	});
}

/**
 * Show share modal with options
 * @param {string} svgContent - Generated SVG content
 * @param {string} vizName - Visualization name
 * @param {string} raceName - Race name
 * @param {string} vizType - Visualization type key
 * @param {Function} trackEvent - Analytics tracking function
 * @param {Function} showError - Error display function
 */
export function showShareModal(
	svgContent,
	vizName,
	raceName,
	vizType,
	trackEvent,
	showError,
) {
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
	const appUrl =
		"https://bukowskiadam.github.io/datasport-results-analyzer/";
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
				const file = new File([pngBlob], filename, { type: "image/png" });
				const shareData = {
					files: [file],
					title: vizName,
					text: shareText,
				};

				if (navigator.canShare(shareData)) {
					await navigator.share(shareData);
					trackEvent("visualization-shared-native", { visualization: vizType });
				} else {
					// Fallback: download the image
					const url = URL.createObjectURL(pngBlob);
					const link = document.createElement("a");
					link.href = url;
					link.download = filename;
					document.body.appendChild(link);
					link.click();
					document.body.removeChild(link);
					URL.revokeObjectURL(url);
					showError("Native sharing not available. Image downloaded instead.");
				}
			} else {
				// Fallback: download the image
				const url = URL.createObjectURL(pngBlob);
				const link = document.createElement("a");
				link.href = url;
				link.download = filename;
				document.body.appendChild(link);
				link.click();
				document.body.removeChild(link);
				URL.revokeObjectURL(url);
				showError(
					"Native sharing not supported on this browser. Image downloaded instead.",
				);
			}
		} catch (error) {
			if (error.name === "AbortError") {
				// User cancelled the share
				console.log("Share cancelled by user");
			} else {
				console.error("Failed to share:", error);
				showError("Failed to share. Please try downloading PNG instead.");
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
 * Export SVG to PNG and download
 * @param {string} svgContent - SVG content
 * @param {string} raceName - Race name
 * @param {string} vizType - Visualization type
 * @param {Function} trackEvent - Analytics tracking function
 * @param {Function} showError - Error display function
 */
export async function downloadAsPng(
	svgContent,
	raceName,
	vizType,
	trackEvent,
	showError,
) {
	try {
		const filename = `${raceName.replace(/\s+/g, "-")}-${vizType}.png`;
		const pngBlob = await svgToPng(svgContent, 1200, 600);
		const url = URL.createObjectURL(pngBlob);
		const link = document.createElement("a");
		link.href = url;
		link.download = filename;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		URL.revokeObjectURL(url);
		trackEvent("visualization-downloaded-png", { visualization: vizType });
	} catch (error) {
		console.error("Failed to download PNG:", error);
		showError("Failed to download PNG. Please try downloading SVG instead.");
	}
}
