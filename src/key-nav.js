// Key Navigation Library
// A pure functional approach to keyboard navigation

// Navigation Node Types
const NodeType = {
  ROOT: 'root',
  CONTAINER: 'container',
  ITEM: 'item'
};

// Navigation States
const NavState = {
  BROWSING: 'browsing', // Normal navigation between siblings
  FOCUSED: 'focused'    // Entered a node, custom key handling
};

// Visual UI effects (side effects)
const UI = {
  insertStyles: () => {
    if (document.getElementById('key-nav-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'key-nav-styles';
    style.textContent = `
      .key-nav-highlight {
        outline: 3px solid #ffcc00 !important;
        outline-offset: 2px;
        position: relative;
        z-index: 1;
        background-color: rgba(255, 193, 7, 0.1);
      }
      .key-nav-active {
        outline: 2px solid #33cc33 !important;
        outline-offset: 2px;
        position: relative;
        z-index: 2;
        background-color: rgba(40, 167, 69, 0.1);
      }
      .key-nav-viewport {
        display: none;
      }
      .key-nav-viewport.active {
        display: block;
      }
      
      /* Debug indicators */
      .key-nav-debug {
        position: fixed;
        bottom: 20px;
        left: 20px;
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 10px 15px;
        border-radius: 8px;
        font-size: 14px;
        z-index: 9999;
      }
    `;
    document.head.appendChild(style);
  },
  
  highlight: (element) => {
    document.querySelectorAll('.key-nav-highlight').forEach(el => 
      el.classList.remove('key-nav-highlight'));
    
    if (element?.dom) {
      element.dom.classList.add('key-nav-highlight');
      // Ensure element is visible in viewport
      element.dom.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  },
  
  activate: (element) => {
    document.querySelectorAll('.key-nav-active').forEach(el => 
      el.classList.remove('key-nav-active'));
    
    if (element?.dom) {
      element.dom.classList.add('key-nav-active');
    }
  },
  
  showViewport: (viewportId) => {
    // Hide all viewports
    document.querySelectorAll('.key-nav-viewport').forEach(viewport => 
      viewport.classList.remove('active'));
    
    // Show the target viewport
    if (viewportId) {
      const viewport = document.getElementById(viewportId);
      if (viewport) {
        viewport.classList.add('active');
      }
    }
  }
};

// Find first navigable elements in the DOM
const findFirstLevelNavigable = (rootElement) => {
  // Check direct children first
  const directNavigable = Array.from(rootElement.children)
    .filter(el => el.id || el.classList.contains('key-nav-auto'));
  
  if (directNavigable.length > 0) {
    return directNavigable;
  }
  
  // Look for containers one level deep
  const containers = Array.from(rootElement.children)
    .filter(el => 
      el.classList.contains('key-nav-container') || 
      el.querySelectorAll('[id]').length > 0
    );
    
  // Find navigable elements in each container
  let result = [];
  for (const container of containers) {
    const navigableInContainer = Array.from(container.children)
      .filter(el => el.id || el.classList.contains('key-nav-auto'));
    
    if (navigableInContainer.length > 0) {
      result = result.concat(navigableInContainer);
    }
  }
  
  return result;
};

// Parse DOM to navigation structure
const createNavStructure = (rootElement, options = {}) => {
  const parseNode = (element, parent = null) => {
    // Skip elements without ID
    if (!element.id && !element.classList.contains('key-nav-auto')) {
      return null;
    }
    
    // Auto-assign ID if missing
    if (!element.id && element.classList.contains('key-nav-auto')) {
      element.id = `key-nav-${Math.random().toString(36).substring(2, 9)}`;
    }
    
    // Determine node type
    let type = NodeType.ITEM;
    if (!parent) {
      type = NodeType.ROOT;
    } else if (element.classList.contains('key-nav-container') ||
               element.querySelector('[id]')) {
      type = NodeType.CONTAINER;
    }
    
    // Create node object
    const node = {
      id: element.id,
      dom: element,
      type,
      parent,
      children: [],
      viewportId: element.dataset.viewport || null,
      state: NavState.BROWSING,
      customHandlers: {},
      
      // Add custom key handler for focused state
      addKeyHandler: function(key, handler) {
        this.customHandlers[key] = handler;
        return this;
      },
      
      // Handle key when focused (returns true if handled)
      handleKey: function(key) {
        if (this.state !== NavState.FOCUSED) return false;
        if (this.customHandlers[key]) {
          this.customHandlers[key](this);
          return true;
        }
        return false;
      }
    };
    
    // Parse children
    if (type !== NodeType.ITEM) {
      Array.from(element.children)
        .map(child => parseNode(child, node))
        .filter(Boolean) // Remove null entries
        .forEach(child => node.children.push(child));
    }
    
    return node;
  };
  
  // Start parsing from root
  return parseNode(rootElement);
};

// Core navigation
const KeyNavigation = (rootElement, options = {}) => {
  // Initialize
  UI.insertStyles();
  
  // Parse structure
  let root = createNavStructure(rootElement, options);
  let current = null;
  let navHistory = [];
  let mutationObserver = null;
  
  // Get all nodes (for finding by ID)
  const getAllNodes = (node, result = []) => {
    result.push(node);
    node.children.forEach(child => getAllNodes(child, result));
    return result;
  };
  
  // Find a node by ID
  const findNodeById = (id) => {
    const allNodes = getAllNodes(root);
    return allNodes.find(node => node.id === id);
  };
  
  // Initialize the current node - try to find a good starting point
  const initializeCurrentNode = () => {
    // If initialItem is specified in options, use that
    if (options.initialItem) {
      const initialNode = findNodeById(options.initialItem);
      if (initialNode) {
        return initialNode;
      }
    }
    
    // Otherwise, try to find vendors or first-level navigable items
    const firstLevelNodes = root.children;
    
    // If we have child nodes, pick the first one
    if (firstLevelNodes.length > 0) {
      // First, look for a vendor (element with viewport attribute)
      const vendorNode = firstLevelNodes.find(node => node.viewportId);
      if (vendorNode) {
        return vendorNode;
      }
      
      // Otherwise, just take the first child
      return firstLevelNodes[0];
    }
    
    // If no children found, look for second-level nodes
    const allNodes = getAllNodes(root);
    const goodStartNodes = allNodes.filter(node => 
      node.id !== root.id && (node.viewportId || node.children.length > 0)
    );
    
    if (goodStartNodes.length > 0) {
      return goodStartNodes[0];
    }
    
    // Fallback to root if nothing better found
    return root;
  };
  
  // Set initial current node
  current = initializeCurrentNode();
  
  // Navigation functions
  const nav = {
    next: () => {
      if (current.state === NavState.FOCUSED) return current;
      
      if (current.parent) {
        const siblings = current.parent.children;
        const index = siblings.indexOf(current);
        if (index < siblings.length - 1) {
          return siblings[index + 1];
        }
      }
      return current;
    },
    
    prev: () => {
      if (current.state === NavState.FOCUSED) return current;
      
      if (current.parent) {
        const siblings = current.parent.children;
        const index = siblings.indexOf(current);
        if (index > 0) {
          return siblings[index - 1];
        }
      }
      return current;
    },
    
    enter: () => {
      // If already focused, stay focused
      if (current.state === NavState.FOCUSED) return current;
      
      // If it's a container with children, go to first child
      if ((current.type === NodeType.CONTAINER || current.type === NodeType.ROOT) && 
          current.children.length > 0) {
        return current.children[0];
      }
      
      // If it has a viewport and is an item, activate the viewport
      if (current.viewportId) {
        // Find first element in the viewport
        const viewport = document.getElementById(current.viewportId);
        if (viewport) {
          UI.showViewport(current.viewportId);
          
          // Find first navigable element in viewport
          const firstViewportElement = getAllNodes(root)
            .find(node => node.dom.closest(`#${current.viewportId}`));
            
          if (firstViewportElement) {
            return firstViewportElement;
          }
        }
      }
      
      // Become focused if it's an item
      if (current.type === NodeType.ITEM) {
        current.state = NavState.FOCUSED;
        UI.activate(current);
      }
      
      return current;
    },
    
    exit: () => {
      // If focused, revert to browsing
      if (current.state === NavState.FOCUSED) {
        current.state = NavState.BROWSING;
        UI.activate(null);
        return current;
      }
      
      // If inside a viewport, find the item that controls this viewport
      const viewportElement = current.dom.closest('.key-nav-viewport');
      if (viewportElement) {
        const viewportId = viewportElement.id;
        const viewportController = getAllNodes(root)
          .find(node => node.viewportId === viewportId);
          
        if (viewportController) {
          return viewportController;
        }
      }
      
      // Otherwise go to parent
      if (current.parent) {
        return current.parent;
      }
      
      return current;
    }
  };
  
  // Handle keyboard input
  const handleKeyDown = (event) => {
    const key = event.key;
    
    // Ignore if no current element
    if (!current) return;
    
    // Check if current element wants to handle this key
    if (current.handleKey(key)) {
      event.preventDefault();
      return;
    }
    
    let nextNode = current;
    
    switch (key) {
      case 'ArrowDown':
      case 'ArrowRight':
        nextNode = nav.next();
        break;
      case 'ArrowUp':
      case 'ArrowLeft':
        nextNode = nav.prev();
        break;
      case 'Enter':
        nextNode = nav.enter();
        break;
      case 'Escape':
        nextNode = nav.exit();
        break;
      default:
        return; // Don't handle other keys
    }
    
    // Update current node and UI
    if (nextNode !== current) {
      navHistory.push(current);
      current = nextNode;
      UI.highlight(current);
      
      // Handle viewport display if needed
      if (current.viewportId && current.state !== NavState.FOCUSED) {
        UI.showViewport(current.viewportId);
      }
    }
    
    event.preventDefault();
  };
  
  // Setup keyboard listener
  document.addEventListener('keydown', handleKeyDown);
  
  // Refresh navigation structure
  const refresh = () => {
    // Store current ID to try to restore selection
    const currentId = current?.id;
    
    // Reparse the structure
    root = createNavStructure(rootElement, options);
    
    // Try to restore the selection
    if (currentId) {
      const sameNode = findNodeById(currentId);
      if (sameNode) {
        current = sameNode;
      } else {
        current = initializeCurrentNode();
      }
    } else {
      current = initializeCurrentNode();
    }
    
    // Update UI
    UI.highlight(current);
    if (current.viewportId) {
      UI.showViewport(current.viewportId);
    }
    
    return current;
  };
  
  // Observer for DOM changes
  const setupObserver = () => {
    if (mutationObserver) {
      mutationObserver.disconnect();
    }
    
    // Debounce refresh
    let refreshTimeout = null;
    const debouncedRefresh = () => {
      clearTimeout(refreshTimeout);
      refreshTimeout = setTimeout(() => {
        refresh();
        refreshTimeout = null;
      }, 200);
    };
    
    // Create observer
    mutationObserver = new MutationObserver((mutations) => {
      const hasStructuralChanges = mutations.some(mutation => 
        mutation.type === 'childList' || 
        (mutation.type === 'attributes' && 
         (mutation.attributeName === 'id' || mutation.attributeName === 'class'))
      );
      
      if (hasStructuralChanges) {
        debouncedRefresh();
      }
    });
    
    // Start observing
    mutationObserver.observe(rootElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['id', 'class']
    });
  };
  
  // Auto-setup observer if enabled
  if (options.autoRefresh !== false) {
    setupObserver();
  }
  
  // Initialize UI
  UI.highlight(current);
  
  // Return public API
  return {
    // Get current state
    getCurrent: () => current,
    
    // Update methods
    refresh,
    enableAutoRefresh: setupObserver,
    disableAutoRefresh: () => {
      if (mutationObserver) {
        mutationObserver.disconnect();
        mutationObserver = null;
        return true;
      }
      return false;
    },
    
    // Custom handler
    addKeyHandler: (nodeId, key, handler) => {
      const node = findNodeById(nodeId);
      if (node) {
        node.addKeyHandler(key, handler);
        return true;
      }
      return false;
    }
  };
};

// Helper to create a sidenav with viewport
const createSidenavViewport = (rootElement, options = {}) => {
  // Set all viewports to have the correct class
  Array.from(document.querySelectorAll(options.viewportSelector || '.viewport'))
    .forEach(viewport => viewport.classList.add('key-nav-viewport'));
  
  // Create the navigation
  const nav = KeyNavigation(rootElement, options);
  
  // Override to add viewport handling
  const originalRefresh = nav.refresh;
  nav.refresh = () => {
    const result = originalRefresh();
    
    // Make first sidenav item active if nothing is selected
    if (result === nav.getCurrent() && result.type === NodeType.ROOT) {
      const firstItem = result.children[0];
      if (firstItem && firstItem.viewportId) {
        UI.highlight(firstItem);
        UI.showViewport(firstItem.viewportId);
      }
    }
    
    return result;
  };
  
  return nav;
};

// Export the library
const KeyNav = {
  create: KeyNavigation,
  createSidenavViewport,
  NodeType,
  NavState,
  UI
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
// export default KeyNav;