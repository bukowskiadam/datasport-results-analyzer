# Storage Management Documentation

## Overview

The app uses IndexedDB for persistent storage of race results. This allows you to save multiple races, manage them efficiently, and access them instantly without re-uploading files.

## Storage Technology

### IndexedDB
The app uses browser's IndexedDB - a low-level API for client-side storage of structured data:

- **Database Name**: `datasport-analyzer`
- **Version**: 1
- **Object Store**: `results`
- **Key Path**: `id` (auto-incrementing)

### Why IndexedDB?
- **Large capacity**: Can store 50MB+ files without issues
- **Structured data**: Stores JSON directly, no parsing needed
- **Indexed queries**: Fast retrieval by ID or metadata
- **Transactional**: ACID compliant (Atomic, Consistent, Isolated, Durable)
- **Asynchronous**: Non-blocking operations
- **Persistent**: Survives browser restarts

### Comparison with Other Storage Options

| Feature     | IndexedDB        | localStorage  | SessionStorage |
| ----------- | ---------------- | ------------- | -------------- |
| Capacity    | ~50% of disk     | ~5-10 MB      | ~5-10 MB       |
| Data Types  | Any (structured) | Strings only  | Strings only   |
| Persistence | Permanent        | Permanent     | Session only   |
| Performance | Fast             | Fast          | Fast           |
| Async       | Yes              | No            | No             |
| Use Case    | Large datasets   | Small configs | Temporary data |

## Stored Data Structure

### Result Record Schema

Each stored result contains:

```javascript
{
  id: 1,                          // Auto-generated unique ID
  name: "Warsaw Marathon 2023",   // User-editable name
  data: [...],                    // Full race results array
  sourceUrl: "https://...",       // Optional datasport.pl URL
  uploadDate: "2023-10-15T14:30:00.000Z", // ISO timestamp
  size: 1245678,                  // File size in bytes
  recordCount: 2543               // Number of runners in data
}
```

### Metadata Fields

**id** (number)
- Primary key
- Auto-incremented by IndexedDB
- Used to reference results in UI

**name** (string)
- Initially set from filename
- User can edit inline in the UI
- Should be descriptive for easy identification

**data** (array)
- Full race results JSON array
- Contains all runner records
- Stored as-is from uploaded file

**sourceUrl** (string, nullable)
- Optional datasport.pl URL
- Can be added/edited after upload
- Used to link back to original race page

**uploadDate** (string, ISO 8601)
- Automatically set on upload
- Used for sorting (newest first)
- Displayed in local time format

**size** (number)
- File size in bytes
- Displayed in human-readable format (KB, MB)
- Used for storage quota monitoring

**recordCount** (number)
- Total number of runners in dataset
- Includes DNF/DNS (full count)
- Displayed in result cards

## Storage Operations

### Saving Results

**Automatic Save on Upload:**
```javascript
// Happens automatically when you upload a file
const resultId = await saveResult(
  filename,      // e.g., "results.json"
  jsonData,      // Parsed JSON array
  sourceUrl,     // Optional URL from input field
  fileSize       // File size in bytes
);
```

**What Gets Saved:**
- ✅ Complete race data (all runners, all fields)
- ✅ Filename (as initial name)
- ✅ Source URL (if provided)
- ✅ Upload timestamp
- ✅ File size
- ✅ Record count

**What Doesn't Get Saved:**
- ❌ Current filter selections (distance, bucket size)
  - These are saved separately in session state
- ❌ Generated SVGs (too large)
  - Download SVGs separately if needed
- ❌ Visualization state (zoom, pan)

### Retrieving Results

**Load All Results (Metadata Only):**
```javascript
const results = await getAllResults();
// Returns array of result metadata (without full data)
// Used to populate the stored results list
```

**Load Single Result (Full Data):**
```javascript
const result = await getResult(id);
// Returns complete result including full data array
// Used when clicking a result card to analyze it
```

### Updating Results

