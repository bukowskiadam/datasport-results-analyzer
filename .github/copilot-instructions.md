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
