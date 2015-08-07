// TODO :
    // (1) : Apply transform on hitmesh also when the block expands
    // (2) : Fix scaling along with code in block so only palette and main screen scaling is required to be fixed later on.

// Length of a long touch
var LONGPRESSTIME = 2000;


// Define block instance objects and any methods that are intra-block.
function Block(protoblock, blocks, overrideName) {
    if (protoblock == null) {
        console.log('null protoblock sent to Block');
        return;
    }
    this.protoblock = protoblock;
    this.name = protoblock.name;
    this.overrideName = overrideName;
    this.blocks = blocks;
    this.x = 0;
    this.y = 0;
    this.collapsed = false; // Is this block in a collapsed stack?
    this.trash = false; // Is this block in the trash?
    this.loadComplete = false; // Has the block finished loading?
    this.label = null; // Editable textview in DOM.
    this.text = null; // A dynamically generated text label on block itself.
    this.value = null; // Value for number, text, and media blocks.
    this.privateData = null; // A block may have some private data,
                             // e.g., nameboxes use this field to store
                             // the box name associated with the block.
    this.image = protoblock.image; // The file path of the image.
    this.imageBitmap = null;

    // All blocks have at a container and least one bitmap.
    this.container = null;
    this.bounds = null;
    this.bitmap = null;
    this.highlightBitmap = null;

    // The svg from which the bitmaps are generated
    this.artwork = null;
    this.collapseArtwork = null;

    // Start and Action blocks has a collapse button (in a separate
    // container).
    this.collapseContainer = null;
    this.collapseBitmap = null;
    this.expandBitmap = null;
    this.collapseBlockBitmap = null;
    this.highlightCollapseBlockBitmap = null;
    this.collapseText = null;

    this.size = 1; // Proto size is copied here.
    this.docks = []; // Proto dock is copied here.
    this.connections = []; // Blocks that cannot be run on their own.
    // Keep track of clamp count for blocks with clamps
    this.clampCount = [1, 1];

    // Some blocks have some post process after they are first loaded.
    this.postProcess = null;
    this.postProcessArg = null;

    // DONE
    this.copySize = function() {
        this.size = this.protoblock.size;
    }

    // DONE
    this.getInfo = function() {
        return this.name + ' block';
    }

    // DONE
    this.highlight = function() {
        if (this.collapsed && ['start', 'action'].indexOf(this.name) != -1) {
            // We may have a race condition.
            if (this.highlightCollapseBlockBitmap) {
                this.highlightCollapseBlockBitmap.visible = true;
                this.collapseBlockBitmap.visible = false;
                this.collapseText.visible = true;
                this.bitmap.visible = false;
                this.highlightBitmap.visible = false;
            }
        } else {
            this.bitmap.visible = false;
            this.highlightBitmap.visible = true;
            if (['start', 'action'].indexOf(this.name) != -1) {
                // There could be a race condition when making a
                // new action block.
                if (this.highlightCollapseBlockBitmap) {
                    if (this.collapseText != null) {
                        this.collapseText.visible = false;
                    }
                    if (this.collapseBlockBitmap.visible != null) {
                        this.collapseBlockBitmap.visible = false;
                    }
                    if (this.highlightCollapseBlockBitmap.visible != null) {
                        this.highlightCollapseBlockBitmap.visible = false;
                    }
                }
            }
        }
        this.blocks.refreshCanvas(1);
    }

    // DONE
    this.unhighlight = function() {
        if (this.collapsed && ['start', 'action'].indexOf(this.name) != -1) {
            if (this.highlightCollapseBlockBitmap) {
                this.highlightCollapseBlockBitmap.visible = false;
                this.collapseBlockBitmap.visible = true;
                this.collapseText.visible = true;
                this.bitmap.visible = false;
                this.highlightBitmap.visible = false;
            }
        } else {
            this.bitmap.visible = true;
            this.highlightBitmap.visible = false;
            if (['start', 'action'].indexOf(this.name) != -1) {
                if (this.highlightCollapseBlockBitmap) {
                    this.highlightCollapseBlockBitmap.visible = false;
                    this.collapseBlockBitmap.visible = false;
                    this.collapseText.visible = false;
                }
            }
        }
        this.blocks.refreshCanvas(1);
    }

    // DONE
    this.updateSlots = function(clamp, plusMinus, blocksToCheck) {
        // Resize an expandable block.
        var thisBlock = this.blocks.blockList.indexOf(this);

        this.clampCount[clamp] += plusMinus;
        this.newArtwork(plusMinus); //
        this.regenerateArtwork(false); // , blocksToCheck);
    }

    // Fix this function when the base graphics is done
    this.resize = function(scale) {
        // If the block scale changes, we need to regenerate the
        // artwork and recalculate the hitarea.
        // this.postProcess = function(myBlock) {
            // if (myBlock.imageBitmap != null) {
                // if (myBlock.imageBitmap.image.width > myBlock.imageBitmap.image.height) {
        //             myBlock.imageBitmap.scaleX = myBlock.imageBitmap.scaleY = myBlock.imageBitmap.scale = MEDIASAFEAREA[2] / myBlock.imageBitmap.image.width * scale / 2;
        //         } else {
        //             myBlock.imageBitmap.scaleX = myBlock.imageBitmap.scaleY = myBlock.imageBitmap.scale = MEDIASAFEAREA[3] / myBlock.imageBitmap.image.height * scale / 2;
        //         }
        //         myBlock.imageBitmap.x = (MEDIASAFEAREA[0] - 10) * scale / 2;
        //         myBlock.imageBitmap.y = MEDIASAFEAREA[1] * scale / 2;
        //         z = myBlock.container.getNumChildren() - 1;
        //         myBlock.container.setChildIndex(myBlock.imageBitmap, z);
        //     }
        //     if (myBlock.name == 'start') {
        //         // Rescale the decoration on the start blocks.
        //         for (turtle = 0; turtle < myBlock.blocks.turtles.turtleList.length; turtle++) {
        //             if (myBlock.blocks.turtles.turtleList[turtle].startBlock == myBlock) {
        //                 myBlock.blocks.turtles.turtleList[turtle].resizeDecoration(scale, myBlock.bitmap.image.width);
        //                 ensureDecorationOnTop(myBlock);
        //                 break;
        //             }
        //         }
        //     }
        //     myBlock.container.updateCache();
        //     calculateBlockHitArea(myBlock);
        // }
        // this.protoblock.scale = scale;
        // this.newArtwork(0);
        // this.regenerateArtwork(true);

        // if (this.text != null) {
        //     var fontSize = 10 * scale;
        //     this.text.font = fontSize + 'px Sans';
        //     this.text.x = VALUETEXTX * scale / 2.;
        //     this.text.y = VALUETEXTY * scale / 2.;
        // }
        // if (this.collapseContainer != null) {
        //     this.collapseContainer.uncache();
        //     var postProcess = function(myBlock) {
        //         myBlock.collapseBitmap.scaleX = myBlock.collapseBitmap.scaleY = myBlock.collapseBitmap.scale = scale / 2;
        //         myBlock.expandBitmap.scaleX = myBlock.expandBitmap.scaleY = myBlock.expandBitmap.scale = scale / 2;
        //         var bounds = myBlock.collapseContainer.getBounds();
        //         myBlock.collapseContainer.cache(bounds.x, bounds.y, bounds.width, bounds.height);
        //         myBlock.collapseContainer.x = myBlock.container.x + COLLAPSEBUTTONXOFF * (myBlock.protoblock.scale / 2);
        //         myBlock.collapseContainer.y = myBlock.container.y + COLLAPSEBUTTONYOFF * (myBlock.protoblock.scale / 2);

        //         calculateCollapseHitArea(myBlock);
        //     }

        //     this.generateCollapseArtwork(postProcess);
        //     var fontSize = 10 * scale;
        //     this.collapseText.font = fontSize + 'px Sans';
        //     this.collapseText.x = COLLAPSETEXTX * scale / 2;
        //     this.collapseText.y = COLLAPSETEXTY * scale / 2;
        // }
    }

    // DONE | TEST 
    this.newArtwork = function(plusMinus) {
        switch (this.name) {
            case 'start':
            case 'action':
                var proto = new ProtoBlock('collapse');
                proto.scale = this.protoblock.scale;
                proto.extraWidth = 10;
                proto.basicBlockCollapsed();
                var obj = proto.generator();
                this.collapseArtwork = obj[0];

                var obj = this.protoblock.generator(this.clampCount[0]);
                break;
            case 'repeat':
            case 'clamp':
            case 'forever':
            case 'if':
            case 'while':
            case 'until':
                var obj = this.protoblock.generator(this.clampCount[0]);
                break;
            case 'less':
            case 'greater':
            case 'equal':
                var obj = this.protoblock.generator(this.clampCount[0]);
                break;
            case 'ifthenelse':
                var obj = this.protoblock.generator(this.clampCount[0], this.clampCount[1]);
                break;
            default:
                if (this.isArgBlock()) {
                    var obj = this.protoblock.generator(this.clampCount[0]);
                } else if (this.isTwoArgBlock()) {
                    var obj = this.protoblock.generator(this.clampCount[0]);
                } else {
                    var obj = this.protoblock.generator();
                }
                this.size += plusMinus;
                break;
        }

        // Save new artwork and dock positions.
        this.artwork = obj[0];
        for (var i = 0; i < this.docks.length; i++) {
            this.docks[i][0] = obj[1][i][0];
            this.docks[i][1] = obj[1][i][1];
        }
    }

    // DONE
    this.imageLoad = function() {
        // Load any artwork associated with the block and create any
        // extra parts. Image components are loaded asynchronously so
        // most the work happens in callbacks.

        // We need a text label for some blocks. For number and text
        // blocks, this is the primary label; for parameter blocks,
        // this is used to display the current block value.

        // See where this is used and adjust the message and color
        // parameters accordingly. Also make a function that edits the
        // text easily.
        var fontSize = 10 * this.protoblock.scale;
        this.text = createText('Default','#000000',fontSize);
        this.generateArtwork(true, []);
    }

    // DONE 
    // FIXME : Adjust the positioning and TEST
    this.addImage = function() {
        var image = new Image();
        var myBlock = this;

        image.onload = function() {
            var canvas = document.createElement('canvas');
            canvas.width = image.width;
            canvas.height = image.height;
            var context = canvas.getContext('2d');
            context.drawImage(image, 0, 0);
            var texture = new THREE.Texture(canvas);
            texture.needsUpdate = true;
            texture.minFilter = THREE.NearestFilter; 
            var material = new THREE.MeshBasicMaterial( {map: texture} );
            material.transparent = true;
            material.depthWrite = false;
            // FIXME : Set image height and width using scaling
            // var bitmap = new THREE.Mesh(new THREE.PlaneBufferGeometry(me.container.scaleX*image.width, me.container.scaleY*image.height),material);
            
            var bitmap = new THREE.Mesh(new THREE.PlaneBufferGeometry(image.width, image.height),material);
            bitmap.name = 'media';
            bitmap.imgWidth = image.width;
            bitmap.imgHeight = image.height;

            // Check this media safe area
            // FIXME : Fix this image scaling
            if (image.width > image.height){
                bitmap.scale.setX(MEDIASAFEAREA[2] / image.width * (myBlock.protoblock.scale / 2));
                bitmap.scale.setY(MEDIASAFEAREA[2] / image.width * (myBlock.protoblock.scale / 2));
                bitmap.scaleStore = MEDIASAFEAREA[2] / image.width * (myBlock.protoblock.scale / 2);    
            } else {
                bitmap.scale.setX(MEDIASAFEAREA[3] / image.height * (myBlock.protoblock.scale / 2));
                bitmap.scale.setY(MEDIASAFEAREA[3] / image.height * (myBlock.protoblock.scale / 2));
                bitmap.scaleStore = MEDIASAFEAREA[3] / image.height * (myBlock.protoblock.scale / 2); 
            }

            myBlock.container.add(bitmap);
            // FIXME : Fix the image positioning
            // bitmap.position.setX(threeCoorX((MEDIASAFEAREA[0] - 10) * (myBlock.protoblock.scale / 2)));
            // bitmap.position.setY(threeCoorY(MEDIASAFEAREA[1] * (myBlock.protoblock.scale / 2)));
            bitmap.position.setX(0);
            bitmap.position.setY(0);

            myBlock.blocks.refreshCanvas(1);
        }
        image.src = this.image;
    }

    // DONE | TEST
    this.regenerateArtwork = function(collapse) {
        // Sometimes (in the case of namedboxes and nameddos) we need
        // to regenerate the artwork associated with a block.

        // First we need to remove the old artwork.
        this.container.remove(this.bitmap);
        this.container.remove(this.highlightBitmap);
        if (collapse && this.collapseBitmap != null) {
            this.collapseContainer.remove(this.collapseBitmap);
            this.collapseContainer.remove(this.expandBitmap);
            this.container.remove(this.collapseBlockBitmap);
            this.container.remove(this.highlightCollapseBlockBitmap);
        }
        // Then we generate new artwork.
        this.generateArtwork(false, []);
    }

    this.generateArtwork = function(firstTime, blocksToCheck) {
        // Get the block labels from the protoblock
        var thisBlock = this.blocks.blockList.indexOf(this);
        var block_label = '';
        if (this.overrideName) {
            block_label = this.overrideName;
        } else if (this.protoblock.staticLabels.length > 0 && !this.protoblock.image) {
            // Label should be defined inside _(). 
            block_label = this.protoblock.staticLabels[0];
        }
        while (this.protoblock.staticLabels.length < this.protoblock.args + 1) {
            this.protoblock.staticLabels.push('');
        }

        // Create the bitmap for the block.
        function processBitmap(name, bitmap, myBlock) {
            // No need to set the position as by default is center of the container
            myBlock.bitmap = bitmap;
            myBlock.container.add(myBlock.bitmap);
            myBlock.bitmap.name = 'bmp_' + thisBlock;
            myBlock.bitmap.cursor = 'pointer';
 
            // REMOVE : After graphics work perfect
            // var boundingBox = new THREE.BoxHelper( myBlock.bitmap );
            // myBlock.blocks.stage.add( boundingBox );


            myBlock.blocks.refreshCanvas(1);

            // Create the highlight bitmap for the block.
            function processHighlightBitmap(name, bitmap, myBlock) {
                myBlock.highlightBitmap = bitmap;
                myBlock.container.add(myBlock.highlightBitmap);
                myBlock.highlightBitmap.name = 'bmp_highlight_' + thisBlock;
                myBlock.highlightBitmap.cursor = 'pointer';
                // Hide it to start
                myBlock.highlightBitmap.visible = false;

                if (myBlock.text != null) {
                    // Make sure text is on top.
                    bringTextToTop(myBlock);
                }

                // At me point, it should be safe to calculate the
                // bounds of the container and cache its contents.

                myBlock.bounds = myBlock.container.get2DBounds();
                myBlock.container.bounds = myBlock.bounds;
                
                myBlock.blocks.refreshCanvas(1);

                if (firstTime) {
                    loadEventHandlers(myBlock); 
                    if (myBlock.image != null) {
                        myBlock.addImage();
                    }
                    myBlock.finishImageLoad(firstTime);
                } else {
                    if (myBlock.name == 'start') {
                        ensureDecorationOnTop(myBlock);
                    }

                    // Adjust the docks.
                    myBlock.blocks.loopCounter = 0;
                    myBlock.blocks.adjustDocks(thisBlock);

                    if (blocksToCheck.length > 0) {
                        if (myBlock.isArgBlock() || myBlock.isTwoArgBlock()) {
                            myBlock.blocks.adjustExpandableTwoArgBlock(blocksToCheck);
                        } else {
                            myBlock.blocks.adjustExpandableClampBlock(blocksToCheck);
                        }
                    }
                    if (['start', 'action'].indexOf(myBlock.name) != -1) {
                        myBlock.bitmap.visible = !myBlock.collapsed;
                        myBlock.highlightBitmap.visible = false;
                        myBlock.blocks.refreshCanvas(1);
                    }
                    if (myBlock.postProcess != null) {
                        myBlock.postProcess(myBlock);
                        myBlock.postProcess = null;
                    }
                }
            }

            var artwork = myBlock.artwork.replace(/fill_color/g, PALETTEHIGHLIGHTCOLORS[myBlock.protoblock.palette.name]).replace(/stroke_color/g, HIGHLIGHTSTROKECOLORS[myBlock.protoblock.palette.name]).replace('block_label', block_label);

            for (var i = 1; i < myBlock.protoblock.staticLabels.length; i++) {
                artwork = artwork.replace('arg_label_' + i, myBlock.protoblock.staticLabels[i]);
            }
            makeBitmap(artwork, myBlock.name, processHighlightBitmap, myBlock);
        }

        if (firstTime) {
            // Create artwork and dock.
            var obj = this.protoblock.generator();
            this.artwork = obj[0];
            for (var i = 0; i < obj[1].length; i++) {
                this.docks.push([obj[1][i][0], obj[1][i][1], this.protoblock.dockTypes[i]]);
            }
        }

        var artwork = this.artwork.replace(/fill_color/g, PALETTEFILLCOLORS[this.protoblock.palette.name]).replace(/stroke_color/g, PALETTESTROKECOLORS[this.protoblock.palette.name]).replace('block_label', block_label);

        for (var i = 1; i < this.protoblock.staticLabels.length; i++) {
            artwork = artwork.replace('arg_label_' + i, this.protoblock.staticLabels[i]);
        }
        makeBitmap(artwork, this.name, processBitmap, this);
    }

    this.finishImageLoad = function(firstTime) {
        var thisBlock = this.blocks.blockList.indexOf(this);
        // TODO : Add text here once the graphic is done
        // Value blocks ge t a modifiable text label
        // if (this.name == 'text' || this.name == 'number') {
        //     if (this.value == null) {
        //         if (this.name == 'text') {
        //             this.value = '---';
        //         } else {
        //             this.value = 100;
        //         }
        //     }

        //     var label = this.value.toString();
        //     if (label.length > 8) {
        //         label = label.substr(0, 7) + '...';
        //     }
        //     this.text.text = label;
        //     this.text.textAlign = 'center';
        //     this.text.textBaseline = 'alphabetic';
        //     this.container.addChild(this.text);
        //     this.text.x = VALUETEXTX * this.protoblock.scale / 2.;
        //     this.text.y = VALUETEXTY * this.protoblock.scale / 2.;

        //     // Make sure text is on top.
        //     z = this.container.getNumChildren() - 1;
        //     this.container.setChildIndex(this.text, z);
        //     this.container.updateCache();
        // } else if (this.protoblock.parameter) {
        //     // Parameter blocks get a text label to show their current value
        //     this.text.textBaseline = 'alphabetic';
        //     this.container.addChild(this.text);
        //     var bounds = this.container.getBounds();
        //     if (this.protoblock.args == 0) {
        //         this.text.textAlign = 'right';
        //         this.text.x = bounds.width - 25;
        //         this.text.y = VALUETEXTY * this.protoblock.scale / 2.;
        //     } else if (this.isArgBlock()) {
        //         this.text.textAlign = 'left';
        //         this.text.x = BOXTEXTX;
        //         if (this.docks[0][2] == 'booleanout') {
        //             this.text.y = bounds.height - 15;
        //         } else {
        //             this.text.y = VALUETEXTY * this.protoblock.scale / 2.;
        //         }
        //     }

        //     z = this.container.getNumChildren() - 1;
        //     this.container.setChildIndex(this.text, z);
        //     this.container.updateCache();
        // }

        if (['start', 'action'].indexOf(this.name) == -1) {
            this.loadComplete = true;
            if (this.postProcess != null) {
                this.postProcess(this.postProcessArg);
                this.postProcess = null;
            }
            this.blocks.refreshCanvas(1);
            this.blocks.cleanupAfterLoad();
        } else {
            // Start blocks and Action blocks can collapse, so add an
            // event handler
            if (firstTime) {
                var proto = new ProtoBlock('collapse');
                proto.scale = this.protoblock.scale;
                proto.extraWidth = 10;
                proto.basicBlockCollapsed();
                var obj = proto.generator();
                this.collapseArtwork = obj[0];
                var postProcess = function(myBlock) {
                    loadCollapsibleEventHandlers(myBlock);
                    myBlock.loadComplete = true;
                    
                    if (myBlock.postProcess != null) {
                        myBlock.postProcess(myBlock.postProcessArg);
                        myBlock.postProcess = null;
                    }
                }
            } else {
                var postProcess = null;
            }
            this.generateCollapseArtwork(postProcess);
        }
    }

    this.generateCollapseArtwork = function(postProcess) {
        var thisBlock = this.blocks.blockList.indexOf(this);

            function processCollapseBitmap(name, bitmap, myBlock) {
                myBlock.collapseBlockBitmap = bitmap;
                myBlock.collapseBlockBitmap.name = 'collapse_' + thisBlock;
                myBlock.container.add(myBlock.collapseBlockBitmap);
                myBlock.collapseBlockBitmap.visible = myBlock.collapsed;
                myBlock.blocks.refreshCanvas(1);

                function processHighlightCollapseBitmap(name, bitmap, myBlock) {
                    myBlock.highlightCollapseBlockBitmap = bitmap;
                    myBlock.highlightCollapseBlockBitmap.name = 'highlight_collapse_' + thisBlock;
                    myBlock.container.add(myBlock.highlightCollapseBlockBitmap);
                    myBlock.highlightCollapseBlockBitmap.visible = false;

                    var fontSize = 10 * myBlock.protoblock.scale;
                    if (myBlock.name == 'action') {
                        myBlock.collapseText = createText(_('action'), '#000000',fontSize);
                    } else {
                        myBlock.collapseText = createText(_('start'), '#000000',fontSize);
                    }
                    myBlock.collapseText.x = COLLAPSETEXTX * (myBlock.protoblock.scale / 2);
                    myBlock.collapseText.y = COLLAPSETEXTY * (myBlock.protoblock.scale / 2);
                    // myBlock.collapseText.textAlign = 'left'; // FIXME : Implement a proper text plugin with all easel options 
                    // myBlock.collapseText.textBaseline = 'alphabetic'; // TODO : Implement a baseline
                    myBlock.container.add(myBlock.collapseText);
                    myBlock.collapseText.visible = myBlock.collapsed;

                    ensureDecorationOnTop(myBlock);

                    myBlock.blocks.refreshCanvas(1);

                    myBlock.collapseContainer = new THREE.Group();
                    // myBlock.collapseContainer.snapToPixelEnabled = true; //TODO : Implement a snap feature

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
                        var material = new THREE.MeshBasicMaterial( {map: texture} );
                        material.transparent = true;
                        material.depthWrite = false;
                        // me.container.scaleX = size/me.iconsize; //See if the scale variable is required here
                        // me.container.scaleY = size/me.iconsize;
                        // var bitmap = new THREE.Mesh(new THREE.PlaneBufferGeometry(me.container.scaleX*image.width, me.container.scaleY*image.height),material);
                        
                        myBlock.collapseBitmap = new THREE.Mesh(new THREE.PlaneBufferGeometry(image.width, image.height),material);
                        myBlock.collapseBitmap.name = 'collapseBitmap '
                        myBlock.collapseBitmap.imgWidth = image.width;
                        myBlock.collapseBitmap.imgHeight = image.height;

                        bitmap.scale.setX(myBlock.protoblock.scale / 2);
                        bitmap.scale.setY(myBlock.protoblock.scale / 2);
                        bitmap.scaleStore = myBlock.protoblock.scale / 2;

                        myBlock.collapseContainer.add(myBlock.collapseBitmap);

                        finishCollapseButton(myBlock);
                    }
                    image.src = 'images/collapse.svg';

                    finishCollapseButton = function(myBlock) {
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
                            var material = new THREE.MeshBasicMaterial( {map: texture} );
                            material.transparent = true;
                            material.depthWrite = false;
                            // me.container.scaleX = size/me.iconsize; //See if the scale variable is required here
                            // me.container.scaleY = size/me.iconsize;
                            // var bitmap = new THREE.Mesh(new THREE.PlaneBufferGeometry(me.container.scaleX*image.width, me.container.scaleY*image.height),material);
                            myBlock.expandBitmap = new THREE.Mesh(new THREE.PlaneBufferGeometry(image.width, image.height),material);
                            myBlock.expandBitmap.name = 'expandBitmap';
                            myBlock.expandBitmap.imgWidth = image.width;
                            myBlock.expandBitmap.imgHeight = image.height;

                            myBlock.expandBitmap.scale.setX(myBlock.protoblock.scale / 2);
                            myBlock.expandBitmap.scale.setY(myBlock.protoblock.scale / 2);
                            myBlock.expandBitmap.scaleStore = myBlock.protoblock.scale / 2;
                            myBlock.collapseContainer.add(myBlock.collapseBitmap);
                            myBlock.expandBitmap.visible = false;

                            myBlock.blocks.stage.add(myBlock.collapseContainer);
                            if (postProcess != null) {
                                postProcess(myBlock);
                            }
                            myBlock.blocks.refreshCanvas(1);
                            myBlock.blocks.cleanupAfterLoad();
                        }
                        image.src = 'images/expand.svg';
                    }
                }

                var artwork = myBlock.collapseArtwork;
                makeBitmap(artwork.replace(/fill_color/g, PALETTEHIGHLIGHTCOLORS[myBlock.protoblock.palette.name]).replace(/stroke_color/g, HIGHLIGHTSTROKECOLORS[myBlock.protoblock.palette.name]).replace('block_label', ''), '', processHighlightCollapseBitmap, myBlock);
            }

            var artwork = this.collapseArtwork;
            makeBitmap(artwork.replace(/fill_color/g, PALETTEFILLCOLORS[this.protoblock.palette.name]).replace(/stroke_color/g, PALETTESTROKECOLORS[this.protoblock.palette.name]).replace('block_label', ''), '', processCollapseBitmap, this);
    }

    this.hide = function() {
        this.container.visible = false;
        if (this.collapseContainer != null) {
            this.collapseContainer.visible = false;
            this.collapseText.visible = false;
        }
    }

    this.show = function() {
        if (!this.trash) {
            // If it is an action block or it is not collapsed then show it.
            if (!(['action', 'start'].indexOf(this.name) == -1 && this.collapsed)) {
                this.container.visible = true;
                if (this.collapseContainer != null) {
                    this.collapseContainer.visible = true;
                    this.collapseText.visible = true;
                }
            }
        }
    }

    // Utility functions
    this.isValueBlock = function() {
        return this.protoblock.style == 'value';
    }

    this.isArgBlock = function() {
        return this.protoblock.style == 'value' || this.protoblock.style == 'arg';
    }

    this.isTwoArgBlock = function() {
        return this.protoblock.style == 'twoarg';
    }

    this.isTwoArgBooleanBlock = function() {
        return ['equal', 'greater', 'less'].indexOf(this.name) != -1;
    }

    this.isClampBlock = function() {
        return this.protoblock.style == 'clamp' || this.isDoubleClampBlock();
    }

    this.isDoubleClampBlock = function() {
        return this.protoblock.style == 'doubleclamp';
    }

    this.isNoRunBlock = function() {
        return this.name == 'action';
    }

    this.isExpandableBlock = function() {
        return this.protoblock.expandable;
    }

    // Based on the block index into the blockList.
    this.getBlockId = function() {
        var number = blockBlocks.blockList.indexOf(this);
        return '_' + number.toString();
    }

    this.removeChildBitmap = function(name) {
        for (var child = 0; child < this.container.children.length; child++) {
            if (this.container.children[child].name == name) {
                this.container.remove(this.container.children[child]);
                break;
            }
        }
    }

    // DONE | TEST
    this.loadThumbnail = function (imagePath) {
        // Load an image thumbnail onto block.
        var thisBlock = this.blocks.blockList.indexOf(this);
        var myBlock = this;
        if (this.blocks.blockList[thisBlock].value == null && imagePath == null) {
            // console.log('loadThumbnail: no image to load?');
            return;
        }
        var image = new Image();

        image.onload = function() {
            // Before adding new artwork, remove any old artwork.
            console.log('Hello: ' + myBlock.children);

            // myBlock.removeChildBitmap('media');
            for(var i = 0; i < myBlock.container.children.length; i++){
                if(myBlock.container.children[i].name === 'media'){
                    myBlock.container.remove(myBlock.container.children[i]);
                    break;
                }
            }

            var canvas = document.createElement('canvas');
            canvas.width = image.width;
            canvas.height = image.height;
            var context = canvas.getContext('2d');
            context.drawImage(image, 0, 0);
            var texture = new THREE.Texture(canvas);
            texture.needsUpdate = true;
            texture.minFilter = THREE.NearestFilter; 
            var material = new THREE.MeshBasicMaterial( {map: texture} );
            material.transparent = true;
            material.depthWrite = false;

            var bitmap = new THREE.Mesh(new THREE.PlaneBufferGeometry(image.width, image.height),material);
            bitmap.name = 'media';
            bitmap.imgWidth = image.width;
            bitmap.imgHeight = image.height;

            // Resize the image to a reasonable maximum.
            if (image.width > image.height) {
                if (image.width > 1200) {
                    bitmap.scale.setX(1200 / image.width);
                    bitmap.scale.setY(1200 / image.width);
                    bitmap.scaleStore = 1200 / image.width;
                }
            } else {
                if (image.height > 900) {
                    bitmap.scale.setX(900 / image.height);
                    bitmap.scale.setY(900 / image.height);
                    bitmap.scaleStore = 900 / image.height;
                }
            }

            myBlock.imageBitmap = bitmap;

            // Next, scale the bitmap for the thumbnail.
            if (image.width > image.height) {
                bitmap.scale.setX(MEDIASAFEAREA[2] / image.width * (myBlock.protoblock.scale / 2));
                bitmap.scale.setY(MEDIASAFEAREA[2] / image.width * (myBlock.protoblock.scale / 2));
                bitmap.scaleScore = MEDIASAFEAREA[2] / image.width * (myBlock.protoblock.scale / 2);
            } else {
                bitmap.scale.setX(MEDIASAFEAREA[3] / image.height * (myBlock.protoblock.scale / 2));
                bitmap.scale.setY(MEDIASAFEAREA[3] / image.height * (myBlock.protoblock.scale / 2));
                bitmap.scaleScore = MEDIASAFEAREA[3] / image.height * (myBlock.protoblock.scale / 2);
            }

            myBlock.container.add(bitmap);
            bitmap.position.setX = (MEDIASAFEAREA[0] - 10) * (myBlock.protoblock.scale / 2);
            bitmap.position.setY = MEDIASAFEAREA[1] * (myBlock.protoblock.scale / 2);

            myBlock.blocks.refreshCanvas(1);
        }

        if (imagePath == null) {
            image.src = this.value;
        } else {
            image.src = imagePath;
        }
    }

    // DONE
    this.doOpenMedia = function (myBlock) {
        var fileChooser = docById('myOpenAll');
        var thisBlock = myBlock.blocks.blockList.indexOf(myBlock);

        readerAction = function (event) {
            window.scroll(0, 0)

            var reader = new FileReader();
            reader.onloadend = (function() {
                if (reader.result) {
                    if (myBlock.name == 'media') {
                        myBlock.value = reader.result;
                        myBlock.loadThumbnail(null);
                        return;
                    }
                    myBlock.value = [fileChooser.files[0].name, reader.result];
                    myBlock.blocks.updateBlockText(thisBlock);
                }
            });
            if (myBlock.name == 'media') {
                reader.readAsDataURL(fileChooser.files[0]);
            }
            else {
                reader.readAsText(fileChooser.files[0]);
            }
            fileChooser.removeEventListener('change', readerAction);
        }

        fileChooser.addEventListener('change', readerAction, false);
        fileChooser.focus();
        fileChooser.click();
        window.scroll(0, 0);
    }

    this.collapseToggle = function () {
        // Find the blocks to collapse/expand
        var thisBlock = this.blocks.blockList.indexOf(this);
        this.blocks.findDragGroup(thisBlock)

        function toggle(myBlock) {
            var collapse = myBlock.collapsed;
            if (myBlock.collapseBitmap == null) {
                console.log('collapse bitmap not ready');
                return;
            }
            myBlock.collapsed = !collapse;

            // These are the buttons to collapse/expand the stack.
            myBlock.collapseBitmap.visible = collapse;
            myBlock.expandBitmap.visible = !collapse;

            // These are the collpase-state bitmaps.
            myBlock.collapseBlockBitmap.visible = !collapse;
            myBlock.highlightCollapseBlockBitmap.visible = false;
            myBlock.collapseText.visible = !collapse;

            if (collapse) {
                myBlock.bitmap.visible = true;
            } else {
                myBlock.bitmap.visible = false;
            }
            myBlock.highlightBitmap.visible = false;

            if (myBlock.name == 'action') {
                // Label the collapsed block with the action label
                if (myBlock.connections[1] != null) {
                    var text = myBlock.blocks.blockList[myBlock.connections[1]].value;
                    if (text.length > 8) {
                        text = text.substr(0, 7) + '...';
                    }
                    myBlock.collapseText.text = text;
                } else {
                    myBlock.collapseText.text = '';
                }
            }

            // Make sure the text is on top.
            var z = myBlock.container.getNumChildren() - 1;
            myBlock.container.setChildIndex(myBlock.collapseText, z);

            // Set collapsed state of blocks in drag group.
            if (myBlock.blocks.dragGroup.length > 0) {
                for (var b = 1; b < myBlock.blocks.dragGroup.length; b++) {
                    var blk = myBlock.blocks.dragGroup[b];
                    myBlock.blocks.blockList[blk].collapsed = !collapse;
                    myBlock.blocks.blockList[blk].container.visible = collapse;
                }
            }

            myBlock.blocks.refreshCanvas(1);
        }

        toggle(this);
    }
}