**Edit Result Name:**
- Click on the result name in any result card
- Name becomes editable (contenteditable)
- Press Enter or click away to save
- Automatically syncs to IndexedDB

**Edit Source URL:**
- Click the ✏️ (edit) button next to URL
- Popup prompts for new URL
- Can add URL if none exists
- Can modify existing URL
- Can clear by entering empty string

### Deleting Results

**Delete Single Result:**
- Click the × (close) button on any result card
- Confirmation dialog appears
- If confirmed, result is permanently deleted
- UI updates to remove the card
- Storage quota is freed

**Delete All Results:**
- Click "Clear All Storage" button
- Confirmation dialog appears
- If confirmed, ALL results are deleted
- Cannot be undone
- Useful for privacy or freeing space

## Storage Quota Management

### Checking Storage Usage

The app displays storage usage at the bottom of the stored results section:

```
Storage: 15.3 MB / 2.5 GB (0.6%)
```

**Components:**
- **Used space**: Total size of all stored results
- **Available quota**: Browser's allocated storage limit
- **Percentage**: Used / Quota × 100

### Browser Storage Limits

Different browsers have different storage quota policies:

**Chrome/Edge:**
- Quota: ~60% of available disk space
- Minimum: ~1 GB even on small disks
- Can request more via Persistent Storage API

**Firefox:**
- Quota: ~50% of available disk space
- Per-origin limit: Up to 2 GB by default
- Can request more in about:config

**Safari:**
- Initial quota: ~1 GB
- Prompts user to allow more if exceeded
- More conservative on mobile

**Mobile Browsers:**
- Generally more restricted (500 MB - 1 GB)
- May clear storage more aggressively
- Consider using smaller datasets on mobile

### What Happens When Storage is Full?

**Before reaching limit:**
- Quota check is performed on save
- Warning displayed if quota is close to limit

**If quota exceeded:**
- Save operation fails gracefully
- Error message shown: "Failed to save to storage"
- Existing results are not affected
- User must delete results to free space

### Best Practices

1. **Monitor Usage**: Check storage indicator regularly
2. **Delete Old Results**: Remove races you no longer need
3. **Use Meaningful Names**: Easy to identify which to keep/delete
4. **Download Important SVGs**: Before deleting results
5. **Multi-Distance Races**: Consider keeping only needed distances

## Result Cards UI

### Card Layout

Each result card displays:

```
┌─────────────────────────────────────────────┐
│ [Name (editable)]                        [×]│
├─────────────────────────────────────────────┤
│ 📊 2,543 records                            │
│ 💾 1.2 MB                                   │
│ 📅 Oct 15, 2023, 2:30 PM                   │
│ 🔗 View online [✏️]                         │
└─────────────────────────────────────────────┘
```

### Interactions

**Click card**: Load and analyze the result
**Click name**: Enable inline editing
**Click × button**: Delete the result
**Click ✏️ button**: Edit source URL
**Click "View online"**: Open datasport.pl page in new tab

### Sorting

Results are sorted by upload date:
- **Newest first**: Most recently uploaded at top
- **Oldest last**: Older results at bottom
- Sorting happens automatically on load

## Session State Integration

The storage system integrates with session memory:

### On Result Load:
- Current result ID is saved to session state
- Allows restore on page refresh

### On Result Delete:
- If deleting currently loaded result:
  - Session state is cleared
  - Prevents restore of non-existent result

### On Clear All:
- Session state is cleared
- Next page load starts fresh

See [MEMORY_FEATURE.md](MEMORY_FEATURE.md) for details on session persistence.

## Performance Optimization

### Metadata-Only Queries

When loading the results list, the app fetches metadata only:
- Excludes the large `data` field
- Reduces memory usage
- Faster list rendering
- Full data loaded only when needed

### Efficient Indexing

IndexedDB indexes on:
- **Primary key (id)**: Fast retrieval by ID
- **name index**: Fast search by name (future feature)
- **uploadDate index**: Fast sorting by date

### Transaction Management

