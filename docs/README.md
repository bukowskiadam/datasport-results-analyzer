# Documentation

This folder contains comprehensive documentation for the datasport-results-analyzer application.

## Documentation Structure

### User Documentation

**[OVERVIEW.md](OVERVIEW.md)** - Start here!
- High-level feature summary
- Quick start guide
- Workflow examples
- Document index

**[DATA_LOADING.md](DATA_LOADING.md)** - Loading race data
- URL-based loading
- File upload methods
- CORS restrictions
- Data validation
- Error handling

**[STORAGE.md](STORAGE.md)** - Result management
- IndexedDB storage system
- Result card interface
- Storage quota management
- Metadata editing
- Privacy and security

**[MEMORY_FEATURE.md](MEMORY_FEATURE.md)** - Session persistence
- Automatic state saving
- Page refresh restoration
- What gets remembered
- How it works

**[FILTERING.md](FILTERING.md)** - Analysis features
- Distance filtering
- Bucket size control
- Runner highlighting
- Filter interactions
- Performance tips

**[VISUALIZATIONS.md](VISUALIZATIONS.md)** - Visualization guide
- All four visualization types
- Features and use cases
- Interactive elements
- Downloading SVGs
- Customization options

## Quick Navigation

### By Task

**I want to load race data:**
→ See [DATA_LOADING.md](DATA_LOADING.md)

**I want to save/manage results:**
→ See [STORAGE.md](STORAGE.md)

**I want to understand visualizations:**
→ See [VISUALIZATIONS.md](VISUALIZATIONS.md)

**I want to filter and analyze:**
→ See [FILTERING.md](FILTERING.md)

**I want session to persist:**
→ See [MEMORY_FEATURE.md](MEMORY_FEATURE.md)

### By Feature

| Feature           | Documentation                                                             |
| ----------------- | ------------------------------------------------------------------------- |
| URL preparation   | [DATA_LOADING.md](DATA_LOADING.md#method-1-url-based-loading-recommended) |
| File upload       | [DATA_LOADING.md](DATA_LOADING.md#method-2-direct-file-upload)            |
| CORS issues       | [DATA_LOADING.md](DATA_LOADING.md#cors-restrictions)                      |
| IndexedDB         | [STORAGE.md](STORAGE.md#storage-technology)                               |
| Result cards      | [STORAGE.md](STORAGE.md#result-cards-ui)                                  |
| Storage quota     | [STORAGE.md](STORAGE.md#storage-quota-management)                         |
| Session memory    | [MEMORY_FEATURE.md](MEMORY_FEATURE.md)                                    |
| Distance filter   | [FILTERING.md](FILTERING.md#1-distance-filter)                            |
| Bucket size       | [FILTERING.md](FILTERING.md#2-bucket-size-filter)                         |
| Runner selection  | [FILTERING.md](FILTERING.md#3-runner-selection-filter)                    |
| Net times scatter | [VISUALIZATIONS.md](VISUALIZATIONS.md#1-net-times-scatter-plot)           |
| Histogram         | [VISUALIZATIONS.md](VISUALIZATIONS.md#2-net-times-histogram)              |
| Start buckets     | [VISUALIZATIONS.md](VISUALIZATIONS.md#3-stacked-start-buckets-histogram)  |
| Start vs finish   | [VISUALIZATIONS.md](VISUALIZATIONS.md#4-start-vs-finish-time-scatter)     |
| SVG download      | [VISUALIZATIONS.md](VISUALIZATIONS.md#downloading-visualizations)         |

### By Problem

| Problem                | Solution                                                                           |
| ---------------------- | ---------------------------------------------------------------------------------- |
| Cannot load data       | [DATA_LOADING.md - CORS](DATA_LOADING.md#cors-restrictions)                        |
| Invalid URL error      | [DATA_LOADING.md - Errors](DATA_LOADING.md#error-handling)                         |
| Storage full           | [STORAGE.md - Quota](STORAGE.md#storage-quota-management)                          |
| Results not saving     | [STORAGE.md - Errors](STORAGE.md#error-handling)                                   |
| Session not restoring  | [MEMORY_FEATURE.md - Cleanup](MEMORY_FEATURE.md#cleanup)                           |
| Filter not working     | [FILTERING.md - Troubleshooting](FILTERING.md#troubleshooting)                     |
| Runner not highlighted | [FILTERING.md - Runner not highlighted](FILTERING.md#runner-not-highlighted)       |
| Unclear visualization  | [VISUALIZATIONS.md - Choosing](VISUALIZATIONS.md#choosing-the-right-visualization) |

## For Developers

### Maintaining Documentation

**IMPORTANT**: Documentation must stay in sync with code.

See [copilot-instructions.md](../.github/copilot-instructions.md#documentation-maintenance-rules) for:
- When to update docs
- What to update
- Quality standards
- Pre-commit checklist

### Documentation Style Guide

**Formatting:**
- Use Markdown format
- Include code examples in triple backticks
- Use tables for comparisons
- Use lists for steps/options

**Structure:**
- Start with overview/purpose
- Provide detailed explanations
- Include examples and use cases
- Add troubleshooting section
- Include technical details

**Writing Style:**
- Clear and concise
- Active voice
- Present tense
- Direct instructions ("Click the button" not "The user should click")
- Technical accuracy over simplicity

**Code Examples:**
```javascript
// Use actual working code
// Include comments
// Show complete examples
```

### Adding New Documentation

1. Create new `.md` file in `/docs` folder
2. Follow existing structure and style
3. Update `OVERVIEW.md` to link to new doc
4. Update this `README.md` navigation sections
5. Cross-reference from related documents
6. Update `.github/copilot-instructions.md` if needed

## Documentation Statistics

- **Total Documents**: 6 files
- **Total Content**: ~30,000 words
- **Last Updated**: October 2025
- **Coverage**: All features documented

## Feedback

Found an error or unclear explanation in the documentation?
- Check if it's a code issue or documentation issue
- For documentation improvements, update the relevant `.md` file
- Ensure technical accuracy before making changes

---

**Quick Links:**
- [Main README](../README.md) - Project overview
- [Copilot Instructions](../.github/copilot-instructions.md) - Development guidelines
- [Live App](https://bukowskiadam.github.io/datasport-results-analyzer/) - Try the app