function $() {
    var elements = new Array();

    for (var i = 0; i < arguments.length; i++) {
        var element = arguments[i];
        if (typeof element == 'string')
            element = docById(element);
        if (arguments.length == 1)
            return element;
        elements.push(element);
    }
    return elements;
}


function calculateCollapseHitArea(myBlock) {
    var bounds = myBlock.collapseContainer.get2DBounds(true);
    // TODO : Create hitmesh once the basic is done
    // var hitArea = new createjs.Shape();
    // var w2 = bounds.width;
    // var h2 = bounds.height;
    // hitArea.graphics.beginFill('#FFF').drawEllipse(-w2 / 2, -h2 / 2, w2, h2);
    // hitArea.x = w2 / 2;
    // hitArea.y = h2 / 2;
    // myBlock.collapseContainer.hitArea = hitArea;
}


// These are the event handlers for collapsible blocks.
function loadCollapsibleEventHandlers(myBlock) {
    var thisBlock = myBlock.blocks.blockList.indexOf(myBlock);
    calculateCollapseHitArea(myBlock);

    myBlock.collapseContainer.on('mouseover', function(event) {
        myBlock.blocks.highlight(thisBlock, true);
        myBlock.blocks.activeBlock = thisBlock;
        myBlock.blocks.refreshCanvas(1);
    });

    var moved = false;
    var locked = false;
    function handleClick () {
        if (locked) {
            return;
        }
        locked = true;
        setTimeout(function() {
            locked = false;
        }, 500);
        hideDOMLabel();
        if (!moved) {
            myBlock.collapseToggle();
        }
    }

    myBlock.collapseContainer.on('click', function(event) {
        handleClick();
    });

    myBlock.collapseContainer.on('mousedown', function(event) {
        hideDOMLabel();
        // Always show the trash when there is a block selected.
        trashcan.show();
        moved = false;
        var offset = {
            x: myBlock.collapseContainer.x - Math.round(event.stageX / myBlock.blocks.scale),
            y: myBlock.collapseContainer.y - Math.round(event.stageY / myBlock.blocks.scale)
        };

        myBlock.collapseContainer.on('pressup', function(event) {
            if (moved) {
                collapseOut(blocks, myBlock, thisBlock, moved, event);
                moved = false;
            } else {
		handleClick();
            }
        });

        myBlock.collapseContainer.on('mouseout', function(event) {
            if (moved) {
                collapseOut(blocks, myBlock, thisBlock, moved, event);
                moved = false;
            }
        });

        myBlock.collapseContainer.on('pressmove', function(event) {
            moved = true;
            var oldX = myBlock.collapseContainer.x;
            var oldY = myBlock.collapseContainer.y;
            myBlock.collapseContainer.x = Math.round(event.clientX / myBlock.blocks.scale + offset.x);
            myBlock.collapseContainer.y = Math.round(event.clientY / myBlock.blocks.scale + offset.y);
            var dx = myBlock.collapseContainer.x - oldX;
            var dy = myBlock.collapseContainer.y - oldY;
            myBlock.container.x += dx;
            myBlock.container.y += dy;
            myBlock.x = myBlock.container.x;
            myBlock.y = myBlock.container.y;

            // If we are over the trash, warn the user.
            if (trashcan.overTrashcan(event.stageX / myBlock.blocks.scale, event.stageY / myBlock.blocks.scale)) {
                trashcan.highlight();
            } else {
                trashcan.unhighlight();
            }

            myBlock.blocks.findDragGroup(thisBlock)
            if (myBlock.blocks.dragGroup.length > 0) {
                for (var b = 0; b < myBlock.blocks.dragGroup.length; b++) {
                    var blk = myBlock.blocks.dragGroup[b];
                    if (b != 0) {
                        myBlock.blocks.moveBlockRelative(blk, dx, dy);
                    }
                }
            }

            myBlock.blocks.refreshCanvas(1);
        });
    });

    myBlock.collapseContainer.on('pressup', function(event) {
        collapseOut(blocks, myBlock, thisBlock, moved, event);
        moved = false;
    });

    myBlock.collapseContainer.on('mouseout', function(event) {
        collapseOut(blocks, myBlock, thisBlock, moved, event);
        moved = false;
    });
}


