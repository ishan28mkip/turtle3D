
var paletteBlocks = null;
var PROTOBLOCKSCALE = 1.0;
var PALETTELEFTMARGIN = 10;

// We don't include 'extras' since we want to be able to delete
// plugins from the extras palette.
var BUILTINPALETTES = ['turtle', 'pen', 'number', 'boolean', 'flow', 'blocks',
    'actions', 'media', 'sensors', 'myblocks',
];


// FIXME : Scaling
function maximumPaletteHeight(menuSize, scale) {
    var h = window.innerHeight - (2 * menuSize);
    return h - (h % STANDARDBLOCKHEIGHT) + (STANDARDBLOCKHEIGHT / 2);
}

function paletteBlockButtonPush(name, arg) {
    console.log('paletteBlockButtonPush: ' + name + ' ' + arg);
    blk = paletteBlocks.makeBlock(name, arg);
    return blk;
}


function Palettes(canvas, refreshCanvas, stage, cellSize, refreshCanvas, trashcan) {
    this.canvas = canvas;
    this.refreshCanvas = refreshCanvas;
    this.stage = stage;
    this.cellSize = cellSize;
    this.halfCellSize = Math.floor(cellSize / 2);
    this.scrollDiff = 0;
    this.refreshCanvas = refreshCanvas;
    this.originalSize = 55; // this is the original svg size
    this.trashcan = trashcan;
    this.margin = 10;
    // The collection of palettes.
    this.dict = {};
    this.buttons = {}; // The toolbar button for each palette.

    this.visible = true;
    this.scale = 1.0;

    this.x = -window.innerWidth/2 + this.margin; //10 pixel offset is given from the left corner
    this.y = threeCoorY(this.cellSize + this.halfCellSize);

    this.current = 'turtle';

    this.container = new THREE.Group();
    this.stage.add(this.container);

    this.paletteButtonContainer = new THREE.Group();
    // Snap to pixel
    this.container.add(this.paletteButtonContainer);
    // Stores the maximum height palette can take
    this.maxPaletteHeight = maximumPaletteHeight(cellSize,this.scale);

    this.setScale = function(scale) {
        this.scale = scale;
        this.maxPaletteHeight = maximumPaletteHeight(this.cellSize,scale);
        for (var i in this.dict) {
            this.dict[i].resizeEvent();
        }
    }

    // We need access to the macro dictionary because we load them.
    this.setMacroDictionary = function(obj) {
        this.macroDict = obj;
    }

    // FIXME
    this.menuScrollEvent = function(direction, scrollSpeed) {
        var keys = Object.keys(this.buttons);

        var diff = direction * scrollSpeed;
        if (direction < 0 && this.buttons[keys[0]].position.y + diff < threeCoorY(this.cellSize * 1.5)) {
            return;
        }
        // if (direction > 0 && this.buttons[last(keys)].position.y + diff > windowHeight() / this.scale - this.cellSize ) {
        //     return;
        // }
        // TODO : When Scaling is fixed put back the above condition
        if (direction > 0 && this.buttons[last(keys)].position.y - diff > threeCoorY(windowHeight() - this.cellSize )) {
            return;
        }

        this.scrollDiff += diff;
        for (var name in this.buttons) {
            this.buttons[name].position.y += diff;
            this.buttons[name].visible = true;
        }
        this.refreshCanvas(1);
    }


    this.makePalettes = function() {
        // First, an icon/button for each palette
        for (var name in this.dict) {
            if (name in this.buttons) {
                this.dict[name].updateMenu(true);
            } else {
                this.buttons[name] = new THREE.Group();
                // TODO : Snap to pixel
                this.paletteButtonContainer.add(this.buttons[name]);

                this.buttons[name].position.setX(this.x + this.halfCellSize)
                this.buttons[name].position.setY(this.y + this.scrollDiff);

                this.y -= this.cellSize;
                var me = this;

                var scale;
                if(this.cellSize != this.originalSize){
                    scale = this.cellSize / this.originalSize;
                }
                else{
                    scale = 1;
                }

                function processButtonIcon(me, name, bitmap, extras) {
                    me.buttons[name].add(bitmap);


                    var circleRadius = me.halfCellSize;
                    var circleShape = new THREE.Shape();
                    circleShape.moveTo( 0, circleRadius );
                    circleShape.quadraticCurveTo( circleRadius, circleRadius, circleRadius, 0 );
                    circleShape.quadraticCurveTo( circleRadius, -circleRadius, 0, -circleRadius );
                    circleShape.quadraticCurveTo( -circleRadius, -circleRadius, -circleRadius, 0 );
                    circleShape.quadraticCurveTo( -circleRadius, circleRadius, 0, circleRadius );
                    var circleGeometry = new THREE.ShapeGeometry( circleShape );
                    var circleMesh = new THREE.Mesh( circleGeometry, new THREE.MeshBasicMaterial( { color: 0x333333 } ) ) ; 
                    me.buttons[name].add(circleMesh);
                    circleMesh.material.opacity = 0.6;
                    circleMesh.visible = false;

                    me.buttons[name].hitmesh = circleMesh;

                    me.refreshCanvas(1);

                    // FIXME : Scaling
                    var paletteWidth = MENUWIDTH + (me.dict[name].columns * 160);
                    me.dict[name].paletteWidth = paletteWidth;

                    me.dict[name].makeMenu(false);
                    me.dict[name].moveMenu(threeCoorX(me.cellSize + me.margin*2) + paletteWidth/2 + me.cellSize / 2, threeCoorY(me.cellSize + STANDARDBLOCKHEIGHT / 2));
                    me.dict[name].updateMenu(false);

                    loadPaletteButtonHandler(me, name);
                }
                // FIXME : Why are button icons becoming jagged when scale is set to 1, till 1.05 the lines are jagged and 1.06 above become fixed
                makePaletteBitmap(me, PALETTEICONS[name], name, processButtonIcon, null, scale * 1.06);
            }
        }
    }

    this.showMenus = function() {
        // Show the menu buttons, but not the palettes.
        for (var name in this.buttons) {
            this.buttons[name].visible = true;
        }
        for (var name in this.dict) {
            // this.dict[name].showMenu(true);
        }
        this.refreshCanvas(1);
    }

    this.hideMenus = function() {
        // Hide the menu buttons and the palettes themselves.
        for (var name in this.buttons) {
            this.buttons[name].visible = false;
        }
        for (var name in this.dict) {
            this.dict[name].hideMenu(true);
        }
        this.refreshCanvas(1);
    }

    this.getInfo = function() {
        for (var key in this.dict) {
            console.log(this.dict[key].getInfo());
        }
    }

    this.updatePalettes = function(showPalette) {
        this.makePalettes();
        if (showPalette) {
            var myPalettes = this;
            setTimeout(function() {
                myPalettes.dict[showPalette].showMenu();
                myPalettes.dict[showPalette].showMenuItems();
                myPalettes.refreshCanvas(1);
            }, 250);
        } else {
            this.refreshCanvas(1);
        }
    }

    this.hide = function() {
        this.hideMenus();
        this.visible = false;
    }

    this.show = function() {
        this.showMenus();
        this.visible = true;
    }

    this.setBlocks = function(blocks) {
        paletteBlocks = blocks;
    }

    this.add = function(name) {
        this.dict[name] = new Palette(this, name);
        return this;
    }

    // FIXME
    this.remove = function(name) {
        // if (!(name in this.buttons)) {
        //     console.log('Palette.remove: Cannot find palette ' + name);
        //     return;
        // }
        // this.buttons[name].removeAllChildren();
        // var btnKeys = Object.keys(this.dict);
        // for (var btnKey = btnKeys.indexOf(name) + 1; btnKey < btnKeys.length; btnKey++) {
        //     this.buttons[btnKeys[btnKey]].y -= this.cellSize;
        // }
        // delete this.buttons[name];
        // delete this.dict[name];
        // this.y -= this.cellSize;
        // this.makePalettes();
    }
    // FIXME
    this.findPalette = function(x, y) {
        // for (var name in this.dict) {
        //     var px = this.dict[name].menuContainer.x;
        //     var py = this.dict[name].menuContainer.y;
        //     var height = Math.min(maximumPaletteHeight(this.cellSize, this.scale), this.dict[name].y);
        //     if (this.dict[name].menuContainer.visible && px < x &&
        //         x < px + MENUWIDTH && py < y && y < py + height) {
        //         return this.dict[name];
        //     }
        // }
        // return null;
    }
    return this;
}


