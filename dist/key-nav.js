// Pure Functional Navigation Framework

// Types
const NavigableKind = {
    Section: 'section',
    Item: 'item'
};

// Navigation Patterns/Modes
const NavigationMode = {
    Standard: 'standard',  // Default navigation
    SidenavViewport: 'sidenav-viewport'  // Sidenav with corresponding viewports
};

// Monadic Navigation Stack
const NavMonad = {
    pure: (x) => {
        console.log('Creating new monad with value:', x.id);
        return {
            value: x,
            history: []
        };
    },
    
    bind: (m, f) => {
        const result = f(m.value);
        console.log('Binding monad, new value:', result.value.id);
        return {
            value: result.value,
            history: [...m.history, m.value]
        };
    }
};

// Navigation Actions (Morphisms)
const Nav = {
    // Identity morphism
    stay: (state) => {
        console.log('Staying at:', state.id);
        return NavMonad.pure(state);
    },
    
    // Sibling Navigation (same level)
    next: (state) => {
        console.log('Next called with state:', state.id, state.kind);
        
        // If we're at root level, move to first child
        if (!state.parent) {
            console.log('At root level, moving to first child');
            return state.children.length > 0 
                ? NavMonad.pure(state.children[0])
                : NavMonad.pure(state);
        }
        
        // Get siblings at current level
        const siblings = Array.from(state.parent.children);
        console.log('Siblings at current level:', siblings.map(s => s.id));
        const idx = siblings.findIndex(s => s.id === state.id);
        console.log('Current index:', idx);
        
        // If we're at the last sibling, stay at current state
        if (idx === siblings.length - 1) {
            console.log('At last sibling, staying at:', state.id);
            return NavMonad.pure(state);
        }
        
        // Move to next sibling
        const nextState = siblings[idx + 1];
        console.log('Moving to next sibling:', nextState.id);
        return NavMonad.pure(nextState);
    },
    
    prev: (state) => {
        console.log('Prev called with state:', state.id, state.kind);
        
        // If we're at root level, stay at root
        if (!state.parent) {
            console.log('At root level, staying at root');
            return NavMonad.pure(state);
        }
        
        // Get siblings at current level
        const siblings = Array.from(state.parent.children);
        console.log('Siblings at current level:', siblings.map(s => s.id));
        const idx = siblings.findIndex(s => s.id === state.id);
        console.log('Current index:', idx);
        
        // If we're at the first sibling, stay at current state
        if (idx === 0) {
            console.log('At first sibling, staying at:', state.id);
            return NavMonad.pure(state);
        }
        
        // Move to previous sibling
        const prevState = siblings[idx - 1];
        console.log('Moving to previous sibling:', prevState.id);
        return NavMonad.pure(prevState);
    },
    
    // Parent-Child Navigation (different levels)
    enter: (state, context) => {
        console.log('Enter called with state:', state.id, state.kind);
        
        // Special case for sidenav-viewport pattern
        if (context && context.mode === NavigationMode.SidenavViewport) {
            // Check if this is a vendor item in the sidenav
            if (state.value.dataset && state.value.dataset.viewport) {
                const viewportId = state.value.dataset.viewport;
                const viewport = context.allElements.find(el => el.id === viewportId);
                
                if (viewport && viewport.children.length > 0) {
                    console.log('Entering viewport from vendor:', viewport.children[0].id);
                    return NavMonad.pure(viewport.children[0]);
                }
            }
        }
        
        // Default behavior
        if (state.kind === NavigableKind.Section && state.children.length > 0) {
            console.log('Entering first child:', state.children[0].id);
            return NavMonad.pure(state.children[0]);
        }
        console.log('Cannot enter, staying at:', state.id);
        return NavMonad.pure(state);
    },
            
    exit: (state, context) => {
        console.log('Exit called with state:', state.id, state.kind);
        
        // Special case for sidenav-viewport pattern
        if (context && context.mode === NavigationMode.SidenavViewport) {
            // Check if we're in a viewport section
            if (state.parent && state.parent.value.classList.contains('viewport')) {
                const viewportId = state.parent.id;
                // Find matching vendor
                const vendor = context.allElements.find(el => 
                    el.value.dataset && el.value.dataset.viewport === viewportId
                );
                
                if (vendor) {
                    console.log('Exiting from viewport to vendor:', vendor.id);
                    return NavMonad.pure(vendor);
                }
            }
        }
        
        // Default behavior - go to parent
        if (state.parent) {
            console.log('Exiting to parent:', state.parent.id);
            return NavMonad.pure(state.parent);
        }
        console.log('Cannot exit, staying at:', state.id);
        return NavMonad.pure(state);
    }
};