// DONE
function collapseOut(blocks, myBlock, thisBlock, moved, event) {
    // Always hide the trash when there is no block selected.
    trashcan.hide();
    blocks.unhighlight(thisBlock);
    if (moved) {
        // Check if block is in the trash.
        if (trashcan.overTrashcan(event.clientX / blocks.scale, event.clientY / blocks.scale)) {
            sendStackToTrash(blocks, myBlock);
        } else {
            // Otherwise, process move.
            blocks.blockMoved(thisBlock);
        }
    }

    if (blocks.activeBlock != myBlock) {
        return;
    }

    blocks.unhighlight(null);
    blocks.activeBlock = null;
    blocks.refreshCanvas(1);
}


window.hasMouse = false;
// Mousemove is not emulated for touch
document.addEventListener('mousemove', function (e) {
    window.hasMouse = true;
});

// DONE
function calculateBlockHitArea(myBlock) {
    
    var bounds = myBlock.container.get2DBounds();
    var hitmesh;

    // Only detect hits on top section of block.
    // FIXME : Why is hitmesh height reduced?
    // if (myBlock.isClampBlock()) {
        hitmesh = createRectangle(bounds.width, bounds.height, '#000000');
    // } else {
    //     hitmesh = createRectangle(bounds.width, bounds.height * 0.75, '#000000'); // Shrinking the height makes it easier to grab blocks below in the stack.
    //     hitmesh.position.setY(bounds.height * 0.25 / 2);
    // }
    myBlock.container.add(hitmesh);
     //Placing the hitmesh in the top right corner
    hitmesh.visible = false;
    myBlock.container.hitmesh = hitmesh;
}


