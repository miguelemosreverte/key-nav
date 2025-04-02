# KeyNav.js

A pure functional keyboard navigation framework with mathematically sound foundations.

![Screenshot 2025-04-02 at 02 40 45](https://github.com/user-attachments/assets/209728ea-b962-42c1-baec-e8c3961eb860)
![Screenshot 2025-04-02 at 02 40 50](https://github.com/user-attachments/assets/8abe64ce-950e-4cd0-a4ca-6563f66abc01)


## Features

- Arrow key navigation between UI elements
- Enter/Escape for parent-child navigation
- Built on monadic principles for state management
- Automatic handling of sidenav-viewport patterns
- Zero dependencies
- Just ~4KB minified

## Installation

```bash
npm install @miguellemos/key-nav
```

Or include directly in your HTML:

```html
<script src="https://unpkg.com/@miguellemos/key-nav@1.0.0/dist/key-nav.js"></script>
```

## Quick Start

### Basic Navigation

```html
<div id="root" class="section">
  <div id="section1" class="section">
    <div id="item1" class="item">Item 1</div>
    <div id="item2" class="item">Item 2</div>
  </div>
</div>

<script>
  // Initialize basic navigation
  KeyNav.create(document.getElementById("root"));
</script>
```

### Sidenav with Viewports

```html
<div id="nav-container" class="section">
  <div id="sidenav" class="section">
    <div id="vendor1" class="item" data-viewport="viewport1">Vendor 1</div>
    <div id="vendor2" class="item" data-viewport="viewport2">Vendor 2</div>
  </div>
  <div id="content" class="section">
    <div id="viewport1" class="viewport section">
      <div id="v1-section1" class="item">Section 1</div>
    </div>
    <div id="viewport2" class="viewport section">
      <div id="v2-section1" class="item">Section 1</div>
    </div>
  </div>
</div>

<script>
  // Initialize sidenav-viewport navigation
  KeyNav.createSidenavViewport(document.getElementById("nav-container"));
</script>
```

## Usage

### Key Controls

- **Arrow Keys**: Navigate between siblings (same level)
- **Enter**: Go deeper into a section (parent to child)
- **Escape**: Go back up to parent

### Element Classes

- Add `class="section"` to container elements
- Add `class="item"` to leaf elements
- All elements must have unique `id` attributes

## License

MIT