// Palette Button event handlers
// Fix these functions quickly
function loadPaletteButtonHandler(palettes, name) {
    var locked = false;
    var scrolling = false;

    palettes.buttons[name].on('mouseover',function(event){
        event.target.hitmesh.visible = true;
        // event.target.hitmesh.material.opacity = 0.6;
        palettes.refreshCanvas(1);
    });

    palettes.buttons[name].on('mouseout',function(event){
        event.target.hitmesh.visible = false;
        palettes.refreshCanvas(1);
    });

    palettes.buttons[name].on('mousedown', function(event) {
        scrolling = true;
        lastY = event.clientY;
    });

    palettes.buttons[name].on('pressmove', function(event) {
        if (!scrolling) {
            return;
        }
        diff = event.clientY - lastY;
        palettes.menuScrollEvent(diff, 10);
        lastY = event.clientY;
    });

    palettes.buttons[name].on('pressup', function(event) {
        scrolling = false;
    }, null, true); // once = true

    // A palette button opens or closes a palette.
    // TODO : Add this highlight function back later
    // var circles = {};
    // palettes.buttons[name].on('mouseover', function(event) {
    //     var r = palettes.cellSize / 2;
    //     circles = showMaterialHighlight(
    //         palettes.buttons[name].x + r, palettes.buttons[name].y + r, r,
    //         event, palettes.scale, palettes.stage);
    // });

    // palettes.buttons[name].on('pressup', function(event) {
    //     hideMaterialHighlight(circles, palettes.stage);
    // });

    // palettes.buttons[name].on('mouseout', function(event) {
    //     hideMaterialHighlight(circles, palettes.stage);
    // });

    palettes.buttons[name].on('click', function(event) {
        if (locked) {
            return;
        }
        locked = true;
        setTimeout(function() {
            locked = false;
        }, 500);
        for (var i in palettes.dict) {
            if (palettes.dict[i] == palettes.dict[name]) {
                palettes.dict[name].showMenu(true);
                palettes.dict[name].showMenuItems(true);
            } else {
                if (palettes.dict[i].visible) {
                    palettes.dict[i].hideMenu(true);
                    palettes.dict[i].hideMenuItems(false);
                }
            }
        }
        palettes.refreshCanvas(1);
    });
}