// These are the event handlers for block containers.
function loadEventHandlers(myBlock) {
    var thisBlock = myBlock.blocks.blockList.indexOf(myBlock);
    var blocks = myBlock.blocks;

    calculateBlockHitArea(myBlock);

    var moved = false;
    var locked = false;
    var getInput = window.hasMouse;
    var px,py,dx,dy;

    // DONE
    myBlock.container.on('mouseover', function(event) {
        blocks.highlight(thisBlock, true);
        blocks.activeBlock = thisBlock;
        blocks.refreshCanvas(1);
    });

    myBlock.container.on('click', function(event) {
        if (locked) {
            return;
        }
        locked = true;
        setTimeout(function() {
            locked = false;
        }, 500);
        // hideDOMLabel(); //FIXME : fix the dom labels
        if ((!window.hasMouse && getInput) || (window.hasMouse && !moved)) {
            if (blocks.selectingStack) {
                var topBlock = blocks.findTopBlock(thisBlock);
                blocks.selectedStack = topBlock;
                blocks.selectingStack = false;
            } else if (myBlock.name == 'media') {
                myBlock.doOpenMedia(myBlock);
            } else if (myBlock.name == 'loadFile') {
                myBlock.doOpenMedia(myBlock);
            } else if (myBlock.name == 'text' || myBlock.name == 'number') {
                var x = myBlock.container.position.x
                var y = myBlock.container.position.y
                // FIXME : Fix these values
                var canvasLeft = blocks.canvas.offsetLeft + 28;
                var canvasTop = blocks.canvas.offsetTop + 6;

                var movedStage = false;
                // FIXME : Fix this value of 75 in accordance with the new values
                if (!window.hasMouse && blocks.stage.y + y > 75) {
                    movedStage = true;
                    var fromY = blocks.stage.y;
                    blocks.stage.y = -y + 75;
                }

                if (myBlock.name == 'text') {
                    var type = 'text';
                } else {
                    var type = 'number';
                }

                // A place in the DOM to put modifiable labels (textareas).
                var labelElem = docById('labelDiv');
                labelElem.innerHTML = '<input id="' + type + 'Label" \
                    style="position: absolute; \
                    -webkit-user-select: text;-moz-user-select: text;-ms-user-select: text;" \
                    class="' + type + '" type="' + type + '" \
                    value="' + myBlock.value + '" />';
                labelElem.classList.add('hasKeyboard');

                myBlock.label = docById(type + 'Label');

                var focused = false;
                var blur = function (event) {
                    if (!focused) {
                        return;
                    }

                    labelChanged(myBlock);
                    event.preventDefault();

                    labelElem.classList.remove('hasKeyboard');
                    window.scroll(0, 0);
                    myBlock.label.style.display = 'none';
                    myBlock.label.removeEventListener('keypress', keypress);

                    if (movedStage) {
                         blocks.stage.y = fromY;
                         blocks.updateStage();
                    }
                };
                myBlock.label.addEventListener('blur', blur);

                var keypress = function (event) {
                    if ([13, 10, 9].indexOf(event.keyCode) !== -1) {
                        blur(event);
                    }
                };
                myBlock.label.addEventListener('keypress', keypress);

                myBlock.label.addEventListener('change', function() {
                    labelChanged(myBlock);
                });
                // FIXME : Fix the positioning of the label
                myBlock.label.style.left = Math.round((x + blocks.stage.position.x) * blocks.scale + canvasLeft) + 'px';
                myBlock.label.style.top = Math.round((y + blocks.stage.position.y) * blocks.scale + canvasTop) + 'px';
                myBlock.label.style.width = Math.round(100 * blocks.scale) * myBlock.protoblock.scale / 2 + 'px';
                myBlock.label.style.fontSize = Math.round(20 * blocks.scale * myBlock.protoblock.scale / 2) + 'px';
                myBlock.label.style.display = '';
                myBlock.label.focus();

                // Firefox fix
                setTimeout(function () {
                    myBlock.label.style.display = '';
                    myBlock.label.focus();
                    focused = true;
                }, 100);
            } else {
                // TODO : Fix inLongPress to properly support click and run
                if (!blocks.inLongPress) {
                    // var topBlock = blocks.findTopBlock(thisBlock);
                    // console.log('running from ' + blocks.blockList[topBlock].name);
                    // blocks.logo.runLogoCommands(topBlock);
                }
            }
        }
    });

    myBlock.container.on('mousedown', function(event) {
        hideDOMLabel();
        // Track time for detecting long pause...
        // but only for top block in stack
        // TODO : Add support to trigger long press
        if (myBlock.connections[0] == null) {
            var d = new Date();
            blocks.time = d.getTime();
            blocks.timeOut = setTimeout(function() {
                blocks.triggerLongPress(myBlock);
            }, LONGPRESSTIME);
        }

        // Always show the trash when there is a block selected.
        trashcan.show();

        // Raise entire stack to the top.
        blocks.raiseStackToTop(thisBlock);

        // And possibly the collapse button.
        if (myBlock.collapseContainer != null) {
            // FIXME : set the collapseContainer z-index same as other
            // blocks.stage.setChildIndex(myBlock.collapseContainer, blocks.stage.getNumChildren() - 1);
        }

        moved = false;
    });

    myBlock.container.on('mouseout', function(event) {
        if (!blocks.inLongPress) {
            mouseoutCallback(myBlock, event, moved);
        }
        moved = false;
    });

    myBlock.container.on('pressup', function(event) {
        px = false;
        py = false;
        if (!blocks.inLongPress) {
            mouseoutCallback(myBlock, event, moved);
        }
        moved = false;
    });

    myBlock.container.on('pressmove', function(event) {
        // FIXME: More voodoo, fix this function, causing errors
        // event.nativeEvent.preventDefault();

        // FIXME: need to remove timer
        if (blocks.timeOut != null) {
            clearTimeout(blocks.timeOut);
            blocks.timeOut = null;
        }
        if (!moved && myBlock.label != null) {
            myBlock.label.style.display = 'none';
        }

        if (window.hasMouse) {
            moved = true;
        } else {
            // Make it eaiser to select text on mobile
            setTimeout(function () {
                // FIXME : THIS Mobile version
                // moved = Math.abs(event.clientX - original.x) + Math.abs(event.stageY - original.y) > 20 && !window.hasMouse;
                getInput = !moved;
            }, 200);
        }

        // var oldX = myBlock.container.x;
        // var oldY = myBlock.container.y;
        // myBlock.container.x = Math.round(event.stageX / blocks.scale) + offset.x;
        // myBlock.container.y = Math.round(event.stageY / blocks.scale) + offset.y;
        // myBlock.x = myBlock.container.x;
        // myBlock.y = myBlock.container.y;
        // var dx = Math.round(myBlock.container.x - oldX);
        // var dy = Math.round(myBlock.container.y - oldY);

        // TODO : When scaling is active throughout then put it here as well
        // just divide event.clientX and event.clientY with blocks.scale

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

        myBlock.container.position.setX(myBlock.container.position.x + dx);
        myBlock.container.position.setY(myBlock.container.position.y + dy);


        // If we are over the trash, warn the user.
        // Add scaling here
        // if (trashcan.overTrashcan(event.stageX / blocks.scale, event.stageY / blocks.scale)) {
        if(trashcan.overTrashcan(event.clientX, event.clientY)){
            trashcan.highlight();
        } else {
            trashcan.unhighlight();
        }

        if (myBlock.isValueBlock() && myBlock.name != 'media') {
            // Ensure text is on top
            bringTextToTop(myBlock);
        } else if (myBlock.collapseContainer != null) {
            // PE : Check whether the positioning is working fine
            myBlock.collapseContainer.position.setX(myBlock.container.position.x + COLLAPSEBUTTONXOFF * (myBlock.protoblock.scale / 2));
            myBlock.collapseContainer.position.setY(myBlock.container.position.y + COLLAPSEBUTTONYOFF * (myBlock.protoblock.scale / 2));
        }

        // Move any connected blocks.
        // PE : Check whether this is working
        blocks.findDragGroup(thisBlock);
        if (blocks.dragGroup.length > 0) {
            for (var b = 0; b < blocks.dragGroup.length; b++) {
                var blk = blocks.dragGroup[b];
                if (b != 0) {
                    blocks.moveBlockRelative(blk, dx, dy);
                }
            }
        }

        px = event.clientX;
        py = event.clientY;

        blocks.refreshCanvas(1);
    });

    myBlock.container.on('mouseout', function(event) {
        if (!blocks.inLongPress) {
            mouseoutCallback(myBlock, event, moved);
        }
    });
}

