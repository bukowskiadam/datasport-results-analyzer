/**
 * IndexedDB storage for race results
 * Handles large JSON files (>50MB) efficiently
 */

const DB_NAME = "datasport-analyzer";
const DB_VERSION = 1;
const STORE_NAME = "results";

let db = null;

/**
 * Initialize IndexedDB database
 * @returns {Promise<IDBDatabase>}
 */
export async function initStorage() {
	return new Promise((resolve, reject) => {
		const request = indexedDB.open(DB_NAME, DB_VERSION);

		request.onerror = () => reject(request.error);
		request.onsuccess = () => {
			db = request.result;
			resolve(db);
		};

		request.onupgradeneeded = (event) => {
			const database = event.target.result;

			// Create object store if it doesn't exist
			if (!database.objectStoreNames.contains(STORE_NAME)) {
				const objectStore = database.createObjectStore(STORE_NAME, {
					keyPath: "id",
					autoIncrement: true,
				});

				// Create indexes for efficient querying
				objectStore.createIndex("name", "name", { unique: false });
				objectStore.createIndex("uploadDate", "uploadDate", { unique: false });
			}
		};
	});
}

/**
 * Save race results to storage
 * @param {string} name - Result name/identifier
 * @param {Array} data - Race results data
 * @param {string} [sourceUrl] - Optional original datasport URL
 * @param {number} [fileSize] - Optional original file size in bytes
 * @returns {Promise<number>} ID of saved record
 */
export async function saveResult(name, data, sourceUrl = null, fileSize = null) {
	if (!db) await initStorage();

	return new Promise((resolve, reject) => {
		const transaction = db.transaction([STORE_NAME], "readwrite");
		const store = transaction.objectStore(STORE_NAME);

		const record = {
			name,
			data,
			sourceUrl,
			uploadDate: new Date().toISOString(),
			size: fileSize || new Blob([JSON.stringify(data)]).size,
			recordCount: data.length,
			filterState: null, // Will store distance, bucketSize, runner filters
		};

		const request = store.add(record);

		request.onsuccess = () => resolve(request.result);
		request.onerror = () => reject(request.error);
	});
}

/**
 * Get a result by ID
 * @param {number} id - Result ID
 * @returns {Promise<Object>} Result record
 */
export async function getResult(id) {
	if (!db) await initStorage();

	return new Promise((resolve, reject) => {
		const transaction = db.transaction([STORE_NAME], "readonly");
		const store = transaction.objectStore(STORE_NAME);
		const request = store.get(id);

		request.onsuccess = () => resolve(request.result);
		request.onerror = () => reject(request.error);
	});
}

/**
 * Get all stored results (metadata only, without full data)
 * @returns {Promise<Array>} Array of result metadata
 */
export async function getAllResults() {
	if (!db) await initStorage();

	return new Promise((resolve, reject) => {
		const transaction = db.transaction([STORE_NAME], "readonly");
		const store = transaction.objectStore(STORE_NAME);
		const request = store.getAll();

		request.onsuccess = () => {
			// Return metadata only (exclude large data field for list view)
			const results = request.result.map(
				({ id, name, uploadDate, size, recordCount, sourceUrl }) => ({
					id,
					name,
					uploadDate,
					size,
					recordCount,
					sourceUrl,
				}),
			);
			resolve(results);
		};
		request.onerror = () => reject(request.error);
	});
}

/**
 * Delete a result by ID
 * @param {number} id - Result ID to delete
 * @returns {Promise<void>}
 */
export async function deleteResult(id) {
	if (!db) await initStorage();

	return new Promise((resolve, reject) => {
		const transaction = db.transaction([STORE_NAME], "readwrite");
		const store = transaction.objectStore(STORE_NAME);
		const request = store.delete(id);

		request.onsuccess = () => resolve();
		request.onerror = () => reject(request.error);
	});
}

/**
 * Update result metadata (name and/or sourceUrl)
 * @param {number} id - Result ID
 * @param {Object} updates - Fields to update {name?, sourceUrl?}
 * @returns {Promise<void>}
 */
export async function updateResult(id, updates) {
	if (!db) await initStorage();

	return new Promise((resolve, reject) => {
		const transaction = db.transaction([STORE_NAME], "readwrite");
		const store = transaction.objectStore(STORE_NAME);
		
		const getRequest = store.get(id);
		
		getRequest.onsuccess = () => {
			const record = getRequest.result;
			if (!record) {
				reject(new Error("Record not found"));
				return;
			}
			
			// Update fields
			if (updates.name !== undefined) {
				record.name = updates.name;
			}
			if (updates.sourceUrl !== undefined) {
				record.sourceUrl = updates.sourceUrl;
			}
			if (updates.filterState !== undefined) {
				record.filterState = updates.filterState;
			}
			
			const putRequest = store.put(record);
			putRequest.onsuccess = () => resolve();
			putRequest.onerror = () => reject(putRequest.error);
		};
		
		getRequest.onerror = () => reject(getRequest.error);
	});
}

/**
 * Clear all stored results
 * @returns {Promise<void>}
 */
export async function clearAllResults() {
	if (!db) await initStorage();

	return new Promise((resolve, reject) => {
		const transaction = db.transaction([STORE_NAME], "readwrite");
		const store = transaction.objectStore(STORE_NAME);
		const request = store.clear();

		request.onsuccess = () => resolve();
		request.onerror = () => reject(request.error);
	});
}

/**
 * Get storage usage estimate
 * @returns {Promise<{usage: number, quota: number}>}
 */
export async function getStorageInfo() {
	if ("storage" in navigator && "estimate" in navigator.storage) {
		return await navigator.storage.estimate();
	}
	return { usage: 0, quota: 0 };
}

/**
 * Format bytes to human-readable size
 * @param {number} bytes - Size in bytes
 * @returns {string} Formatted size string
 */
export function formatSize(bytes) {
	if (bytes === 0) return "0 B";
	const k = 1024;
	const sizes = ["B", "KB", "MB", "GB"];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return `${Math.round((bytes / k ** i) * 100) / 100} ${sizes[i]}`;
}