// Define objects for individual palettes.
function Palette(palettes, name) {
    this.palettes = palettes;
    this.name = name;
    this.visible = false;
    // Containes the complete Palette
    this.paletteContainer = new THREE.Group();
    palettes.container.add(this.paletteContainer);

    // Holds the palette header and side buttons
    this.menuContainer = null;
    this.pageButtonContainer = new THREE.Group();
    this.paletteContainer.add(this.pageButtonContainer);
    
    // Holds the protoblocks, background, Page Number and palettePages
    this.blockContainer = new THREE.Group();
    palettes.container.add(this.blockContainer);
    this.palettePages = [];
    // Used to construct the palettes
    this.currentPage = null;
    // Used to determine the page user is on
    this.onPage = null;

    this.protoList = [];
    this.protoContainers = {};
    this.background = null;

    this.scrollDiff = 0

    this.y = 0;
    this.size = 0;
    this.padding = 5;
    this.columns = 0;
    this.draggingProtoBlock = false;
    this.mouseHandled = false;

    this.leftButton = null;
    this.rightButton = null;
    this.FadedLeftButton = null;
    this.FadedRightButton = null;

    this.count = 0;

    this.makeMenu = function(createHeader) {
        if (this.menuContainer == null) {
            this.menuContainer = new THREE.Group();
            // this.menuContainer.snapToPixelEnabled = true; //TODO how to enable pixel snapping in three.js
        }
        if (!createHeader) {
            return;
        };
        var paletteWidth = MENUWIDTH + (this.columns * 160);

        var obj;
        for (var i = this.menuContainer.children.length - 1; i >= 0 ; i -- ) {
            obj = this.menuContainer.children[ i ];
            this.menuContainer.remove(obj);
        }

        // Create the menu button
        function processHeader(palette, name, bitmap, extras) {
            palette.menuContainer.add(bitmap);
            palette.menuContainer.processHeader = {};
            palette.menuContainer.processHeader.width = bitmap.imgWidth;
            palette.menuContainer.processHeader.height = bitmap.imgHeight;
            palette.menuContainer.processHeader.name = name;
            palette.menuContainer.visible = false;
            bitmap.position.setZ(2);
            
            palette.menuContainer.hitmesh = bitmap;

            function processButtonIcon(palette, name, bitmap, extras) {
                palette.menuContainer.add(bitmap);
                palette.palettes.container.add(palette.menuContainer);
                bitmap.position.set(-palette.menuContainer.processHeader.width/2 + bitmap.imgWidth*0.8/2 + palette.padding ,0,2);
                bitmap.scale.set(0.8,0.8,1);


                function processCloseIcon(palette, name, bitmap, extras) {
                    bitmap.scale.set(0.7,0.7,0.7);
                    palette.menuContainer.add(bitmap);
                    bitmap.position.setX(palette.menuContainer.processHeader.width/2 - bitmap.imgWidth*0.7/2 - palette.padding);
                    bitmap.position.setY(0);
                    bitmap.position.setZ(2);

                    // TODO fix this
                    if (!palette.mouseHandled) {
                        loadPaletteMenuHandler(palette);
                        palette.mouseHandled = true;
                    }

                    function processUpIcon(palette, name, bitmap, extras) {
                        palette.palettes.stage.add(bitmap);
                        bitmap.position.setX(palette.menuContainer.position.x + paletteWidth/2 + palette.palettes.cellSize/2);
                        bitmap.position.setY(palette.menuContainer.position.y - STANDARDBLOCKHEIGHT);
                        bitmap.scale.setX(0.7);
                        bitmap.scale.setY(0.7);

                        bitmap.visible = false;
                        palette.upButton = bitmap;

                        palette.upButton.on('click', function(event) {
                            palette.scrollEvent(STANDARDBLOCKHEIGHT, 10); //Add next palette page handler here
                        });

                        function processDownIcon(palette, name, bitmap, extras) {
                            // bitmap.scaleX = bitmap.scaleY = bitmap.scale = 0.7; //TODO : Add scaling
                            palette.palettes.stage.add(bitmap);
                            bitmap.position.setX(palette.menuContainer.position.x + paletteWidth/2 + palette.palettes.cellSize/2);
                            bitmap.position.setY(palette.getDownButtonY());
                            bitmap.scale.setX(0.7);
                            bitmap.scale.setY(0.7); 
                            
                            bitmap.visible = false;
                            palette.downButton = bitmap;

                            palette.downButton.on('click', function(event) {
                                palette.scrollEvent(-STANDARDBLOCKHEIGHT, 10); //Add next palette page handler here
                            });
                        } 
                        makePaletteBitmap(palette, DOWNICON, name, processDownIcon, null);
                    function makeFadedDownIcon(palette, name, bitmap, extras) {
                            palette.palettes.stage.add(bitmap);
                            bitmap.position.setX(palette.menuContainer.position.x + paletteWidth/2 + palette.palettes.cellSize/2);
                            bitmap.position.setY(palette.getDownButtonY());
                            bitmap.scale.setX(0.7);
                            bitmap.scale.setY(0.7); 

                            bitmap.visible = false;
                            palette.FadedDownButton = bitmap;
                        } 
                        makePaletteBitmap(palette, FADEDDOWNICON, name, makeFadedDownIcon, null);
                        function makeFadedUpIcon(palette, name, bitmap, extras) {
                            palette.palettes.stage.add(bitmap);
                            bitmap.position.setX(palette.menuContainer.position.x + paletteWidth/2 + palette.palettes.cellSize/2);
                            bitmap.position.setY(palette.menuContainer.position.y - STANDARDBLOCKHEIGHT);
                            bitmap.scale.setX(0.7);
                            bitmap.scale.setY(0.7);

                            bitmap.visible = false;
                            palette.FadedUpButton = bitmap;
                        } 
                        makePaletteBitmap(palette, FADEDUPICON, name, makeFadedUpIcon, null);
                    } 
                    makePaletteBitmap(palette, UPICON, name, processUpIcon, null);
                }
                makePaletteBitmap(palette, CLOSEICON, name, processCloseIcon, null);
            }
            makePaletteBitmap(palette, PALETTEICONS[name], name, processButtonIcon, null);
        }
        makePaletteBitmap(this, PALETTEHEADER.replace('fill_color', '#282828').replace('palette_label', _(this.name)).replace(/header_width/g, paletteWidth), this.name, processHeader, null);
    }

    this.getDownButtonY = function () {
        var h = this.y;
        var max = maxPaletteHeight(this.palettes.cellSize, this.palettes.scale);
        if (mouseCoorY(this.y) > max) { //TODO : See where is the this.y value being edited
            h = max;
        }
        return this.menuContainer.position.y - h + STANDARDBLOCKHEIGHT * 2 ;
    }

    this.resizeEvent = function() {
        this.updateBackground();

        if (this.downButton !== null) {
            this.downButton.y = this.getDownButtonY();
        }
    }


    this.updateBackground = function() {
        if (this.menuContainer === null) {
            return;
        }

        if (this.background !== null) {
            var obj;
            removeBackgroundEvents(this);
            for (var i = this.background.children.length - 1; i >= 0 ; i -- ) {
                obj = this.background.children[ i ];
                this.background.remove(obj);
            }
        } else {
            this.background = new THREE.Group();
            // this.background.snapToPixelEnabled = true;
            this.background.visible = false;
            this.palettes.stage.add(this.background);
        }

        var h = Math.min(maxPaletteHeight(this.palettes.cellSize, this.palettes.scale), this.y);
        var w = MENUWIDTH;

        var rectShape = new THREE.Shape();
        rectShape.moveTo( -w/2, h/2 );
        rectShape.lineTo( w/2, h/2 );
        rectShape.lineTo( w/2, -h/2 );
        rectShape.lineTo( -w/2, -h/2 );
        rectShape.lineTo( -w/2, h/2 );

        var rectGeom = new THREE.ShapeGeometry( rectShape );
        var rectMesh = new THREE.Mesh( rectGeom, new THREE.MeshBasicMaterial( { color: 0x888888 } ) ) ; 

        this.background.add(rectMesh);

        this.background.hitmesh = rectMesh;

        setupBackgroundEvents(this);

        this.background.position.setX(this.menuContainer.position.x);
        this.background.position.setY(this.menuContainer.position.y - STANDARDBLOCKHEIGHT/2 -h/2);
    }

    this.updateMenu = function(hide) {
        if (this.menuContainer == null) {
            this.makeMenu(false);
        } else {
            // Hide the menu while we update.
            if (hide) {
                this.hide();
            }
        }
        this.y = 0;

        for (var blk in this.protoList) {
            // Don't show hidden blocks on the menus

            if (this.protoList[blk].hidden) {
                if(blk == this.protoList.length - 1){
                    this.updateBackground();
                }
                continue;
            }

            // Create a proto block for each palette entry.
            var blkname = this.protoList[blk].name;
            var modname = blkname;

            switch (blkname) {
                // Use the name of the action in the label
                case 'storein':
                    modname = 'store in ' + this.protoList[blk].defaults[0];
                    var arg = this.protoList[blk].defaults[0];
                    break;
                case 'box':
                    modname = this.protoList[blk].defaults[0];
                    var arg = this.protoList[blk].defaults[0];
                    break;
                case 'namedbox':
                    if (this.protoList[blk].defaults[0] == undefined) {
                        modname = 'namedbox';
                        var arg = _('box');
                    } else {
                        modname = this.protoList[blk].defaults[0];
                        var arg = this.protoList[blk].defaults[0];
                    }
                    break;
                case 'nameddo':
                    if (this.protoList[blk].defaults[0] == undefined) {
                        modname = 'nameddo';
                        var arg = _('action');
                    } else {
                        modname = this.protoList[blk].defaults[0];
                        var arg = this.protoList[blk].defaults[0];
                    }
                    break;
            }

            function calculateHeight(palette, blkname) {
                var size = palette.protoList[blk].size;
                
                if (['if', 'while', 'until', 'ifthenelse', 'waitFor'].indexOf(modname) != -1) {
                    // Some blocks are not shown full-size on the palette.
                    size = 1;
                } else if (['repeat', 'forever'].indexOf(blkname) != -1) {
                    size += 1;
                } else if (['media', 'camera', 'video'].indexOf(blkname) != -1) {
                    size += 1;
                } else if (palette.protoList[blk].image) {
                    size += 1;
                } else if (['action', 'start'].indexOf(blkname) != -1) {
                    size += 1;
                } else if (['and', 'or'].indexOf(blkname) != -1) {
                    size += 1;
                }
                // TODO : Fix this height expression in accordance with three.js
                var height = STANDARDBLOCKHEIGHT * size;
                // * palette.protoList[blk].scale / 2.0; add scaling later on
                return height;
            }

            if (!this.protoContainers[modname]) {
                // create graphics for the palette entry for this block
                this.protoContainers[modname] = new THREE.Group();

                // this.protoContainers[modname].snapToPixelEnabled = true; //TODO : How to snap to pixel?

                this.protoContainers[modname].position.setX(this.menuContainer.position.x - this.paletteWidth/2 + PALETTELEFTMARGIN);
                this.protoContainers[modname].position.setY(this.menuContainer.position.y - this.y - STANDARDBLOCKHEIGHT/2);

                this.palettes.stage.add(this.protoContainers[modname]);
                this.protoContainers[modname].visible = false;
                this.protoContainers[modname].name = modname;

                var height = calculateHeight(this, blkname);
                this.size += Math.ceil(height * PROTOBLOCKSCALE);
                this.y += Math.ceil(height * PROTOBLOCKSCALE);

                if(blk == this.protoList.length - 1){
                    this.updateBackground();
                }

                function processFiller(palette, modname, bitmap, extras) {
                    // TODO : Set bitmap position 
                    var blkname = extras[0];
                    var blk = extras[1];
                    var currY = extras[2];
                    var myBlock = paletteBlocks.protoBlockDict[blkname];
                    if (myBlock == null) {
                        console.log('Could not find block ' + blkname);
                        return;
                    }

                    var block_label = '';

                    switch (myBlock.name) {
                        case 'text':
                            block_label = _('text');
                            break;
                        case 'number':
                            block_label = '100';
                            break;
                        case 'less':
                        case 'greater':
                        case 'equal':
                            // Label should be inside _() when defined.
                            block_label = myBlock.staticLabels[0];
                            break;
                        default:
                            if (blkname != modname) {
                                // Override label for do, storein, and box
                                block_label = palette.protoList[blk].defaults[0];
                            } else if (myBlock.staticLabels.length > 0) {
                                block_label = myBlock.staticLabels[0];
                                if (block_label == '') {
                                    if (blkname == 'loadFile') {
                                        block_label = _('open file')
                                    } else {
                                        block_label = blkname;
                                    }
                                }
                            } else {
                                block_label = blkname;
                            }
                    }

                    // Don't display the label on image blocks.
                    if (myBlock.image) {
                        block_label = '';
                    }

                    switch (myBlock.name) {
                        // case 'box':
                        case 'namedbox':
                            // so the label will fit
                            var svg = new SVG();
                            svg.init();
                            svg.setScale(myBlock.scale);
                            svg.setExpand(60, 0, 0, 0);
                            svg.setOutie(true);
                            var artwork = svg.basicBox();
                            var docks = svg.docks;
                            break;
                        case 'nameddo':
                            // so the label will fit
                            var svg = new SVG();
                            svg.init();
                            svg.setScale(myBlock.scale);
                            svg.setExpand(30, 0, 0, 0);
                            var artwork = svg.basicBlock();
                            var docks = svg.docks;
                            break;
                        case 'if':
                        case 'until':
                        case 'while':
                        case 'waitFor':
                            // so the block will fit
                            var svg = new SVG();
                            svg.init();
                            svg.setScale(myBlock.scale);
                            svg.setTab(true);
                            svg.setSlot(true);
                            var artwork = svg.basicBlock();
                            var docks = svg.docks;
                            break;
                        case 'ifthenelse':
                            // so the block will fit
                            var svg = new SVG();
                            svg.init();
                            svg.setScale(myBlock.scale);
                            svg.setTab(true);
                            svg.setSlot(true);
                            var artwork = svg.basicBlock();
                            var docks = svg.docks;
                            block_label = myBlock.staticLabels[0] + ' ' + myBlock.staticLabels[2];
                            break;
                        default:
                            var obj = myBlock.generator();
                            var artwork = obj[0];
                            var docks = obj[1];
                            break;
                    }

                    // // TODO : Fix this hitarea
                    // function calculateBounds(palette, blk, modname) {
                    //     var bounds = palette.protoContainers[modname].get2DBounds();
                    //     // palette.protoContainers[modname].cache(bounds.x, bounds.y, Math.ceil(bounds.width), Math.ceil(bounds.height)); // PE : Why is caching done?

                    //     // TODO : Create the hitarea
                    //     // var hitArea = new createjs.Shape();
                    //     // // Trim the hitArea height slightly to make
                    //     // // it easier to select single-height blocks
                    //     // // below double-height blocks.
                    //     // hitArea.graphics.beginFill('#FFF').drawRect(0, 0, Math.ceil(bounds.width), Math.ceil(bounds.height * 0.75));
                    //     // palette.protoContainers[modname].hitArea = hitArea;

                        
                    //     palette.palettes.refreshCanvas(1);
                    // }

                    function processBitmap(palette, modname, bitmap, args) {
                        var myBlock = args[0];
                        var blk = args[1];
                        var currY = args[2];
                        
                        palette.protoContainers[modname].add(bitmap);
                        bitmap.position.setX(bitmap.imgWidth/2);
                        bitmap.position.setY(-bitmap.imgHeight/2);
                        bitmap.position.setZ(2);

                        bitmap.scale.setX(PROTOBLOCKSCALE);
                        bitmap.scale.setY(PROTOBLOCKSCALE);
                        bitmap.scaleStore = PROTOBLOCKSCALE;

                        // TODO : Fix theses width and height to include scaling
                        var width =  bitmap.imgWidth - 15;
                        var paletteRelative = palette.menuContainer.position.y - currY - STANDARDBLOCKHEIGHT/2;
                        var height = palette.protoContainers[modname].position.y - paletteRelative;

                        var hexColor = '#'+Math.floor(Math.random()*16777215).toString(16);

                        // TODO : Fix the scaling in this hitmesh 
                        var rectShape = new THREE.Shape();
                        rectShape.moveTo( 0,0 );
                        rectShape.lineTo( 0, -height );
                        rectShape.lineTo( width, -height );
                        rectShape.lineTo( width, 0 );
                        rectShape.lineTo( 0, 0 );

                        var rectGeom = new THREE.ShapeGeometry( rectShape );
                        var rectMesh = new THREE.Mesh( rectGeom, new THREE.MeshBasicMaterial( { color: hexColor } ) ) ;

                        rectMesh.visible = false;
                        palette.protoContainers[modname].add(rectMesh);
                        
                        rectMesh.position.setZ(3);

                        palette.protoContainers[modname].hitmesh = rectMesh;

                        // Fix this function, continuity is lost and also implement this is the scroll event
                        // if(palette.protoContainers[modname].position.y - bitmap.imgHeight/2 < bounds.min.y)
                        // {
                        //     bitmap.visible = false;
                        // }

                        if (myBlock.image) {
                            var image = new Image(); 
                            image.onload = function() {
                                var canvas = document.createElement('canvas');
                                canvas.width = image.width;
                                canvas.height = image.height;
                                var context = canvas.getContext('2d');
                                context.drawImage(image, 0, 0);
                                var texture = new THREE.Texture(canvas);
                                texture.needsUpdate = true;
                                texture.minFilter = THREE.NearestFilter; 
                                var material = new THREE.MeshBasicMaterial( {map: texture, transparent : true, depthWrite : false} );
                                var bitmap = new THREE.Mesh(new THREE.PlaneBufferGeometry(image.width, image.height),material);
                                bitmap.name = modname;
                                bitmap.imageWidth = image.width;
                                bitmap.imageHeight = image.height;
                                if(image.width > image.height){
                                    // FIXME : Fix the scaling issues together
                                    bitmap.scale.setX(MEDIASAFEAREA[2] / image.width);
                                    bitmap.scale.setY(MEDIASAFEAREA[2] / image.width );
                                    bitmap.scaleStore = (MEDIASAFEAREA[2] / image.width );
                                    // bitmap.scale.setX(MEDIASAFEAREA[2] / image.width * (myBlock.scale / 2));
                                    // bitmap.scale.setY(MEDIASAFEAREA[2] / image.width * (myBlock.scale / 2));
                                    // bitmap.scaleStore = (MEDIASAFEAREA[2] / image.width * (myBlock.scale / 2));
                                }

                                palette.protoContainers[modname].add(bitmap);
                                // FIXME : fix the image positions or just add these in the mesh
                                // bitmap.position.setX(MEDIASAFEAREA[0] * (myBlock.scale / 2));
                                // bitmap.position.setY(MEDIASAFEAREA[1] * (myBlock.scale / 2));

                                // bitmap.position.setX(MEDIASAFEAREA[0]);
                                // bitmap.position.setY(MEDIASAFEAREA[1]);
                                bitmap.position.setX(0);
                                bitmap.position.setY(0);
                                loadPaletteMenuItemHandler(palette, blk, modname); //Here the calculate bounds function call was there
                            }
                            image.src = myBlock.image;
                        } else {
                            loadPaletteMenuItemHandler(palette, blk, modname); //Here the calculate bounds function call was there
                        }
                    }

                    if (['do', 'nameddo', 'namedbox'].indexOf(myBlock.name) != -1) {
                        if (block_label.length > 8) {
                            block_label = block_label.substr(0, 7) + '...';
                        }
                    }

                    artwork = artwork.replace(/fill_color/g, PALETTEFILLCOLORS[myBlock.palette.name]).replace(/stroke_color/g, PALETTESTROKECOLORS[myBlock.palette.name]).replace('block_label', block_label);

                    while (myBlock.staticLabels.length < myBlock.args + 1) {
                        myBlock.staticLabels.push('');
                    }
                    for (var i = 1; i < myBlock.staticLabels.length; i++) {
                        artwork = artwork.replace('arg_label_' + i, myBlock.staticLabels[i]);
                    }
                    makePaletteBitmap(palette, artwork, modname, processBitmap, [myBlock, blk, currY]);
                }
                makePaletteBitmap(this, PALETTEFILLER.replace(/filler_height/g, height.toString()), modname, processFiller, [blkname, blk, this.y]);
            } else {
                var height = calculateHeight(this, blkname);
                this.y += Math.ceil(height * PROTOBLOCKSCALE);
            }

        }
        this.makeMenu(true);
    }

    this.moveMenu = function(x, y) {
        dx = x - this.menuContainer.position.x;
        dy = y - this.menuContainer.position.y;
        this.menuContainer.position.setX(x);
        this.menuContainer.position.setY(y);
        this.moveMenuItemsRelative(dx, dy);
    }

    this.moveMenuRelative = function(dx, dy) {
        var x = this.menuContainer.position.x;
        var y = this.menuContainer.position.y;
        this.menuContainer.position.setX(x + dx);
        this.menuContainer.position.setY(y + dy);
        this.moveMenuItemsRelative(dx, dy);
    }

    this.hide = function() {
        this.hideMenu();
    }

    this.show = function() {
        this.showMenu();

        for (var i in this.protoContainers) {
            this.protoContainers[i].visible = true;
        }
        if (this.background !== null) {
            this.background.visible = true;
        }
    }

    this.hideMenu = function(init) {
        if (this.menuContainer !== null) {
            this.menuContainer.visible = false;
            this.hideMenuItems(true);
        }
        this.moveMenu(threeCoorX(this.palettes.cellSize + this.palettes.margin*2) + this.paletteWidth/2 + this.palettes.cellSize / 2, threeCoorY(this.palettes.cellSize + STANDARDBLOCKHEIGHT / 2));
    }

    this.hideMenuItems = function(init) {
        this.visible = false;
        for (var i in this.protoContainers) {
            this.protoContainers[i].visible = false;
        }
        if (this.background !== null) {
            this.background.visible = false;
        }
        if(this.leftButton !== null){
            this.leftButton.visible = false;
            this.rightButton.visible = false;
            this.FadedLeftButton.visible = false;
            this.FadedRightButton.visible = false;
        }
    }

    this.showMenu = function(init) {
        this.menuContainer.visible = true;
    }

    this.showMenuItems = function(init) {
        this.visible = true;

        if(init){
            this.onPage = 0;
        }

        this.onPage = (this.onPage === undefined) ? 0 : this.onPage;

        for (var i in this.palettePages[this.onPage].children) {
            this.palettePages[this.onPage].children[i].visible = true;
        }
        if (this.background !== null) {
            this.background.visible = true;
        }
        if(this.leftButton !== null){
            this.setPageButtons();
        }
    }

    this.moveMenuItems = function(x, y) {
        for (var i in this.protoContainers) {
            this.protoContainers[i].position.setX(x);
            this.protoContainers[i].position.setY(y);
        }
        if(this.background !== null){
            this.background.position.setX(x);
            this.background.position.setY(y);
        }
        if(this.leftButton !== null){
            this.pageButtonContainer.position.setX(x);
            this.pageButtonContainer.position.setY(y);
        }
    }

    this.moveMenuItemsRelative = function(dx, dy) {
        for (var i in this.protoContainers) {
            this.protoContainers[i].position.setX(this.protoContainers[i].position.x + dx);
            this.protoContainers[i].position.setY(this.protoContainers[i].position.y + dy);
        }
        if(this.background !== null){
            this.background.position.setX(this.background.position.x + dx);
            this.background.position.setY(this.background.position.y + dy);
        }
        if (this.leftButton !== null) {
            this.pageButtonContainer.position.setX(this.pageButtonContainer.position.x + dx);
            this.pageButtonContainer.position.setY(this.pageButtonContainer.position.y + dy);
        }
    }

    this.setPageButtons = function() {
        if( this.palettePages.length > 1 ){
            if(this.onPage === 0){
                this.leftButton.visible = false;
                this.rightButton.visible = true;
                this.FadedLeftButton.visible = true;
                this.FadedRightButton.visible = false;
            }
            else if(this.onPage > 0 && this.onPage < this.palettePages.length - 1){
                this.leftButton.visible = true;
                this.rightButton.visible = true;
                this.FadedLeftButton.visible = false;
                this.FadedRightButton.visible = false;
            }
            else if(this.onPage === this.palettePages.length - 1){
                this.leftButton.visible = true;
                this.rightButton.visible = false;
                this.FadedLeftButton.visible = false;
                this.FadedRightButton.visible = true;
            }
        }
        this.palettes.refreshCanvas(1);
    } 


    this.getInfo = function() {
        var returnString = this.name + ' palette:';
        for (var thisBlock in this.protoList) {
            returnString += ' ' + this.protoList[thisBlock].name;
        }
        return returnString;
    };

    this.add = function(protoblock) {
        if (this.protoList.indexOf(protoblock) == -1) {
            this.protoList.push(protoblock);
        }
        return this;
    }
    return this;
};