// DONE | TEST
function mouseoutCallback(myBlock, event, moved) {
    var thisBlock = myBlock.blocks.blockList.indexOf(myBlock);
    // Always hide the trash when there is no block selected.
    // FIXME: need to remove timer
    if (myBlock.blocks.timeOut != null) {
        clearTimeout(myBlock.blocks.timeOut);
        myBlock.blocks.timeOut = null;
    }
    trashcan.hide();

    if (moved) {
        // Check if block is in the trash.
        // if (trashcan.overTrashcan(event.clientX / myBlock.blocks.scale, event.clientY / myBlock.blocks.scale)) {
        if (trashcan.overTrashcan(event.clientX, event.clientY)) {
            sendStackToTrash(blocks, myBlock);
        } else {
            // Otherwise, process move.
            myBlock.blocks.blockMoved(thisBlock);
        }
    }

    if (myBlock.blocks.activeBlock != myBlock) {
    } else {
        myBlock.blocks.unhighlight(null);
        myBlock.blocks.activeBlock = null;
        myBlock.blocks.refreshCanvas(1);
    }
}

// DONE
// FIXME :
// Currently whenever this function runs, the objects z-index becomes highest + 1,
// this makes the z-index to grow to large numbers if check is not placed
// either fix the algo or reset all the z-indexes after a value is reached.
function ensureDecorationOnTop(myBlock) {
    // Find the turtle decoration and move it to the top.
    var decorationIndex;
    var currZindex = myBlock.container.children[0].position.z;
    var maxZindex = currZindex;
    var flag = false;

    for (var child = 1; child < myBlock.container.children.length; child++) {
        if (myBlock.container.children[child].name == 'decoration') {
            decorationIndex = child;        
        }
        else{
            currZindex = myBlock.container.children[child].position.z;
            if(currZindex > maxZindex){
                maxZindex = currZindex;
                flag = true;
            }
        }
    }

    if(decorationIndex !== undefined && flag){
        myBlock.container.children[decorationIndex].position.setZ(maxZindex+1);
    }
}

