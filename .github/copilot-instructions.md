# GitHub Copilot Instructions

## Project Overview

This is a datasport race results analyzer that generates SVG visualizations from JSON data.

## Frontend Development Rules

### JavaScript Standards

- **Use plain JavaScript (ES6+)** - no frameworks, no transpilation
- **Use ES modules** with `import`/`export` syntax
- **Module type**: This project has `"type": "module"` in `package.json`
- All JavaScript files should use ES module syntax natively

### Module Loading

- Use `import` statements for module dependencies:
  ```javascript
  import { functionName } from "./module.js";
  import { MyClass, anotherFunction } from "./module.js";
  ```
- Always include `.js` file extensions in import paths
- Use relative paths for local modules (e.g., `./utils.js`, `../lib/helper.js`)
- **Always use named exports** - never use default exports:
  ```javascript
  export function myFunction() {}
  export const myConstant = 42;
  export class MyClass {}
  ```

### Code Style

- **Prefer modern JavaScript features**:
  - Arrow functions
  - Template literals
  - Destructuring
  - Spread operator
  - Optional chaining (`?.`)
  - Nullish coalescing (`??`)
- **Async/await** for asynchronous operations (avoid callbacks)
- **const/let** only - never use `var`
- Use **meaningful variable names**
- Keep functions small and focused

### Browser Compatibility

- Target modern browsers (ES6+ support assumed)
- No need for legacy browser support or polyfills
- Use native browser APIs where available

### File Organization

- Keep related functions in the same module
- Export only what needs to be public
- Always use named exports - no default exports allowed
- Import multiple exports using destructuring: `import { fn1, fn2 } from './module.js'`

### Data Processing

- This project works with race results data from datasport.pl
- Common data fields: `czasnetto`, `msc`, `start`, etc.
- Handle JSON parsing with proper error handling
- Validate data structure before processing

### SVG Generation

- Generate SVG markup as strings or DOM elements
- Keep SVG generation logic modular and reusable
- Use descriptive variable names for coordinates and dimensions

### Best Practices

- No build step required - code runs directly in Node.js
- Write clean, readable code
- Add comments for complex logic
- Use console logging for debugging
- Handle errors gracefully with try/catch

## Graph Generation Guidelines

- Generated graphs have to contain watermarks and attributions to my page
- When creating new graphs use existing graph generation files as reference to pick the style and structure

## Documentation

### Location

All feature documentation is located in the `/docs` folder:

- **[OVERVIEW.md](../docs/OVERVIEW.md)** - High-level feature summary and index
- **[DATA_LOADING.md](../docs/DATA_LOADING.md)** - Data loading, upload, CORS, validation
- **[STORAGE.md](../docs/STORAGE.md)** - IndexedDB storage, result management, quota
- **[MEMORY_FEATURE.md](../docs/MEMORY_FEATURE.md)** - Session persistence and restoration
- **[FILTERING.md](../docs/FILTERING.md)** - Distance, bucket size, and runner filters
- **[VISUALIZATIONS.md](../docs/VISUALIZATIONS.md)** - All visualization types and features

### Documentation Maintenance Rules

**CRITICAL**: Documentation must always stay in sync with implementation.

When making code changes:

1. **Update documentation FIRST** if adding new features
2. **Update documentation IMMEDIATELY** if modifying existing features
3. **Update documentation ALWAYS** if changing behavior or UI

#### What to Update

**Adding a new feature:**

- Add section to relevant documentation file
- Update OVERVIEW.md to reference new feature
- Add to appropriate workflow examples

**Modifying a feature:**

- Update the relevant documentation section
- Update screenshots/examples if UI changed
- Check cross-references in other docs

**Removing a feature:**

- Remove from all documentation files
- Update OVERVIEW.md
- Remove from workflow examples

**Changing behavior:**

- Update "How It Works" sections
- Update troubleshooting if error messages changed
- Update examples if output changed

#### Documentation Quality Standards

- **Be specific**: Exact button names, field names, file paths
- **Be complete**: Cover all options, edge cases, error conditions
- **Be accurate**: Test all examples and code snippets
- **Be helpful**: Include troubleshooting, best practices, use cases
- **Be current**: Remove outdated information immediately

#### Before Committing Code

Checklist:

- [ ] Code changes are complete and tested
- [ ] Documentation updated to match changes
- [ ] OVERVIEW.md updated if needed
- [ ] Examples still work as documented
- [ ] No references to removed features
- [ ] Cross-references still valid