var blocks = undefined;

function initPalettes(canvas, refreshCanvas, stage, cellSize, trashcan, b) {
    // Instantiate the palettes object on first load.
    var palettes = new Palettes(canvas, refreshCanvas, stage, cellSize, refreshCanvas, trashcan).
    add('turtle').
    add('pen').
    add('number').
    add('boolean').
    add('flow').
    add('blocks').
    add('actions').
    add('media').
    add('sensors').
    add('extras');
    palettes.makePalettes();
    blocks = b;

    // Give the palettes time to load.
    setTimeout(function() {
        palettes.show();
    }, 2000);
    return palettes;
}


var MODEUNSURE = 0;
var MODEDRAG = 1;
var MODESCROLL = 2;
var DECIDEDISTANCE = 20;

// FIXME : background events once the background is in place
function setupBackgroundEvents(palette) {
    // var scrolling = false;
    // var lastY;

    // palette.background.on('click',function(event){
    //     // console.log('background clicked');
    // });

    // palette.background.on('mousedown', function(event) {
    //     // console.log('background mousedown');
    //     scrolling = true;
    //     lastY = event.clientY;
    // });
    
//     palette.background.on('pressmove', function(event) {
//         if (!scrolling) {
//             return;
//         }
//         var diff = event.clientY - lastY;
//         palette.scrollEvent(diff, 10);
//         lastY = event.clientY;
//     });

//     palette.background.on('pressup', function(event) {
//         scrolling = false;
//     });
}