// UI Effects (Pure functions that produce side effects)
const UI = {
    // Insert default highlight styles into the document
    insertDefaultStyles: () => {
        // Check if styles already exist
        if (document.getElementById('pure-nav-default-styles')) return;
        
        // Create style element
        const styleEl = document.createElement('style');
        styleEl.id = 'pure-nav-default-styles';
        
        // Default styles for highlighted elements
        styleEl.textContent = `
            .nav-highlight {
                outline: 3px solid #ffcc00 !important; /* Bright yellow solid outline */
                outline-offset: 2px;
                position: relative;
                border-radius: 4px;
            }
            .nav-active {
                outline: 2px solid #33cc33 !important; /* Green solid outline */
                outline-offset: 2px;
                position: relative;
                border-radius: 4px;
            }
            .viewport {
                display: none;
            }
            .viewport.active {
                display: block;
            }
        `;
        
        // Insert into head
        document.head.appendChild(styleEl);
        
        console.log('Default navigation styles inserted');
    },
    
    highlight: (element) => {
        console.log('Highlighting element:', element?.id);
        // Remove highlight from all elements
        document.querySelectorAll('.nav-highlight').forEach(el => {
            console.log('Removing highlight from:', el.id);
            el.classList.remove('nav-highlight');
        });
        // Add highlight to current element
        if (element?.value) {
            console.log('Adding highlight to:', element.value.id);
            element.value.classList.add('nav-highlight');
        }
        return element;
    },
    
    activate: (element) => {
        document.querySelectorAll('.nav-active').forEach(el => 
            el.classList.remove('nav-active'));
        if (element?.value) {
            element.value.classList.add('nav-active');
        }
        return element;
    },
    
    // Special UI effect for viewport pattern
    updateViewport: (element, context) => {
        if (!element || !context || context.mode !== NavigationMode.SidenavViewport) return element;
        
        let viewportId = null;
        
        // If element is a vendor, get its viewport
        if (element.value.dataset && element.value.dataset.viewport) {
            viewportId = element.value.dataset.viewport;
        }
        // If element is in a viewport, get that viewport's ID
        else if (element.parent && element.parent.value.classList.contains('viewport')) {
            viewportId = element.parent.id;
        }
        
        if (viewportId) {
            // Hide all viewports
            document.querySelectorAll('.viewport').forEach(vp => {
                vp.classList.remove('active');
            });
            // Show this viewport
            const viewport = document.getElementById(viewportId);
            if (viewport) {
                viewport.classList.add('active');
            }
        }
        
        return element;
    }
};

// Keyboard Event Handler (Pure function)
const handleKey = (key, state, context) => {
    console.log('Handling key:', key, 'Current state:', state.id);
    const actions = {
        // Sibling Navigation
        'ArrowRight': () => Nav.next(state),
        'ArrowLeft': () => Nav.prev(state),
        'ArrowDown': () => Nav.next(state),  // Down is just next sibling
        'ArrowUp': () => Nav.prev(state),     // Up is just previous sibling
        
        // Parent-Child Navigation
        'Enter': () => Nav.enter(state, context),
        'Escape': () => Nav.exit(state, context),
        
        'default': () => Nav.stay(state)
    };
    
    const result = (actions[key] || actions['default'])();
    console.log('Navigation result:', result.value.id);
    return result;
};

// Helper function to get all elements in parsed structure (flatten)
const getAllElements = (root) => {
    const result = [root];
    if (root.children && root.children.length > 0) {
        for (const child of root.children) {
            result.push(...getAllElements(child));
        }
    }
    return result;
};