All operations use proper IndexedDB transactions:
- **readonly**: For queries (getAllResults, getResult)
- **readwrite**: For modifications (save, update, delete)
- Ensures data consistency

## Error Handling

### Common Errors

**"Failed to save to storage"**
- Quota exceeded
- Solution: Delete old results

**"Result not found"**
- Result was deleted
- Session state references non-existent result
- Solution: Clear session, app auto-recovers

**"Failed to initialize storage"**
- IndexedDB not supported (very old browser)
- IndexedDB disabled in browser settings
- Private browsing mode restrictions (Safari)
- Solution: Use supported browser or enable IndexedDB

### Recovery Strategies

1. **Automatic Recovery**: App clears invalid session state
2. **Graceful Degradation**: Upload still works if storage fails
3. **User Notification**: Clear error messages displayed
4. **Console Logging**: Detailed errors logged for debugging

## Privacy and Security

### Data Privacy
- All data stored locally in browser
- No server synchronization
- No cloud backup
- Not shared between browsers
- Not accessible by other websites

### Data Security
- Origin-isolated (only this app can access)
- No encryption (stored in plain text in IndexedDB)
- Consider implications for sensitive race data
- Clearing browser data removes all stored results

### Recommendations
- Don't store sensitive personal data
- Use browser's private/incognito mode for temporary analysis
- Clear storage after analysis on shared computers
- Remember: No server backup means local-only storage

## Browser Compatibility

### Supported Browsers

| Browser     | IndexedDB Support | Storage Quota API |
| ----------- | ----------------- | ----------------- |
| Chrome 24+  | ✅                 | ✅                 |
| Firefox 16+ | ✅                 | ✅                 |
| Safari 10+  | ✅                 | ⚠️ Limited         |
| Edge 12+    | ✅                 | ✅                 |
| Opera 15+   | ✅                 | ✅                 |

### Not Supported
- Internet Explorer (any version)
- Very old mobile browsers
- Browsers with IndexedDB disabled

### Feature Detection

The app checks for IndexedDB support:
```javascript
if (!window.indexedDB) {
  // Fallback: App still works but can't save results
  console.warn("IndexedDB not available");
}
```

## Advanced Topics

### Manual Database Inspection

Developers can inspect the database:

**Chrome DevTools:**
1. Open DevTools (F12)
2. Go to Application tab
3. Expand IndexedDB section
4. Click `datasport-analyzer` → `results`

**Firefox DevTools:**
1. Open DevTools (F12)
2. Go to Storage tab
3. Expand Indexed DB section
4. Click database and object store

### Database Migration

If schema changes in future versions:
```javascript
request.onupgradeneeded = (event) => {
  const db = event.target.result;
  
  // Version 1: Initial schema
  if (event.oldVersion < 1) {
    const store = db.createObjectStore('results', {
      keyPath: 'id',
      autoIncrement: true
    });
    store.createIndex('name', 'name', { unique: false });
    store.createIndex('uploadDate', 'uploadDate', { unique: false });
  }
  
  // Version 2: Add new indexes (example)
  if (event.oldVersion < 2) {
    // Migration code here
  }
};
```

### Backup and Export

Currently no built-in export feature, but developers can:
1. Retrieve all results via DevTools
2. Export as JSON
3. Import in another browser (manual process)

Future feature consideration: Export/import functionality.

## Troubleshooting

### Storage Not Persisting

**Symptoms:**
- Results disappear after closing browser
- Storage usage shows 0 after reload

**Solutions:**
- Check if private/incognito mode
- Check browser storage settings
- Verify IndexedDB not disabled
- Clear browser cache and try again

### Cannot Delete Results

**Symptoms:**
- Delete confirmation works but result remains
- Error in console

**Solutions:**
- Refresh page and try again
- Check DevTools console for errors
- Manually delete via DevTools (Application → IndexedDB)

### Storage Quota Issues

**Symptoms:**
- "Failed to save to storage" error
- Storage percentage near 100%

**Solutions:**
- Delete unused results
- Clear browser cache/data
- Check disk space on device
- Consider using smaller race datasets