function removeBackgroundEvents(palette){
    palette.palettePages[palette.currentPage].background.off();
}


// Menu Item event handlers
function loadPaletteMenuItemHandler(palette, blk, blkname) {
    // A menu item is a protoblock that is used to create a new block.
    var locked = false;
    var moved = false;
    var saveX = palette.protoContainers[blkname].position.x;
    var saveY = palette.protoContainers[blkname].position.y;
    var bgScrolling = false;
    
    var startX;
    var startY;
    var lastY;
    var currX;
    var currY;
    var mode;

    function makeBlockFromPalette(blk, blkname, palette, callback) {
        if (locked) {
            return;
        }
        locked = true;
        setTimeout(function() {
            locked = false;
        }, 500);

        var arg = '__NOARG__';
        switch (palette.protoList[blk].name) {
            case 'do':
                blkname = 'do ' + palette.protoList[blk].defaults[0];
                var arg = palette.protoList[blk].defaults[0];
                break;
            case 'storein':
                // Use the name of the box in the label
                blkname = 'store in ' + palette.protoList[blk].defaults[0];
                var arg = palette.protoList[blk].defaults[0];
                break;
            case 'box':
                // Use the name of the box in the label
                blkname = palette.protoList[blk].defaults[0];
                var arg = palette.protoList[blk].defaults[0];
                break;
            case 'namedbox':
                // Use the name of the box in the label
                if (palette.protoList[blk].defaults[0] == undefined) {
                    blkname = 'namedbox';
                    var arg = _('box');
                } else {
                    blkname = palette.protoList[blk].defaults[0];
                    var arg = palette.protoList[blk].defaults[0];
                }
                break;
            case 'nameddo':
                // Use the name of the action in the label
                if (palette.protoList[blk].defaults[0] == undefined) {
                    blkname = 'nameddo';
                    var arg = _('action');
                } else {
                    blkname = palette.protoList[blk].defaults[0];
                    var arg = palette.protoList[blk].defaults[0];
                }
                break;
        }
        var newBlock = paletteBlockButtonPush(palette.protoList[blk].name, arg);
        callback(newBlock);
    }

    palette.protoContainers[blkname].on('mousedown', function(event) {
        var stage = palette.palettes.stage;
        // FIXME : Brings to top
        // // stage.setChildIndex(palette.protoContainers[blkname], stage.getNumChildren() - 1);
        // // palette.protoContainers[blkname].mask = null;

        moved = false;
        saveX = palette.protoContainers[blkname].position.x;
        saveY = palette.protoContainers[blkname].position.y; //What is current value of scrollDiff
        startX = currX = event.clientX;
        startY = currY = event.clientY;
        lastY = event.clientY;
        if (palette.draggingProtoBlock) {
            return;
        }
        if (locked) {
            return;
        }
        locked = true;
        setTimeout(function() {
            locked = false;
        }, 500);

        mode = MODEDRAG;
    });

    palette.protoContainers[blkname].on('pressmove', function(event) {
        if (mode === MODEDRAG) {
            moved = true;
            palette.draggingProtoBlock = true;
            var changeMouseX = event.clientX - currX;
            var changeMouseY = currY - event.clientY;
            // TODO : Fix for scaling effects
            palette.protoContainers[blkname].position.setX(palette.protoContainers[blkname].position.x + changeMouseX);
            palette.protoContainers[blkname].position.setY(palette.protoContainers[blkname].position.y + changeMouseY);
            currX = event.clientX;
            currY = event.clientY;
            palette.palettes.refreshCanvas(1);
            return;
        }

        // TODO : where are these distance and distance coordinates used.
        var xd = Math.abs(event.clientX - startX);
        var yd = Math.abs(event.clientY - startY);
        var diff = Math.sqrt(xd * xd + yd * yd);

    });

    palette.protoContainers[blkname].on('pressup', function(event) {
        if (moved) {
            moved = false;
            palette.draggingProtoBlock = false;
            // TODO : Understand how this macro is working and fix this
            if (palette.name == 'myblocks') {
                // If we are on the myblocks palette, it is a macro.
                var macroName = blkname.replace('macro_', '');

                // We need to copy the macro data so it is not overwritten.
                var obj = [];

                for (var b = 0; b < palette.palettes.macroDict[macroName].length; b++) {
                    var valueEntry = palette.palettes.macroDict[macroName][b][1];
                    var newValue = [];
                    if (typeof(valueEntry) == 'string') {
                        newValue = valueEntry;
                    } else if (typeof(valueEntry[1]) == 'string') {
                        if (valueEntry[0] == 'number') {
                            newValue = [valueEntry[0], Number(valueEntry[1])];
                        } else {
                            newValue = [valueEntry[0], valueEntry[1]];
                        }
                    } else if (typeof(valueEntry[1]) == 'number') {
                        if (valueEntry[0] == 'number') {
                            newValue = [valueEntry[0], valueEntry[1]];
                        } else {
                            newValue = [valueEntry[0], valueEntry[1].toString()];
                        }
                    } else {
                        if (valueEntry[0] == 'number') {
                            newValue = [valueEntry[0], Number(valueEntry[1]['value'])];
                        } else {
                            newValue = [valueEntry[0], {'value': valueEntry[1]['value']}];
                        }
                    }
                    var newBlock = [palette.palettes.macroDict[macroName][b][0],
                                    newValue,
                                    palette.palettes.macroDict[macroName][b][2],
                                    palette.palettes.macroDict[macroName][b][3],
                                    palette.palettes.macroDict[macroName][b][4]];
                    obj.push(newBlock);
                }

                // Set the position of the top block in the stack
                // before loading.
                obj[0][2] = palette.protoContainers[blkname].position.x;
                obj[0][3] = palette.protoContainers[blkname].position.y;
                console.log('loading macro ' + macroName);
                paletteBlocks.loadNewBlocks(obj);

                // Ensure collapse state of new stack is set properly.
                var thisBlock = paletteBlocks.blockList.length - 1;
                var topBlk = paletteBlocks.findTopBlock(thisBlock);
                setTimeout(function() {
                    paletteBlocks.blockList[topBlk].collapseToggle();
                }, 500);
            } else {
                // Create the block.
                function myCallback (newBlock) {
                    // Move the drag group under the cursor.
                    paletteBlocks.findDragGroup(newBlock);
                    for (var i in paletteBlocks.dragGroup) {
                        // paletteBlocks.moveBlockRelative(paletteBlocks.dragGroup[i], Math.round(event.clientX / palette.palettes.scale) - paletteBlocks.stage.x, Math.round(event.stageY / palette.palettes.scale) - paletteBlocks.stage.y);
                        // PE : Why is it divided by scale here?
                        paletteBlocks.moveBlockRelative(paletteBlocks.dragGroup[i], threeCoorX(event.clientX) - paletteBlocks.stage.position.x, threeCoorY(event.clientY) - paletteBlocks.stage.position.y);
                    }
                    // Dock with other blocks if needed
                    console.log('new block moved ' + newBlock);
                    blocks.blockMoved(newBlock);
                }

                var newBlock = makeBlockFromPalette(blk, blkname, palette, myCallback);
            }

            // Return protoblock we've been dragging back to the palette.
            palette.protoContainers[blkname].position.x = saveX;
            palette.protoContainers[blkname].position.y = saveY;
            palette.palettes.refreshCanvas(1);
        }
    });
}


