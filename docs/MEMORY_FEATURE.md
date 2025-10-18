# Memory Feature Documentation

## Overview

The application now automatically remembers your last session and restores it when you refresh the page.

## What's Remembered

When you load a race result and apply filters, the following information is automatically saved:

1. **Last Selected Result** - The specific race result you were analyzing
2. **Distance Filter** - Which distance you had selected
3. **Bucket Size** - The histogram bucket size you chose
4. **Selected Runner** - Any specific runner you were highlighting

## How It Works

### Automatic Saving

The session state is automatically saved to `localStorage` whenever:
- You load a race result from storage
- You upload a new results file
- You change any filter (distance, bucket size, or runner)

### Automatic Restoration

When you refresh the page or reopen the app:
- The last result you were viewing is automatically loaded
- All your filter settings are restored
- You're taken directly to the visualizations

### Persistence

Sessions are saved permanently in your browser's localStorage and will persist across browser restarts.

### Cleanup

The saved session is automatically cleared when:
- You delete the currently loaded result
- You clear all stored results

## Technical Details

### Storage

- Uses browser's `localStorage` for persistence
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

The memory feature is implemented in `/src/app.js`:

- `saveSessionState()` - Saves current state
- `loadSessionState()` - Retrieves saved state
- `clearSessionState()` - Removes saved state
- Session restoration happens in the `init()` function