// DONE
function bringTextToTop(myBlock){
    var index;
    var currZindex = myBlock.container.children[0].position.z;
    var maxZindex = currZindex;
    var flag = false;

    for (var child = 1; child < myBlock.container.children.length; child++) {
        if (myBlock.container.children[child] === myBlock.text) {
            index = child;        
        }
        else{
            currZindex = myBlock.container.children[child].position.z;
            if(currZindex > maxZindex){
                maxZindex = currZindex;
                flag = true;
            }
        }
    }
    if(index !== undefined && flag){
        myBlock.text.setZ(maxZindex+1);
    }
}


// DONE
function makeBitmap(data, name, callback, args) {
    // Async creation of bitmap from SVG data
    // Works with Chrome, Safari, Firefox (untested on IE)
    var img = new Image();
        img.onload = function () {
            var canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            var context = canvas.getContext('2d');
            context.drawImage(img, 0, 0);
            var texture = new THREE.Texture(canvas);
            texture.needsUpdate = true;
            texture.minFilter = THREE.NearestFilter; 
            var material = new THREE.MeshBasicMaterial( {map: texture} );
            material.transparent = true;
            material.depthWrite = false;
            // me.container.scaleX = size/me.iconsize; //See if the scale variable is required here
            // me.container.scaleY = size/me.iconsize;
            // var bitmap = new THREE.Mesh(new THREE.PlaneBufferGeometry(me.container.scaleX*img.width, me.container.scaleY*img.height),material);
            var bitmap = new THREE.Mesh(new THREE.PlaneBufferGeometry(img.width, img.height),material);
            bitmap.name = name;
            bitmap.imgWidth = img.width;
            bitmap.imgHeight = img.height;
            callback(name, bitmap, args);
    }
    img.src = 'data:image/svg+xml;base64,' + window.btoa(
        unescape(encodeURIComponent(data)));
}