// Palette Menu event handlers
function loadPaletteMenuHandler(palette) {
    // The palette menu is the container for the protoblocks. One
    // palette per palette button.

    var locked = false;
    var trashcan = palette.palettes.trashcan;
    var paletteWidth = MENUWIDTH + (palette.columns * 160);
    var offset;
    var px,py,dx,dy;

    palette.menuContainer.on('click', function(event) {
        // To code for the close button 
        //FIXME : Change the code to include scaling factor
        // if(Math.round(threeCoorX(event.clientX / palette.palettes.scale)) > palette.menuContainer.position.x + paletteWidth/2 - STANDARDBLOCKHEIGHT){

        if(Math.round(threeCoorX(event.clientX)) > palette.menuContainer.position.x + paletteWidth/2 - STANDARDBLOCKHEIGHT){
            palette.hide();
            palette.palettes.refreshCanvas(1);
            return;
        }

        if (locked) {
            return;
        }
        locked = true;
        setTimeout(function() {
            locked = false;
        }, 500);

        for (p in palette.palettes.dict) {
            if (palette.name != p) {
                if (palette.palettes.dict[p].visible) {
                    palette.palettes.dict[p].hideMenuItems(false);
                }
            }
        }

        if (palette.visible) {
            palette.hideMenuItems(false);
        } else {
            palette.showMenuItems(false);
        }
        palette.palettes.refreshCanvas(1);
    });

    palette.menuContainer.on('mousedown', function(event) {
        trashcan.show(); //show them all?
    });

    palette.menuContainer.on('mouseover',function(event){

    });

    palette.menuContainer.on('mouseout', function(event) {
        if (trashcan.overTrashcan(event.clientX / palette.palettes.scale, event.clientY / palette.palettes.scale)) {
            palette.hide();
            palette.palettes.refreshCanvas(1);
        }
        trashcan.hide();
    });

    palette.menuContainer.on('pressmove', function(event) {
        // TODO : When scaling is active throughout then put it here as well
        // just divide event.clientX and event.clientY with palette.palettes.scale         
        if(!px || !py){
            px = event.clientX;
            py = event.clientY;
            dx = 0;
            dy = 0;
        }
        else{
            dx = event.clientX - px;
            dy = py - event.clientY;
        }

        palette.menuContainer.position.setX(palette.menuContainer.position.x  + dx);
        palette.menuContainer.position.setY(palette.menuContainer.position.y  + dy);
        palette.palettes.refreshCanvas(1);

        px = event.clientX;
        py = event.clientY;


        // If we are over the trash, warn the user.
        // if (trashcan.overTrashcan(event.clientX / palette.palettes.scale, event.clientY / palette.palettes.scale)) {
        // FIXME : add this condition when scaling is activated
        if (trashcan.overTrashcan(event.clientX, event.clientY)) {
            trashcan.highlight();
        } else {
            trashcan.unhighlight();
        }
        // Hide the menu items while drag.
        // TODO : fix these functions
        palette.hideMenuItems(false);
        palette.moveMenuItemsRelative(dx, dy);
    });

    palette.menuContainer.on('pressup', function(event) {
        px = false;
        py = false;
        // FIXME : Add scaling factor here
        // if (trashcan.overTrashcan(event.clientX / palette.palettes.scale, event.clientY / palette.palettes.scale)) {
        if (trashcan.overTrashcan(event.clientX , event.clientY )) {
            palette.hide();
            palette.palettes.refreshCanvas(1);
            // Only delete plugin palettes.
            if (BUILTINPALETTES.indexOf(palette.name) === -1) {
                promptPaletteDelete(palette);
            } else if (palette.name == 'myblocks') {
                promptMacrosDelete(palette);
            }
        }
        trashcan.hide();
    });
}

