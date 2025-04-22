document.addEventListener('DOMContentLoaded', () => {
  const desktopIcons = document.querySelectorAll('.desktop-icon');
  const windowsContainer = document.getElementById('windows-container');
  const taskbarOpened = document.getElementById('taskbar-opened');
  const taskbar = document.querySelector('.taskbar');
  const taskbarHeight = 35; // Height of the taskbar
  let activeWindow = null;
  let zIndex = 100;

  // Get viewport dimensions with taskbar adjustment
  const getViewportDimensions = () => {
    return {
      width: window.innerWidth,
      height: window.innerHeight - taskbarHeight
    };
  };

  const windowTemplate = document.createElement('template');
  windowTemplate.innerHTML = `
    <div class="window">
      <div class="window-header">
        <div class="window-title"></div>
        <div class="window-controls">
          <div class="window-control minimize"><img src="Windows XP Icons/Minimize.png" alt="Minimize"></div>
          <div class="window-control maximize"><img src="Windows XP Icons/Maximize.png" alt="Maximize"></div>
          <div class="window-control close"><img src="Windows XP Icons/Exit.png" alt="Close"></div>
        </div>
      </div>
      <div class="window-content"></div>
      <div class="window-status-bar"></div>
      <div class="resizer resizer-nw"></div>
      <div class="resizer resizer-ne"></div>
      <div class="resizer resizer-sw"></div>
      <div class="resizer resizer-se"></div>
      <div class="resizer resizer-n"></div>
      <div class="resizer resizer-s"></div>
      <div class="resizer resizer-w"></div>
      <div class="resizer resizer-e"></div>
    </div>
  `;

  // Initialize an offset for cascading windows
  let windowOffset = 20;

  const createWindow = (id, title) => {
    const window = windowTemplate.content.cloneNode(true).firstElementChild;
    window.id = id;
    
    const viewport = getViewportDimensions();
    
    // Set default size (not too large)
    const defaultWidth = Math.min(750, viewport.width * 0.8);
    const defaultHeight = Math.min(550, viewport.height * 0.8);
    
    window.style.width = `${defaultWidth}px`;
    window.style.height = `${defaultHeight}px`;
    
    // Ensure window is always visible within viewport
    const maxLeft = viewport.width - defaultWidth;
    const maxTop = viewport.height - defaultHeight;
    
    // Cascade position with safety limits
    window.style.left = `${Math.min(maxLeft, Math.max(0, windowOffset))}px`;
    window.style.top = `${Math.min(maxTop, Math.max(0, windowOffset))}px`;
    
    // Increment offset for next window with wrapping
    windowOffset += 30;
    if (windowOffset > 200) windowOffset = 20;
    
    window.style.zIndex = zIndex++;
    window.querySelector('.window-title').textContent = title;
    
    // Add status bar information
    window.querySelector('.window-status-bar').textContent = `${title} - Ready`;
    
    windowsContainer.appendChild(window);
    return window;
  };

  const loadWindowContent = (window, contentUrl) => {
    const contentElement = window.querySelector('.window-content');
    contentElement.innerHTML = '<div class="loading-spinner"></div>';
    
    fetch(contentUrl)
      .then(response => response.text())
      .then(data => {
        contentElement.innerHTML = data;
        
        // Enable scrolling for window content
        contentElement.style.overflow = 'auto';
        contentElement.style.height = 'calc(100% - 55px)'; // Adjust for header and status bar
        
        // Add event listeners to any nested windows in the content
        setupNestedWindowListeners(window);
        
        // Update status bar
        window.querySelector('.window-status-bar').textContent = `${window.querySelector('.window-title').textContent} - Loaded`;
      })
      .catch(error => {
        console.error('Error loading window content:', error);
        contentElement.innerHTML = `<div class="error-message">
          <img src="Windows XP Icons/error.png" alt="Error">
          <p>Could not load content: ${error.message}</p>
        </div>`;
        window.querySelector('.window-status-bar').textContent = 'Error loading content';
      });
  };
  
  // Setup event listeners for nested windows
  const setupNestedWindowListeners = (parentWindow) => {
    // If this window has an iframe, set up message listeners
    const iframes = parentWindow.querySelectorAll('iframe');
    iframes.forEach(iframe => {
      iframe.addEventListener('load', () => {
        iframe.contentWindow.parent = window;
      });
    });
    
    // For links that should open windows
    const windowLinks = parentWindow.querySelectorAll('[data-window]');
    windowLinks.forEach(link => {
      link.addEventListener('click', () => {
        const windowId = link.dataset.window;
        const title = link.querySelector('span')?.textContent || 'Window';
        let contentUrl = windowId.replace('-window', '') + '.html';
        
        openWindow(windowId, title, contentUrl);
      });
    });
  };

  // Updated addToTaskbar function to handle projects and skills window
  const addToTaskbar = (id, title) => { // Keep title parameter for potential future use, but don't use it for display text
    if (!document.getElementById(`taskbar-${id}`)) {
      const taskbarItem = document.createElement('div');
      taskbarItem.id = `taskbar-${id}`;
      taskbarItem.classList.add('window-title'); // Keep class for styling
      
      // Extract base icon name from window id
      const baseId = id.replace('-window', '');
      
      // Handle special cases for icon paths
      let iconPath = '';
      
      // Try to match the icon with the same path used in desktop icons or window content
      if (baseId === 'my-computer') {
        iconPath = 'Windows XP Icons/My Computer.png';
      } else if (baseId === 'my-documents') {
        iconPath = 'Windows XP Icons/XPSP3RES Unknown 1.png';
      } else if (baseId === 'recycle-bin') {
        iconPath = 'Windows XP Icons/Recycle Bin.png'; // Assuming this path is correct, adjust if needed
      } else if (baseId === 'about') {
        // Corrected path to match my-computer.html
        iconPath = 'Windows XP Icons/Speech.png'; 
      } else if (baseId === 'projects') {
        iconPath = 'Windows XP Icons/My Pictures.png';
      } else if (baseId === 'skills') {
        iconPath = 'Windows XP Icons/XPSP3RES Unknown 1.png'; // Use the XP document icon for skills
      } else if (baseId === 'network') { 
        // Added specific path for network to match my-computer.html
        iconPath = 'Windows XP Icons/Workgroup.png'; 
      } else {
        // Default path format (attempt to find matching icon)
        // Capitalize first letter for potential file names like 'About.png'
        const capitalizedBaseId = baseId.charAt(0).toUpperCase() + baseId.slice(1);
        iconPath = `Windows XP Icons/${capitalizedBaseId}.png`;
      }
      
      // Create the image element
      const iconImg = document.createElement('img');
      iconImg.src = iconPath;
      
      // Add an error handler for fallback icon
      iconImg.onerror = function() {
        // Try a more generic fallback path if specific one fails
        this.src = `Windows XP Icons/program.png`;
        
        // If that also fails, use a data URI as final fallback
        this.onerror = function() {
          this.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABGdBTUEAAK/INwWK6QAAABl0RVh0U29mdHdhcmUAQWRvYmUgSW1hZ2VSZWFkeXHJZTwAAAGsSURBVDjLjZNLSwJRFIa1ii7pIYU6LYIKqVQqMHoQCQY9wEWQO8m9m9ZtWre2oBYtQmjTpkULN22jRdBCUCIK0gzTCKM0pzy/GWcaGUtn4MDM4P2+c+65M8QAnCGCjCfoSJgSMHKgwHQoMg1a4QUgCLKkOlcQhCc6DMOEUGQaxMYz/Jzf8+vrdrvfiqL4qKpKJUmSwvY0xjUQnRZw97qHoijyuq5LSZIe2263ww6oRIEo+6OeFonP51O2t7d5TdPkRqMhMgyTYBgmBgg0+Y/T6VTcbjdJOYZh0q1Wa/hJrNVqSqlUIgKBwCDbQSaTCXW73eFz0Gw2lXK5TEQikSFFkS3VarUnWZaDfr9/oAktl8uQJIlgWXZEFMUV5V9SoiiqsLmxQXp9XqVer0OWZTLHqKpK5XI5kuM4Xus0KY/HM6/Are1tBSSxOI2ZpDRNw2w55XIZ6XQauVwO1WqVzC6QSCRCNpst6fP5hC7PdU3J5/MoFotdEVRVJcdF0Wh0lmVZ0e12j1xKMpkkC4UCisXiILPZLJrN5gTGdQ0r/iBt0/CdKz8GKGZW5yEwkwAAAABJRU5ErkJggg==';
          this.onerror = null; // Prevent infinite loop
        };
      };
      
      // Append the elements to the taskbar item
      taskbarItem.appendChild(iconImg);
      
      const titleSpan = document.createElement('span');
      // Use the baseId (e.g., 'about', 'skills') capitalized for display
      const displayName = baseId.charAt(0).toUpperCase() + baseId.slice(1).replace('-', ' '); // Capitalize and replace hyphen
      titleSpan.textContent = displayName;
      taskbarItem.appendChild(titleSpan);
      
      taskbarOpened.appendChild(taskbarItem);
    }
    taskbarOpened.style.display = 'flex';
  };

  const makeWindowActive = (window) => {
    // First, remove active class from all windows
    document.querySelectorAll('.window').forEach(w => {
      w.classList.remove('active-window');
      w.style.border = '1px solid #0054E3'; // Thinner border for inactive windows
      w.style.boxShadow = '1px 1px 3px rgba(0,0,0,0.2)';
    });
    
    // Make this window active
    window.classList.add('active-window');
    window.style.border = '2px solid #0078D7'; // Thicker border for active window
    window.style.boxShadow = '2px 2px 6px rgba(0,0,0,0.3)'; // More prominent shadow
    window.style.zIndex = zIndex++;
    activeWindow = window;
    
    // Update taskbar item appearance
    const windowId = window.id;
    document.querySelectorAll('.window-title').forEach(item => {
      item.classList.remove('active');
    });
    const taskbarItem = document.getElementById(`taskbar-${windowId}`);
    if (taskbarItem) taskbarItem.classList.add('active');
  };

  // Ensure window stays within screen boundaries
  const constrainWindowPosition = (window) => {
    const viewport = getViewportDimensions();
    const rect = window.getBoundingClientRect();
    
    // Make sure at least 100px of the window is always visible
    const minVisibleWidth = Math.min(100, rect.width);
    const minVisibleHeight = Math.min(50, rect.height);
    
    let left = parseInt(window.style.left);
    let top = parseInt(window.style.top);
    
    // Constrain left position
    if (left + minVisibleWidth > viewport.width) {
      left = viewport.width - minVisibleWidth;
    }
    if (left < 0) {
      left = 0;
    }
    
    // Constrain top position - ensure it doesn't go below viewport height
    if (top + rect.height > viewport.height) {
      top = viewport.height - rect.height;
    }
    if (top < 0) {
      top = 0;
    }
    
    window.style.left = `${left}px`;
    window.style.top = `${top}px`;
  };

  const handleWindowControls = (window, windowId) => {
    const windowControls = window.querySelector('.window-controls');
    const minimizeButton = windowControls.querySelector('.minimize');
    const maximizeButton = windowControls.querySelector('.maximize');
    const closeButton = windowControls.querySelector('.close');
    
    // Store original window position and size for restore
    let originalPosition = null;
    
    // Ensure all control images have proper alt text and are loaded correctly
    minimizeButton.querySelector('img').alt = "Minimize";
    maximizeButton.querySelector('img').alt = "Maximize";
    closeButton.querySelector('img').alt = "Close";
    
    // Force image reload to ensure they display
    minimizeButton.querySelector('img').src = "Windows XP Icons/Minimize.png?" + new Date().getTime();
    maximizeButton.querySelector('img').src = "Windows XP Icons/Maximize.png?" + new Date().getTime();
    closeButton.querySelector('img').src = "Windows XP Icons/Exit.png?" + new Date().getTime();
    
    minimizeButton.addEventListener('click', () => {
      window.style.display = 'none';
      const taskbarItem = document.getElementById(`taskbar-${windowId}`);
      if (taskbarItem) {
        taskbarItem.querySelector('.window-title').classList.add('minimized');
      }
    });
    
    maximizeButton.addEventListener('click', () => {
      const viewport = getViewportDimensions();
      
      if (!originalPosition) {
        // Save current position and size
        originalPosition = {
          width: window.style.width,
          height: window.style.height,
          left: window.style.left,
          top: window.style.top
        };
        
        // Maximize
        window.style.width = `${viewport.width}px`;
        window.style.height = `${viewport.height}px`;
        window.style.left = '0';
        window.style.top = '0';
        
        // Add maximized class to help with responsive styling
        window.classList.add('maximized');
        
        // Change icon to restore icon
        maximizeButton.querySelector('img').src = "Windows XP Icons/Restore.png";
        maximizeButton.querySelector('img').alt = "Restore";
        
        // Disable resizers in maximized state
        window.querySelectorAll('.resizer').forEach(r => r.style.display = 'none');
        
        // Force content refresh to ensure responsive layout
        const contentElement = window.querySelector('.window-content');
        if (contentElement) {
          // Trigger reflow
          contentElement.style.display = 'none';
          contentElement.offsetHeight; // Force reflow
          contentElement.style.display = '';
        }
      } else {
        // Restore
        window.style.width = originalPosition.width;
        window.style.height = originalPosition.height;
        window.style.left = originalPosition.left;
        window.style.top = originalPosition.top;
        
        // Remove maximized class
        window.classList.remove('maximized');
        
        // Change icon back to maximize
        maximizeButton.querySelector('img').src = "Windows XP Icons/Maximize.png";
        maximizeButton.querySelector('img').alt = "Maximize";
        
        // Re-enable resizers
        window.querySelectorAll('.resizer').forEach(r => r.style.display = 'block');
        
        originalPosition = null;
        
        // Force content refresh
        const contentElement = window.querySelector('.window-content');
        if (contentElement) {
          // Trigger reflow
          contentElement.style.display = 'none';
          contentElement.offsetHeight; // Force reflow
          contentElement.style.display = '';
        }
      }
      
      // Update window status bar with new dimensions
      window.querySelector('.window-status-bar').textContent = 
        `Size: ${parseInt(window.style.width)}x${parseInt(window.style.height)}`;
    });
    
    closeButton.addEventListener('click', () => {
      window.remove();
      const taskbarItem = document.getElementById(`taskbar-${windowId}`);
      if (taskbarItem) {
        taskbarItem.remove();
      }
      
      if (document.querySelectorAll('.taskbar-opened .window-title').length === 0) {
        document.getElementById('taskbar-opened').style.display = 'none';
      }
    });
  };

  // Function to open a window - used by both desktop icons and nested windows
  const openWindow = (windowId, title, contentUrl) => {
    let window = document.getElementById(windowId);
  
    if (!window) {
      window = createWindow(windowId, title);
      loadWindowContent(window, contentUrl);
      addToTaskbar(windowId, title);
  
      handleWindowControls(window, windowId);
  
      let isDragging = false;
      let isResizing = false;
      let currentResizer = null;
      let startX, startY, startLeft, startTop, startWidth, startHeight;
  
      // Only allow dragging from the header
      const windowHeader = window.querySelector('.window-header');
  
      // Start drag only from header and not from control buttons
      windowHeader.addEventListener('mousedown', (e) => {
        // Don't initiate drag if clicking on window controls
        if (e.target.closest('.window-control') || 
            e.target.closest('.window-controls')) {
          return;
        }
        
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        startLeft = window.offsetLeft;
        startTop = window.offsetTop;
        makeWindowActive(window);
        
        // Add a class to indicate dragging state
        document.body.classList.add('dragging');
        window.classList.add('dragging');
      });
  
      // Add touch support for mobile
      windowHeader.addEventListener('touchstart', (e) => {
        if (e.target.closest('.window-control') || 
            e.target.closest('.window-controls')) {
          return;
        }
        
        isDragging = true;
        const touch = e.touches[0];
        startX = touch.clientX;
        startY = touch.clientY;
        startLeft = window.offsetLeft;
        startTop = window.offsetTop;
        makeWindowActive(window);
        
        document.body.classList.add('dragging');
        window.classList.add('dragging');
      });
  
      // Handle dragging with improved boundary checking
      document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        
        const viewport = getViewportDimensions();
        const windowRect = window.getBoundingClientRect();
        const newLeft = startLeft + (e.clientX - startX);
        const newTop = startTop + (e.clientY - startY);
        
        // Ensure window stays completely within viewport boundaries
        const maxLeft = viewport.width - windowRect.width;
        const maxTop = viewport.height - windowRect.height;
        
        window.style.left = `${Math.min(maxLeft, Math.max(0, newLeft))}px`;
        window.style.top = `${Math.min(maxTop, Math.max(0, newTop))}px`;
        
        // Update status bar during dragging
        window.querySelector('.window-status-bar').textContent = `Position: ${parseInt(window.style.left)}x${parseInt(window.style.top)}`;
      });
  
      // Touch move for mobile dragging
      document.addEventListener('touchmove', (e) => {
        if (!isDragging) return;
        e.preventDefault(); // Prevent scrolling while dragging
        
        const viewport = getViewportDimensions();
        const windowRect = window.getBoundingClientRect();
        const touch = e.touches[0];
        const newLeft = startLeft + (touch.clientX - startX);
        const newTop = startTop + (touch.clientY - startY);
        
        // Ensure window stays completely within viewport boundaries
        const maxLeft = viewport.width - windowRect.width;
        const maxTop = viewport.height - windowRect.height;
        
        window.style.left = `${Math.min(maxLeft, Math.max(0, newLeft))}px`;
        window.style.top = `${Math.min(maxTop, Math.max(0, newTop))}px`;
        
        // Update status bar during dragging
        window.querySelector('.window-status-bar').textContent = `Position: ${parseInt(window.style.left)}x${parseInt(window.style.top)}`;
      });
  
      // End dragging
      document.addEventListener('mouseup', () => {
        if (isDragging) {
          isDragging = false;
          document.body.classList.remove('dragging');
          window.classList.remove('dragging');
          
          // Final position check to ensure window is within bounds
          constrainWindowPosition(window);
          
          // Reset status bar
          window.querySelector('.window-status-bar').textContent = `${window.querySelector('.window-title').textContent} - Ready`;
        }
      });
  
      document.addEventListener('touchend', () => {
        if (isDragging) {
          isDragging = false;
          document.body.classList.remove('dragging');
          window.classList.remove('dragging');
          constrainWindowPosition(window);
          
          // Reset status bar
          window.querySelector('.window-status-bar').textContent = `${window.querySelector('.window-title').textContent} - Ready`;
        }
      });
  
      // Make window active when clicking anywhere in the window
      window.addEventListener('mousedown', () => {
        makeWindowActive(window);
      });
  
      // Implement improved resizing with robust boundary checking
      const resizers = window.querySelectorAll('.resizer');
  
      const handleResize = (e) => {
        if (!isResizing) return;
        
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
  
        const minWidth = 250;
        const minHeight = 150;
        const viewport = getViewportDimensions();
  
        // Get window's current position and size
        let currentLeft = startLeft;
        let currentTop = startTop;
        let currentWidth = startWidth;
        let currentHeight = startHeight;
  
        switch (currentResizer.className.split(' ')[1]) {
          case 'resizer-se':
            // Southeast - just adjust width and height
            currentWidth = Math.max(minWidth, startWidth + dx);
            currentHeight = Math.max(minHeight, startHeight + dy);
            
            // Prevent overflowing the viewport
            if (currentLeft + currentWidth > viewport.width) {
              currentWidth = viewport.width - currentLeft;
            }
            if (currentTop + currentHeight > viewport.height) {
              currentHeight = viewport.height - currentTop;
            }
            break;
            
          case 'resizer-sw':
            // Southwest - adjust width, left and height
            currentWidth = Math.max(minWidth, startWidth - dx);
            currentLeft = startLeft + startWidth - currentWidth;
            currentHeight = Math.max(minHeight, startHeight + dy);
            
            // Prevent overflowing left side
            if (currentLeft < 0) {
              currentWidth = startWidth + startLeft;
              currentLeft = 0;
            }
            
            // Prevent overflowing bottom
            if (currentTop + currentHeight > viewport.height) {
              currentHeight = viewport.height - currentTop;
            }
            break;
            
          case 'resizer-ne':
            // Northeast - adjust width, top and height
            currentWidth = Math.max(minWidth, startWidth + dx);
            currentHeight = Math.max(minHeight, startHeight - dy);
            currentTop = startTop + startHeight - currentHeight;
            
            // Prevent overflowing right side
            if (currentLeft + currentWidth > viewport.width) {
              currentWidth = viewport.width - currentLeft;
            }
            
            // Prevent overflowing top
            if (currentTop < 0) {
              currentHeight = startHeight + startTop;
              currentTop = 0;
            }
            break;
            
          case 'resizer-nw':
            // Northwest - adjust width, height, left and top
            currentWidth = Math.max(minWidth, startWidth - dx);
            currentHeight = Math.max(minHeight, startHeight - dy);
            currentLeft = startLeft + startWidth - currentWidth;
            currentTop = startTop + startHeight - currentHeight;
            
            // Prevent overflowing left side
            if (currentLeft < 0) {
              currentWidth = startWidth + startLeft;
              currentLeft = 0;
            }
            
            // Prevent overflowing top
            if (currentTop < 0) {
              currentHeight = startHeight + startTop;
              currentTop = 0;
            }
            break;
            
          case 'resizer-n':
            // North - adjust height and top
            currentHeight = Math.max(minHeight, startHeight - dy);
            currentTop = startTop + startHeight - currentHeight;
            
            // Prevent overflowing top
            if (currentTop < 0) {
              currentHeight = startHeight + startTop;
              currentTop = 0;
            }
            break;
            
          case 'resizer-s':
            // South - just adjust height
            currentHeight = Math.max(minHeight, startHeight + dy);
            
            // Prevent overflowing bottom
            if (currentTop + currentHeight > viewport.height) {
              currentHeight = viewport.height - currentTop;
            }
            break;
            
          case 'resizer-w':
            // West - adjust width and left
            currentWidth = Math.max(minWidth, startWidth - dx);
            currentLeft = startLeft + startWidth - currentWidth;
            
            // Prevent overflowing left side
            if (currentLeft < 0) {
              currentWidth = startWidth + startLeft;
              currentLeft = 0;
            }
            break;
            
          case 'resizer-e':
            // East - just adjust width
            currentWidth = Math.max(minWidth, startWidth + dx);
            
            // Prevent overflowing right side
            if (currentLeft + currentWidth > viewport.width) {
              currentWidth = viewport.width - currentLeft;
            }
            break;
        }
  
        // Apply the calculated values
        window.style.width = `${currentWidth}px`;
        window.style.height = `${currentHeight}px`;
        window.style.left = `${currentLeft}px`;
        window.style.top = `${currentTop}px`;
        
        // Update status bar with current dimensions
        window.querySelector('.window-status-bar').textContent = `Size: ${parseInt(currentWidth)}x${parseInt(currentHeight)}`;
      };
  
      resizers.forEach(resizer => {
        resizer.addEventListener('mousedown', function(e) {
          e.stopPropagation();
          isResizing = true;
          currentResizer = this;
          
          // Get precise measurements
          const rect = window.getBoundingClientRect();
          startX = e.clientX;
          startY = e.clientY;
          startWidth = rect.width;
          startHeight = rect.height;
          startLeft = window.offsetLeft;
          startTop = window.offsetTop;
          
          document.addEventListener('mousemove', handleResize);
          document.addEventListener('mouseup', stopResize);
          document.body.classList.add('resizing');
          window.classList.add('resizing');
          
          // Prevent text selection during resize
          e.preventDefault();
        });
      });
  
      function stopResize() {
        isResizing = false;
        document.removeEventListener('mousemove', handleResize);
        document.removeEventListener('mouseup', stopResize);
        document.body.classList.remove('resizing');
        window.classList.remove('resizing');
        
        // Final check to ensure window is properly constrained
        constrainWindowPosition(window);
        
        // Reset status bar text
        window.querySelector('.window-status-bar').textContent = `${window.querySelector('.window-title').textContent} - Ready`;
      }
      
      // Handle window repositioning when viewport changes (e.g., orientation change)
      window.addEventListener('resize', () => {
        if (window.classList.contains('fullscreen')) {
          window.style.width = '100%';
          window.style.height = `${getViewportDimensions().height}px`;
        } else {
          constrainWindowPosition(window);
        }
      });
    }
  
    window.style.display = 'block';
    makeWindowActive(window);
    
    // Add opening animation
    window.classList.add('opening');
    setTimeout(() => {
      window.classList.remove('opening');
    }, 150);
  };
  
  // Add window resize event listener to handle viewport changes
  window.addEventListener('resize', () => {
    const viewport = getViewportDimensions();
    document.querySelectorAll('.window').forEach(window => {
      if (window.classList.contains('fullscreen')) {
        window.style.width = '100%';
        window.style.height = `${viewport.height}px`;
      } else {
        constrainWindowPosition(window);
      }
    });
  });

  desktopIcons.forEach(icon => {
    icon.addEventListener('dblclick', () => {
        const windowId = icon.dataset.window;
        const title = icon.querySelector('span').textContent;
        let contentUrl = windowId.replace('-window', '') + '.html';
        
        openWindow(windowId, title, contentUrl);
    });
  });

  // Handle click events on taskbar items
  taskbarOpened.addEventListener('click', (event) => {
    if (event.target.classList.contains('window-title') || 
        event.target.parentElement.classList.contains('window-title')) {
      const clickedItem = event.target.classList.contains('window-title') ? 
                         event.target : 
                         event.target.parentElement;
      
      const windowId = clickedItem.id.replace('taskbar-', '');
      const window = document.getElementById(windowId);
      if (window) {
        if (window.style.display === 'none') {
          window.style.display = 'block';
          makeWindowActive(window);
          clickedItem.classList.remove('minimized');
        } else if (window.classList.contains('active-window')) {
          // Minimize if clicked again when active
          window.style.display = 'none';
          clickedItem.classList.add('minimized');
        } else {
          makeWindowActive(window);
        }
      }
    }
  });

  // Update date and time
  const updateDateTime = () => {
    const now = new Date();
    const options = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    const dateTimeString = now.toLocaleDateString('en-US', options);
    document.querySelector('.taskbar-footer').textContent = dateTimeString;
  };

  updateDateTime();
  setInterval(updateDateTime, 60000); // Update every minute

  // Listen for messages from iframes
  window.addEventListener('message', (event) => {
    if (event.data && event.data.action === 'openWindow') {
      const { windowId, title, contentUrl } = event.data;
      openWindow(windowId, title, contentUrl);
    }
  });
});