function labelChanged(myBlock) {
    // Update the block values as they change in the DOM label.
    if (myBlock == null) {
        return;
    }

    var oldValue = myBlock.value;
    var newValue = myBlock.label.value;

    // Update the block value and block text.
    if (myBlock.name == 'number') {
        myBlock.value = Number(newValue);
        if (isNaN(myBlock.value)) {
            var thisBlock = myBlock.blocks.blockList.indexOf(myBlock);
            myBlock.blocks.errorMsg(newValue + ': Not a number', thisBlock);
            myBlock.blocks.refreshCanvas(1);
            myBlock.value = oldValue;
        }
    } else {
        myBlock.value = newValue;
    }
    var label = myBlock.value.toString();
    if (label.length > 8) {
        label = label.substr(0, 7) + '...';
    }
    myBlock.text.text = label;

    // and hide the DOM textview...
    myBlock.label.style.display = 'none';

    // TODO : Make sure text is on top.

    myBlock.blocks.refreshCanvas(1);

    // TODO: Don't allow duplicate action names
    var c = myBlock.connections[0];
    if (myBlock.name == 'text' && c != null) {
        var cblock = myBlock.blocks.blockList[c];
        console.log('Label changed to: ' + myBlock.name);
        switch (cblock.name) {
            case 'action':
                // If the label was the name of an action, update the
                // associated run myBlock.blocks and the palette buttons
                if (myBlock.value != _('action')) {
                    // myBlock.blocks.newDoBlock(myBlock.value);
                    myBlock.blocks.newNameddoBlock(myBlock.value);
                }
                // Rename both do <- name and nameddo blocks.
                myBlock.blocks.renameDos(oldValue, newValue);
                myBlock.blocks.renameNameddos(oldValue, newValue);
                myBlock.blocks.palettes.updatePalettes('blocks');
                break;
            case 'storein':
                // If the label was the name of a storein, update the
                //associated box myBlock.blocks and the palette buttons
                if (myBlock.value != 'box') {
                    myBlock.blocks.newStoreinBlock(myBlock.value);
                    // myBlock.blocks.newBoxBlock(myBlock.value);
                    myBlock.blocks.newNamedboxBlock(myBlock.value);
                }
                // Rename both box <- name and namedbox blocks.
                myBlock.blocks.renameBoxes(oldValue, newValue);
                myBlock.blocks.renameNamedboxes(oldValue, newValue);
                myBlock.blocks.palettes.updatePalettes('blocks');
                break;
        }
    }
}
