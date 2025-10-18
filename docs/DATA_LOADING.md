# Data Loading Documentation

## Overview

The application provides two methods for loading race results data from datasport.pl: automatic URL preparation and manual file upload. All loaded data is automatically saved to persistent browser storage (IndexedDB).

## Loading Methods

### Method 1: URL-Based Loading (Recommended)

This method helps you quickly locate and download the results JSON file from datasport.pl.

#### Steps:

1. **Find Your Race Results**
   - Visit datasport.pl and locate your race results page
   - Example URL: `https://wyniki.datasport.pl/results5710/show/`

2. **Prepare Download**
   - Copy the race results URL
   - Paste it into the URL input field in the app
   - Click **"Prepare Download"** button
   
3. **Download JSON File**
   - The app constructs the direct JSON endpoint URL
   - Click **"📄 Open results.json in New Tab"**
   - A new tab opens with the JSON data
   - Save the file: Press `Ctrl+S` (Windows/Linux) or `Cmd+S` (Mac)
   - Or right-click and select "Save as..."

4. **Upload the JSON File**
   - Use drag-and-drop into the upload zone
   - Or click **"Browse Files"** to select the file

### Method 2: Direct File Upload

If you already have a `results.json` file saved locally:

1. **Drag and Drop**
   - Simply drag the JSON file onto the upload zone
   - The app displays a visual indicator during drag

2. **Browse for File**
   - Click anywhere in the upload zone
   - Or click the **"Browse Files"** button
   - Select your `results.json` file from the file picker

## CORS Restrictions

Due to browser security policies (Cross-Origin Resource Sharing), the app cannot directly fetch data from datasport.pl domains. This is why the manual download step is necessary.

### Why This Happens:
- Modern browsers block cross-origin requests by default
- Datasport.pl servers don't include CORS headers allowing external access
- This is a security feature, not a bug

### Workarounds Attempted:
- CORS proxy services (often unreliable or blocked)
- Direct fetch requests (blocked by browser)

### Current Solution:
- Manual download is the most reliable method
- Works consistently across all browsers
- No dependency on third-party proxy services

## Data Validation

The app validates uploaded files to ensure data quality:

### File Format Checks:
- Must be a `.json` file extension
- Must contain valid JSON syntax
- Must be an array of race result records

### Data Structure Validation:
- Each record should have expected fields:
  - `czasnetto` - Net finish time
  - `start` - Start time
  - `msc` - Final placing
  - `nazwisko`, `imie` - Runner name
  - `odleglosc` - Race distance
  - `numer` - Bib number

### Automatic Filtering:
- **DNF/DNS Exclusion**: Runners who didn't finish (missing `czasnetto`) are automatically filtered out
- **Zero Position Filter**: Entries with `msc = "0"` are excluded
- The app shows how many runners were excluded: `"X finishers (Y DNF/DNS excluded)"`

## File Size Considerations

### Large File Support:
- **IndexedDB Storage**: Handles files over 50MB efficiently
- **No Memory Issues**: Data is stored in structured database, not in memory
- **Typical File Sizes**:
  - Small race (100-500 runners): 50-200 KB
  - Medium race (500-2000 runners): 200-800 KB
  - Large race (2000+ runners): 1-5 MB
  - Very large race (10000+ runners): 5-50 MB

### Browser Storage Limits:
- Chrome/Edge: ~60% of available disk space
- Firefox: ~50% of available disk space  
- Safari: ~1GB (can request more)
- The app displays storage usage in the interface

## Automatic Saving

Every loaded result is automatically saved to browser storage:

### What Gets Saved:
1. **Full Race Data**: Complete JSON array with all runner records
2. **Metadata**:
   - File name (editable after upload)
   - Upload date and time
   - Record count (number of runners)
   - File size in bytes
   - Source URL (if provided during upload)

### Storage Location:
- **Technology**: IndexedDB (browser's structured database)
- **Database Name**: `datasport-analyzer`
- **Store Name**: `results`
- **Persistence**: Survives browser restarts, tab closes
- **Clearing**: Only removed by explicit user action or clearing browser data

### Metadata Management:
- Edit result names by clicking on them (inline editing)
- Add/edit source URLs using the ✏️ button
- Delete individual results using the × button
- View storage usage and quota in the interface

## Error Handling

### Common Errors and Solutions:

#### "Invalid URL format"
- **Cause**: URL doesn't match expected datasport.pl pattern
- **Solution**: Ensure URL is from `wyniki.datasport.pl/results<number>/`

#### "Please upload a JSON file"
- **Cause**: File doesn't have `.json` extension
- **Solution**: Make sure you saved the file as JSON, not HTML

#### "Invalid JSON format"
- **Cause**: File content is not valid JSON
- **Solution**: Verify you downloaded the results.json file, not an HTML page

#### "No completed runs in the data"
- **Cause**: All runners in the file have no finish time
- **Solution**: Check if this is a live race that hasn't finished yet

#### "Failed to save to storage"
- **Cause**: Browser storage quota exceeded
- **Solution**: Delete old results or check browser storage settings

## Technical Details

### Data Processing Pipeline:

```javascript
File Upload → JSON Parse → Validation → Filter DNF/DNS → 
Generate Visualizations → Save to IndexedDB → Update UI
```

### Modules Involved:

1. **datasport-fetcher.js**
   - Constructs JSON endpoint URLs
   - Validates datasport.pl URL format
   - Extracts race ID from URL

2. **storage.js**
   - Manages IndexedDB connection
   - Saves/retrieves race results
   - Handles metadata updates
   - Tracks storage usage

3. **app.js**
   - Coordinates file upload workflow
   - Handles drag-and-drop events
   - Processes uploaded files
   - Displays success/error messages

### Browser Compatibility:

**Required APIs:**
- IndexedDB (database storage)
- File API (file upload)
- ES6 Modules (code loading)
- localStorage (session memory)

**Supported Browsers:**
- Chrome/Edge 63+
- Firefox 60+
- Safari 11.1+
- Opera 50+

**Not Supported:**
- Internet Explorer (any version)
- Legacy mobile browsers

## Best Practices

### For Best Results:

1. **Use Descriptive Names**: Rename results after upload for easy identification
   - Example: "Warsaw Marathon 2023 - Marathon"

2. **Add Source URLs**: Always add the datasport.pl URL for future reference
   - Click the ✏️ button to add URL after upload

3. **Regular Cleanup**: Delete old results you no longer need
   - Keeps storage usage low
   - Improves app performance

4. **Check Storage Usage**: Monitor the storage indicator
   - Displayed at bottom of stored results section
   - Shows used space vs. available quota

5. **Download SVGs Before Deleting**: Save visualizations you want to keep
   - Results can be deleted, but SVGs are static files

## Privacy and Security

### Data Privacy:
- **All data stays local**: Nothing is sent to any server
- **No tracking**: App doesn't collect usage data
- **No accounts**: No login or registration required

### Data Security:
- IndexedDB is origin-isolated (only this app can access it)
- Clearing browser data removes all stored results
- No data is shared between different browsers

### Recommendations:
- Use the app in a trusted browser
- Don't share browser profiles with untrusted users
- Clear sensitive race data after analysis if using shared computer
