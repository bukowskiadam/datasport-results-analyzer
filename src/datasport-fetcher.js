/**
 * Fetch and parse race results from datasport.pl
 */

/**
 * Available CORS proxy services
 */
const CORS_PROXIES = {
  none: '',
  corsproxy: 'https://corsproxy.io/?',
};

/**
 * Get the JSON URL without fetching
 * @param {string} url - The datasport.pl URL
 * @returns {string} The results.json URL (without proxy)
 * @throws {Error} If URL format is invalid
 */
export function getJsonUrl(url) {
  const match = url.match(/(https?:\/\/wyniki\.datasport\.pl\/results\d+)\//i);
  
  if (!match) {
    throw new Error(
      'Invalid URL format. Expected format: https://wyniki.datasport.pl/results<number>/...'
    );
  }
  
  return `${match[1]}/results.json`;
}

/**
 * Extract the results ID from a datasport.pl URL
 * @param {string} url - The datasport.pl URL
 * @returns {string|null} The results ID (e.g., "results5710") or null if not found
 */
export function extractResultsId(url) {
  const match = url.match(/results(\d+)/i);
  return match ? `results${match[1]}` : null;
}

/**
 * Set the CORS proxy to use
 * @param {string} proxyKey - Key from CORS_PROXIES ('none', 'corsproxy', 'allorigins')
 */
export function setCorsProxy(proxyKey) {
  if (proxyKey in CORS_PROXIES) {
    currentProxy = CORS_PROXIES[proxyKey];
  }
}

/**
 * Get available proxy options
 * @returns {Object} Available CORS proxies
 */
export function getAvailableProxies() {
  return Object.keys(CORS_PROXIES);
}

/**
 * Extract the results base URL from a datasport URL
 * Expected format: https://wyniki.datasport.pl/results<number>/[whatever]
 * Returns: https://wyniki.datasport.pl/results<number>/results.json
 * @param {string} url - The datasport.pl URL
 * @returns {string} The results.json URL
 * @throws {Error} If URL format is invalid
 */
function constructJsonUrl(url) {
  // Match the pattern: https://wyniki.datasport.pl/results<number>/
  const match = url.match(/(https?:\/\/wyniki\.datasport\.pl\/results\d+)\//i);
  
  if (!match) {
    throw new Error(
      'Invalid URL format. Expected format: https://wyniki.datasport.pl/results<number>/...'
    );
  }
  
  const jsonUrl = `${match[1]}/results.json`;
  
  // Apply CORS proxy if configured
  return currentProxy ? `${currentProxy}${encodeURIComponent(jsonUrl)}` : jsonUrl;
}

/**
 * Fetch race results data from a datasport URL
 * @param {string} url - The datasport.pl URL
 * @returns {Promise<Array>} Array of race result records
 * @throws {Error} If fetching or parsing fails
 */
export async function fetchDatasportResults(url) {
  // Validate URL
  if (!url || typeof url !== 'string') {
    throw new Error('Invalid URL provided');
  }

  // Check if it's a datasport URL
  const urlLower = url.toLowerCase();
  if (!urlLower.includes('datasport.pl')) {
    throw new Error('Please provide a valid wyniki.datasport.pl URL');
  }

  try {
    // Construct the JSON endpoint URL
    const jsonUrl = constructJsonUrl(url);
    
    // Fetch the JSON data directly
    const response = await fetch(jsonUrl, {
      method: 'GET',
      mode: 'cors',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch data: ${response.status} ${response.statusText}`);
    }

    const jsonData = await response.json();

    if (!jsonData || !Array.isArray(jsonData) || jsonData.length === 0) {
      throw new Error('No race results found. The results.json file may be empty.');
    }

    return jsonData;
  } catch (error) {
    if (error.message.includes('Failed to fetch') || error.name === 'TypeError') {
      throw new Error(
        'Unable to fetch data. This is likely due to CORS restrictions. ' +
        'Try enabling a CORS proxy in the settings below.'
      );
    }
    throw error;
  }
}