// FIXME
function promptPaletteDelete(palette) {
    var msg = 'Do you want to remove all "%s" blocks from your project?'.replace('%s', palette.name)
    if (!confirm(msg)) {
        return;
    }

    console.log('removing palette ' + palette.name);
    palette.palettes.remove(palette.name);

    delete pluginObjs['PALETTEHIGHLIGHTCOLORS'][palette.name];
    delete pluginObjs['PALETTESTROKECOLORS'][palette.name];
    delete pluginObjs['PALETTEFILLCOLORS'][palette.name];
    delete pluginObjs['PALETTEPLUGINS'][palette.name];

    for (var i = 0; i < palette.protoList.length; i++) {
        var name = palette.protoList[i].name;
        delete pluginObjs['FLOWPLUGINS'][name];
        delete pluginObjs['ARGPLUGINS'][name];
        delete pluginObjs['BLOCKPLUGINS'][name];
    }
    localStorage.plugins = preparePluginExports({});
}

// FIXME
function promptMacrosDelete(palette) {
    var msg = 'Do you want to remove all the stacks from your custom palette?';
    if (!confirm(msg)) {
        return;
    }

    console.log('removing macros from ' + palette.name);
    for (var i = 0; i < palette.protoList.length; i++) {
        var name = palette.protoList[i].name;
        delete palette.protoContainers[name];
        palette.protoList.splice(i, 1);
    }
    palette.palettes.updatePalettes('myblocks');
    localStorage.macros = prepareMacroExports(null, null, {});
}


