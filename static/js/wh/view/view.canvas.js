/**
 * 2D view.
 *
 * CanvasView draws the graphics for all processors.
 * DynamicCanvas shows all elements that update each requestAnimationFrame.
 * StaticCanvas shows all elements that update only infrequently.
 * 
 * Each processor has its own view.
 * When a change happens to a processor that 
 * requires the static canvas to be redrawn:
 * - The processor's view receives a callback from a changed parameter.
 * - The view redraws its static graphics on an off-screen canvas.
 * - The view sets a dirty flag on the canvasView (this).
 * - The canvasView receives the next draw request.
 * - It clears the staticCanvas.
 * - It draws each view's off-screen canvas on the staticCanvas.
 * - It clears the dirty flag.
 * 
 * @namespace WH
 */
window.WH = window.WH || {};

(function (ns) {
    
    function createCanvasView(specs) {
        var that,
            midiNetwork = specs.midiNetwork,
            staticCanvas,
            dynamicCanvas,
            staticCtx,
            dynamicCtx,
            canvasRect,
            views = [],
            numViews,
            isDirty = false,
            isTouchDevice = 'ontouchstart' in window || window.DocumentTouch && document instanceof DocumentTouch,
            doubleClickCounter = 0,
            doubleClickDelay = 300,
            doubleClickTimer,
            isDragging = false,
            draggedView,
            dragOffsetX,
            dragOffsetY,
            theme,
        
            /**
             * Type of events to use, touch or mouse
             * @type {String}
             */
            eventType = {
                start: isTouchDevice ? 'touchstart' : 'mousedown',
                end: isTouchDevice ? 'touchend' : 'mouseup',
                click: isTouchDevice ? 'touchend' : 'click',
                move: isTouchDevice ? 'touchmove' : 'mousemove',
            },
            
            init = function() {
                numViews = 0;
                staticCanvas = document.querySelector('.canvas-static');
                dynamicCanvas = document.querySelector('.canvas-dynamic');
                staticCtx = staticCanvas.getContext('2d');
                dynamicCtx = dynamicCanvas.getContext('2d');
                
                dynamicCanvas.addEventListener(eventType.click, onClick);
                dynamicCanvas.addEventListener(eventType.start, onTouchStart);
                dynamicCanvas.addEventListener(eventType.move, dragMove);
                dynamicCanvas.addEventListener(eventType.end, dragEnd);
                window.addEventListener('resize', onWindowResize, false);
                
                onWindowResize();
            },
            
            /**
             * Window resize event handler.
             */
            onWindowResize = function() {
                staticCanvas.width = window.innerWidth;
                staticCanvas.height = window.innerHeight;
                dynamicCanvas.width = window.innerWidth;
                dynamicCanvas.height = window.innerHeight;
                canvasRect = dynamicCanvas.getBoundingClientRect();
                markDirty();
            },
            
            /**
             * Separate click and doubleclick.
             * @see http://stackoverflow.com/questions/6330431/jquery-bind-double-click-and-single-click-separately
             */
            onClick = function(e) {
                // separate click from doubleclick
                doubleClickCounter ++;
                if (doubleClickCounter == 1) {
                    doubleClickTimer = setTimeout(function() {
                        doubleClickCounter = 0;
                        // implement single click behaviour here
                    }, doubleClickDelay);
                } else {
                    clearTimeout(doubleClickTimer);
                    doubleClickCounter = 0;
                    // implement double click behaviour here
                    onDoubleClick(e);
                }
            },
            
            /**
             * Handler for the custom doubleclick event detection.
             * Create a new pattern at the location of the doubleclick.
             */
            onDoubleClick = function(e) {
                // create a new processor
                midiNetwork.createProcessor({
                    type: 'epg',
                    position2d: {
                        x: e.clientX - canvasRect.left + window.scrollX,
                        y: e.clientY - canvasRect.top + window.scrollY
                    }
                });
            },
            
            /**
             * Select the object under the mouse.
             * Start dragging the object.
             */
            onTouchStart = function(e) {
                // find view under mouse, search from new to old
                let view,
                    x = e.clientX - canvasRect.left + window.scrollX,
                    y = e.clientY - canvasRect.top + window.scrollY;
                for (var i = numViews - 1; i >= 0; i--) {
                    if (views[i].intersectsWithPoint(x, y)) {
                        view = views[i];
                        // select the found view's processor
                        midiNetwork.selectProcessor(view.getProcessor());
                        // start dragging the view's graphic
                        dragStart(x, y, view);
                        break;
                    }
                }
                
                // if there's no view under the mouse, drag the whole background
                if (!view) {
                    dragStart(x, y);
                }
            },
            
            /**
             * Initialise object dragging.
             */
            dragStart = function(x, y, view) {
                if (view) {
                    // drag a view
                    let position2d = view.getPosition2d();
                    draggedView = view;
                    dragOffsetX = x - position2d.x;
                    dragOffsetY = y - position2d.y;
                } else {
                    // drag background, so all views
                    dragOffsetX = x;
                    dragOffsetY = y;
                }
                isDragging = true;
            },
            
            /**
             * Drag a view.
             * @param  {Object} e Event.
             */
            dragMove = function(e) {
                e.preventDefault();
                if (isDragging) {
                    let canvasX = e.clientX - canvasRect.left + window.scrollX,
                        canvasY = e.clientY - canvasRect.top + window.scrollY
                    if (draggedView) {
                        // drag a view
                        draggedView.setPosition2d({
                            x: canvasX - dragOffsetX,
                            y: canvasY - dragOffsetY
                        });
                    } else {
                        // drag background, so all views
                        let view, 
                            position2d,
                            x = canvasX - dragOffsetX,
                            y = canvasY - dragOffsetY;
                        dragOffsetX = canvasX;
                        dragOffsetY = canvasY;
                        for (let i = 0; i < numViews; i++) {
                            view = views[i];
                            position2d = view.getPosition2d();
                            views[i].setPosition2d({
                                x: position2d.x + x,
                                y: position2d.y + y
                            });
                        }
                    }
                }
            },
            
            /**
             * Dragging 3D object ended.
             * @param  {Object} e Event.
             */
            dragEnd = function(e) {
                e.preventDefault();
                dragMove(e);
                draggedView = null;
                isDragging = false;
            },
            
            /**
             * Create canvas 2D object if it exists for the type.
             * @param  {Object} processor MIDI processor for which the 3D object will be a view.
             */
            createView = function(processor) {
                let specs = {
                    processor: processor,
                    staticCtx: staticCtx,
                    dynamicCtx: dynamicCtx,
                    canvasDirtyCallback: markDirty
                }
                switch (processor.getType()) {
                    case 'epg':
                        var view = ns.createCanvasEPGView(specs);
                        break;
                }
                views.push(view);
                numViews = views.length;
                
                // set theme on the new view
                if (theme && view.setTheme) {
                    view.setTheme(theme);
                }
            },
            
            /**
             * Delete canvas 2D object when the processor is deleted.
             * @param  {Object} processor MIDI processor for which the 3D object will be a view.
             */
            deleteView = function(processor) {
                let i = numViews;
                while (--i >= 0) {
                    if (views[i].getProcessor() === processor) {
                        views[i].terminate();
                        views.splice(i, 1);
                        numViews = views.length;
                        markDirty();
                        return;
                    }
                }
            },
            
            /**
             * Set the theme colours of the processor canvas views.
             * @param {Object} theme Theme settings object.
             */
            setTheme = function(newTheme) {
                theme = newTheme;
                for (let i = 0, n = views.length; i < n; i++) {
                    if (views[i].setTheme instanceof Function) {
                        views[i].setTheme(theme);
                    }
                }
                markDirty();
            },
            
            markDirty = function() {
                isDirty = true;
            },
            
            draw = function() {
                TWEEN.update();
                let i;
                if (isDirty) {
                    staticCtx.clearRect(0, 0, staticCanvas.width, staticCanvas.height);
                    for (i = 0; i < numViews; i++) {
                        views[i].addToStaticView(staticCtx);
                    }
                }
                
                for (i = 0; i < numViews; i++) {
                    views[i].clearFromDynamicView(dynamicCtx);
                }
                for (i = 0; i < numViews; i++) {
                    views[i].addToDynamicView(dynamicCtx);
                }
                isDirty = false;
            };
        
        that = specs.that || {};
        
        init();
        
        that.createView = createView;
        that.deleteView = deleteView;
        that.setTheme = setTheme;
        that.markDirty = markDirty;
        that.draw = draw;
        return that;
    }

    ns.createCanvasView = createCanvasView;

})(WH);
