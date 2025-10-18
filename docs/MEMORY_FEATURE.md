# Memory Feature Documentation

## Overview

The application now automatically remembers filter settings **per result**. Each stored result remembers its own filter preferences, and these are restored when you switch between results or refresh the page.

## What's Remembered

When you load a race result and apply filters, the following information is automatically saved **for that specific result**:

1. **Distance Filter** - Which distance you had selected
2. **Bucket Size** - The histogram bucket size you chose
3. **Selected Runner** - Any specific runner you were highlighting

Additionally, for page refresh scenarios:
4. **Last Selected Result** - The specific race result you were analyzing

## How It Works

### Per-Result Memory (Primary)

The filter settings are saved **directly with each result** in IndexedDB:

- When you change any filter, it's automatically saved to that result's record
- When you click on a stored result, its saved filter settings are restored
- Each result maintains its own independent filter preferences
- No manual save action required

**Example workflow:**
1. Load "Marathon A" → Set distance to "Marathon", bucket size to "300s"
2. Load "Marathon B" → Set distance to "Half Marathon", bucket size to "120s"  
3. Click back on "Marathon A" → Your "Marathon" + "300s" settings are restored
4. Click on "Marathon B" → Your "Half Marathon" + "120s" settings are restored

### Page Refresh Memory (Fallback)

For page refresh scenarios, the last viewed result is also saved to `localStorage`:

- Restores which result you were viewing
- If the result has saved filters, those are used
- If not, the localStorage session state is used as fallback

### Persistence

Filter settings are saved in two locations:

1. **IndexedDB** (per-result filters) - Permanent, survives browser restarts
2. **localStorage** (page refresh state) - Permanent, survives browser restarts

### Cleanup

Per-result filter memory is automatically cleared when:
- You delete a specific result (only that result's filters are lost)
- You clear all stored results (all filter memories are cleared)

Page refresh memory is cleared when:
- You delete the currently loaded result
- You clear all stored results

## Technical Details

### Storage

Filter settings are stored in two locations:

**1. IndexedDB (per-result filters)**
- Database: `datasport-analyzer`
- Object Store: `results`
- Field: `filterState` within each result record
- Structure:
  ```json
  {
    "distance": "Marathon (42.19 km)",
    "bucketSize": "300",
    "runner": "42"
  }
  ```

**2. localStorage (page refresh state)**
- Storage key: `datasport-analyzer-session`
- Stored data structure:
  ```json
  {
    "resultId": 123,
    "distance": "10km",
    "bucketSize": "300",
    "runner": "42",
    "timestamp": 1729267200000
  }
  ```

### Browser Compatibility

Works in all modern browsers that support:
- `localStorage` API
- ES6+ features

### Privacy

- All data is stored locally in your browser
- No data is sent to any server
- Clear browser data will remove saved sessions

## Code Location

The memory feature is implemented in:

**`/src/storage.js`:**
- `saveResult()` - Creates result record with `filterState` field
- `updateResult()` - Updates result including `filterState`
- Result record now includes `filterState` field

**`/src/app.js`:**
- `saveSessionState()` - Saves filter state to both IndexedDB and localStorage
- `loadSessionState()` - Retrieves saved state from localStorage
- `clearSessionState()` - Removes saved state from localStorage
- `handleStoredResultClick()` - Restores per-result filter state
- Session restoration happens in the `init()` function