function makePaletteBitmap(palette, data, name, callback, extras, scale) {
    // Async creation of bitmap from SVG data
    // Works with Chrome, Safari, Firefox (untested on IE)
    scale = (scale === undefined) ? 1 : scale;

    var img = new Image();
        img.onload = function () {
            var canvas = document.createElement('canvas');
            canvas.width = img.width * scale;
            canvas.height = img.height * scale;
            var context = canvas.getContext('2d');
            context.drawImage(img, 0, 0, img.width * scale, img.height * scale);
            var texture = new THREE.Texture(canvas);
            texture.needsUpdate = true;
            texture.minFilter = THREE.NearestFilter; 
            var material = new THREE.MeshBasicMaterial( {map: texture} );
            material.transparent = true;
            material.depthWrite = false;

            var bitmap = new THREE.Mesh(new THREE.PlaneBufferGeometry(img.width * scale, img.height * scale),material);
            bitmap.name = name;
            bitmap.imgWidth = img.width * scale;
            bitmap.imgHeight = img.height * scale;
            bitmap.initialWidth = img.width;
            bitmap.initialHeight = img.height;
            callback(palette, name, bitmap, extras);
    }
    img.src = 'data:image/svg+xml;base64,' + window.btoa(
        unescape(encodeURIComponent(data)));
}


function regeneratePalette(palette) {
    palette.visible = false;
    palette.hideMenuItems();
    palette.protoContainers = {};
    palette.palettes.updatePalettes();
}