// Initialize Navigation (Factory function)
const createNav = (rootElement, options = {}) => {
    // Insert default styles
    UI.insertDefaultStyles();
    
    // Convert DOM structure to NavigableElements
    const parseElement = (el, parentObj = null) => {
        // Create the element structure first
        const element = {
            kind: el.classList.contains('section') ? NavigableKind.Section : NavigableKind.Item,
            id: el.id,
            value: el,
            parent: parentObj, // Assign the correct parent object
            children: []      // Initialize children array
        };

        // Now parse children, passing the newly created 'element' as their parent
        element.children = Array.from(el.children)
            .filter(childEl => childEl.id) // Only navigate elements with IDs
            .map(childEl => parseElement(childEl, element)); // Pass 'element' as parent

        console.log('Parsed element:', element.id, element.kind, 'Parent:', parentObj?.id);
        return element;
    };
    
    const root = parseElement(rootElement);
    console.log('Root element:', root.id, root.kind);
    
    // Create initial state monad
    let initialMonadState = NavMonad.pure(root);
    
    // Get all elements for easy lookup
    const allElements = getAllElements(root);
    
    // Create navigation context based on options
    const context = {
        mode: options.mode || NavigationMode.Standard,
        allElements: allElements,
        options: options
    };
    
    // Set initial current state
    let currentState = initialMonadState;
    
    // If it's a sidenav-viewport pattern and initialItem is specified, find it
    if (context.mode === NavigationMode.SidenavViewport && options.initialItem) {
        const initialElement = allElements.find(el => el.id === options.initialItem);
        if (initialElement) {
            currentState = NavMonad.pure(initialElement);
            console.log('Setting initial state to:', initialElement.id);
        }
    }
    
    // Initialize UI
    if (currentState.value) {
        UI.highlight(currentState.value);
        if (context.mode === NavigationMode.SidenavViewport) {
            UI.updateViewport(currentState.value, context);
        }
    }
    
    // Set up keyboard listener
    document.addEventListener('keydown', (e) => {
        console.log('Key pressed:', e.key);
        console.log('Current state before update:', currentState.value.id);
        
        // Handle the key press with context
        const result = handleKey(e.key, currentState.value, context);
        
        // Update current state
        currentState = result;
        
        // Update UI with context
        UI.highlight(currentState.value);
        if (context.mode === NavigationMode.SidenavViewport) {
            UI.updateViewport(currentState.value, context);
        }
        
        console.log('Current state after update:', currentState.value.id);
        
        // Prevent default browser actions
        e.preventDefault();
    });
    
    return {
        getCurrentState: () => currentState,
        getInitialParsedState: () => initialMonadState,
        getMode: () => context.mode,
        getAllElements: () => allElements,
        getHistory: () => currentState?.history || []
    };
};

// Special factory function for sidenav-viewport pattern
const createSidenavViewport = (containerElement, options = {}) => {
    // Set up options for sidenav-viewport mode
    const fullOptions = {
        mode: NavigationMode.SidenavViewport,
        initialItem: options.initialItem || null, // Initial item to select (default: first vendor)
        viewportSelector: options.viewportSelector || '.viewport', // Selector for viewport elements
        vendorSelector: options.vendorSelector || '[data-viewport]', // Selector for vendor elements
        ...options
    };
    
    // Create the navigation
    const nav = createNav(containerElement, fullOptions);
    
    // If no initial item was specified, find the first vendor
    if (!fullOptions.initialItem) {
        const vendors = nav.getAllElements().filter(el => 
            el.value.dataset && el.value.dataset.viewport
        );
        
        if (vendors.length > 0) {
            const firstVendor = vendors[0];
            // Make the first vendor active
            UI.highlight(firstVendor);
            UI.updateViewport(firstVendor, {
                mode: NavigationMode.SidenavViewport,
                allElements: nav.getAllElements()
            });
        }
    }
    
    return nav;
};

// Export as module or browser global
const KeyNav = {
    create: createNav,
    createSidenavViewport,
    Nav,
    UI,
    NavMonad,
    handleKey,
    NavigableKind,
    NavigationMode
};

// Browser export
if (typeof window !== 'undefined') {
    window.KeyNav = KeyNav;
}

// CommonJS export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = KeyNav;
}

// ES Module export
export default KeyNav; 