// TODO :
// (1) Currently there are 2 stages, a 2D stage and 3D stage. Remove the 2D stage when the 3D turtle is available.
// (2) Make a utility to produce a thick line in windows


// Turtles
var DEFAULTCOLOR = 0;
var DEFAULTVALUE = 50;
var DEFAULTCHROMA = 100;
var DEFAULTSTROKE = 5;
var DEFAULTFONT = 'sans-serif';
var XAXIS = new THREE.Vector3(1,0,0);
var YAXIS = new THREE.Vector3(0,1,0);
var ZAXIS = new THREE.Vector3(0,0,1);
var ORIGIN = new THREE.Vector3(0,0,0);

// Turtle sprite
var turtlePath = 'images/turtle.svg';
var turtleBasePath = 'images/';

function Turtle (name, turtles) {
    this.name = name;
    this.turtles = turtles;

    // Is the turtle running?
    this.running = false;

    // In the trash?
    this.trash = false;
    
    // Things used for drawing the turtle.
    this.container = null;
    this.axis = null;
    this.drawingCanvas = new THREE.Group();
    

    // Holds the current position of the location of the turtle
    this.position = new THREE.Vector3(0,0,0);
    this.bitmap = null;
    this.skinChanged = false;  // Should we reskin the turtle on clear?
    // 3D
    // Holds the vectors of the current axis directions
    this.axisX = new THREE.Vector3(1,0,0);
    this.axisY = new THREE.Vector3(0,1,0);
    this.axisZ = new THREE.Vector3(0,0,1);
    // Holds the current rotation in degrees
    this.roll = 0;
    this.pitch = 0;
    this.yaw  = 0;

    // Which start block is assocated with this turtle?
    this.startBlock = null;
    this.decorationBitmap = null;  // Start block decoration.

    // Queue of blocks this turtle is executing.
    this.queue = [];

    // Listeners
    this.listeners = {};

    // Things used for what the turtle draws.
    this.color = DEFAULTCOLOR;
    this.value = DEFAULTVALUE;
    this.chroma = DEFAULTCHROMA;
    this.stroke = DEFAULTSTROKE;
    this.canvasColor = '#ff0031';
    this.fillState = false;
    this.penState = true;
    this.font = DEFAULTFONT;
    this.material = new THREE.LineBasicMaterial({color: this.canvasColor,linewidth : this.stroke});
    this.media = [];  // Media (text, images) we need to remove on clear.


    this.move = function(ox, oy, x, y, invert) {

    };

    this.arc = function(cx, cy, ox, oy, x, y, radius, start, end, anticlockwise, invert) {
        // TODO : Add option to draw arc later on when the implementation pattern is clear
        // Problem is where the arc should be drawn, 
        // (1) Should it be drawn in a plane, then which plane would this be.
        // (2) Or somehow give option to draw a parametric 3D curve
    };

    this.doArc = function(angle, radius) {

    };

    // Turtle functions
    this.doClear = function() {
        // Reset turtle.

        var i = this.turtles.turtleList.indexOf(this) % 10;
        this.color = i * 10;
        this.value = DEFAULTVALUE;
        this.chroma = DEFAULTCHROMA;
        this.stroke = DEFAULTSTROKE;
        this.font = DEFAULTFONT;

        if(this.axis !== null){ // Can occur if the turtle is still not initialized
            this.axis.position.copy(this.position);
        }

        // TODO : Port the do turtle shell function
        // if (this.skinChanged) {
        //     this.doTurtleShell(55, turtleBasePath + 'turtle-' + i.toString() + '.svg');
        //     this.skinChanged = false;
        // }

        // TODO : Add calls to make all types of rotation to 0

        // Clear all media.
        for (i = 0; i < this.media.length; i++) {
            this.turtles.stage2D.remove(this.media[i]);
        }
        // FIX ME: potential memory leak
        this.media = [];

        // Clear all graphics.
        this.penState = true;
        this.fillState = false;

        this.canvasColor = getMunsellColor(this.color, this.value, this.chroma);

        // TODO : Implement a stroke style
        // this.drawingCanvas.graphics.setStrokeStyle(this.stroke, 'round', 'round');

        this.turtles.refreshCanvas(1);
        this.turtles.refreshCanvas(2);
    }


    this.setCursorPosition = function(x,y,z){

        var geometry = new THREE.Geometry();
        var lineBegin = new THREE.Vector3();
        var lineClose = new THREE.Vector3();
        lineBegin.copy(this.position);
        geometry.vertices.push(lineBegin);
        if(this.penState){
            this.position.set(x,y,z);
            lineClose.copy(this.position);
            geometry.vertices.push(lineClose);
            this.drawingCanvas.add(new THREE.Line(geometry, this.material));
            this.axis.position.set(x,y,z);
            this.turtles.refreshCanvas(2);
        }
        else{
            this.position.set(x,y,z);
            this.axis.position.set(x,y,z);
            this.turtles.refreshCanvas(2);
        }  
    };


    this.doForwardX = function(x){
        var geometry = new THREE.Geometry();
        var lineBegin = new THREE.Vector3();
        var lineClose = new THREE.Vector3();
        var alongX = new THREE.Vector3();
        alongX.copy(XAXIS);
        alongX.multiplyScalar(x);
        lineBegin.copy(this.position);
        geometry.vertices.push(lineBegin);
        if(this.penState){
            this.position.addVectors(this.position,alongX);
            lineClose.copy(this.position);
            geometry.vertices.push(lineClose);
            this.drawingCanvas.add(new THREE.Line(geometry, this.material));
            this.axis.position.copy(this.position);
            this.turtles.refreshCanvas(2);
        }
        else{
            this.position.addVectors(this.position,alongX);
            this.axis.position.copy(this.position);
            this.turtles.refreshCanvas(2);
        } 
    };

    this.doForwardY = function(y){
        var geometry = new THREE.Geometry();
        var lineBegin = new THREE.Vector3();
        var lineClose = new THREE.Vector3();
        var alongY = new THREE.Vector3();
        alongY.copy(this.axisY);
        alongY.multiplyScalar(y);
        lineBegin.copy(this.position);
        geometry.vertices.push(lineBegin);
        if(this.penState){
            this.position.addVectors(this.position,alongY);
            lineClose.copy(this.position);
            geometry.vertices.push(lineClose);
            this.drawingCanvas.add(new THREE.Line(geometry, this.material));
            this.axis.position.copy(this.position);
            this.turtles.refreshCanvas(2);
        }
        else{
            this.position.addVectors(this.position,alongY);
            this.axis.position.copy(this.position);
            this.turtles.refreshCanvas(2);
        }  
    };

    this.doForwardZ = function(z){
        var geometry = new THREE.Geometry();
        var lineBegin = new THREE.Vector3();
        var lineClose = new THREE.Vector3();
        var alongZ = new THREE.Vector3();
        alongZ.copy(this.axisZ);
        alongZ.multiplyScalar(z);
        lineBegin.copy(this.position);
        geometry.vertices.push(lineBegin);
        if(this.penState){
            this.position.addVectors(this.position,alongZ);
            lineClose.copy(this.position);
            geometry.vertices.push(lineClose);
            this.drawingCanvas.add(new THREE.Line(geometry, this.material));
            this.axis.position.copy(this.position);
            this.turtles.refreshCanvas(2);
        }
        else{
            this.position.addVectors(this.position,alongZ);
            this.axis.position.copy(this.position);
            this.turtles.refreshCanvas(2);
        }
    };

        // old turtle point
        var ox = this.turtles.screenX2turtleX(this.container.x);
        var oy = this.turtles.screenY2turtleY(this.container.y);

        // new turtle point
        var nx = Number(x)
        var ny = Number(y);

        this.move(ox, oy, nx, ny, true);
        this.turtles.refreshCanvas();
    }

    this.doArc = function(angle, radius) {
        if (!this.fillState) {
            this.drawingCanvas.graphics.beginStroke(this.canvasColor);
            this.drawingCanvas.graphics.setStrokeStyle(this.stroke, 'round', 'round');
            this.drawingCanvas.graphics.moveTo(this.container.x, this.container.y);
        }
        var adeg = Number(angle);
        var arad = (adeg / 180) * Math.PI;
        var orad = (this.orientation / 180) * Math.PI;
        var r = Number(radius);

        // old turtle point
        ox = this.turtles.screenX2turtleX(this.container.x);
        oy = this.turtles.screenY2turtleY(this.container.y);

        if( adeg < 0 ) {
            var anticlockwise = true;
            adeg = -adeg;
            // center point for arc
            var cx = ox - Math.cos(orad) * r;
            var cy = oy + Math.sin(orad) * r;
            // new position of turtle
            var nx = cx + Math.cos(orad + arad) * r;
            var ny = cy - Math.sin(orad + arad) * r;
        } else {
            var anticlockwise = false;
            // center point for arc
            var cx = ox + Math.cos(orad) * r;
            var cy = oy - Math.sin(orad) * r;
            // new position of turtle
            var nx = cx - Math.cos(orad + arad) * r;
            var ny = cy + Math.sin(orad + arad) * r;
        }
        this.arc(cx, cy, ox, oy, nx, ny, r, orad, orad + arad, anticlockwise, true);

        if (anticlockwise) {
            this.doRight(-adeg);
        } else {
            this.doRight(adeg);
        }
        this.turtles.refreshCanvas();
    }

    this.doShowImage = function(size, myImage) {
        // Add an image object to the canvas
        // Is there a JS test for a valid image path?
        if (myImage == null) {
            return;
        }
        var image = new Image();
        var me = this;
        image.onload = function() {
            var bitmap = new createjs.Bitmap(image);
            me.turtles.stage.addChild(bitmap);
            me.media.push(bitmap);
            bitmap.scaleX = Number(size) / image.width;
            bitmap.scaleY = bitmap.scaleX;
            bitmap.scale = bitmap.scaleX;
            bitmap.x = me.container.x;
            bitmap.y = me.container.y;
            bitmap.regX = image.width / 2;
            bitmap.regY = image.height / 2;
            bitmap.rotation = me.orientation;
            me.turtles.refreshCanvas();
        }
        image.src = myImage;
    }

    this.doShowURL = function(size, myURL) {
        // Add an image object from a URL to the canvas
        if (myURL == null) {
            return;
        }
        var image = new Image();
        image.src = myURL;
        var me = this;
        image.onload = function() {
            var bitmap = new createjs.Bitmap(image);
            me.turtles.stage.addChild(bitmap);
            me.media.push(bitmap);
            bitmap.scaleX = Number(size) / image.width;
            bitmap.scaleY = bitmap.scaleX;
            bitmap.scale = bitmap.scaleX;
            bitmap.x = me.container.x;
            bitmap.y = me.container.y;
            bitmap.regX = image.width / 2;
            bitmap.regY = image.height / 2;
            bitmap.rotation = me.orientation;
            me.turtles.refreshCanvas();
        }
    }

    this.doTurtleShell = function(size, myImage) {
        // Add image to turtle
        if (myImage == null) {
            return;
        }
        var image = new Image();
        image.src = myImage;
        var me = this;
        image.onload = function() {
            me.container.removeChild(me.bitmap);
            me.bitmap = new createjs.Bitmap(image);
            me.container.addChild(me.bitmap);
            me.bitmap.scaleX = Number(size) / image.width;
            me.bitmap.scaleY = me.bitmap.scaleX;
            me.bitmap.scale = me.bitmap.scaleX;
            me.bitmap.x = 0;
            me.bitmap.y = 0;
            me.bitmap.regX = image.width / 2;
            me.bitmap.regY = image.height / 2;
            me.bitmap.rotation = me.orientation;
            me.skinChanged = true;

            me.container.uncache();
            var bounds = me.container.getBounds();
            me.container.cache(bounds.x, bounds.y, bounds.width, bounds.height);

            // Recalculate the hit area as well.
            var hitArea = new createjs.Shape();
            hitArea.graphics.beginFill('#FFF').drawRect(0, 0, bounds.width, bounds.height);
            hitArea.x = -bounds.width / 2;
            hitArea.y = -bounds.height / 2;
            me.container.hitArea = hitArea;

            if (me.startBlock != null) {
                me.startBlock.container.removeChild(me.decorationBitmap);
                me.decorationBitmap = new createjs.Bitmap(myImage);
                me.startBlock.container.addChild(me.decorationBitmap);
                me.decorationBitmap.name = 'decoration';
                var bounds = me.startBlock.container.getBounds();
                // FIXME: Why is the position off? Does it need a scale factor?
                me.decorationBitmap.x = bounds.width - 50 * me.startBlock.protoblock.scale / 2;
                me.decorationBitmap.y = 20 * me.startBlock.protoblock.scale / 2;
                me.decorationBitmap.scaleX = (27.5 / image.width) * me.startBlock.protoblock.scale / 2;
                me.decorationBitmap.scaleY = (27.5 / image.height) * me.startBlock.protoblock.scale / 2;
                me.decorationBitmap.scale = (27.5 / image.width) * me.startBlock.protoblock.scale / 2;
                me.startBlock.container.updateCache();
            }
            me.turtles.refreshCanvas();
        }
    }

    this.resizeDecoration = function(scale, width) {
        this.decorationBitmap.x = width - 30 * scale / 2;
        this.decorationBitmap.y = 35 * scale / 2;
        this.decorationBitmap.scaleX = this.decorationBitmap.scaleY = this.decorationBitmap.scale = 0.5 * scale / 2
    }

    this.doShowText = function(size, myText) {
        // Add a text or image object to the canvas

        var textSize = size.toString() + 'px ' + this.font;
        var text = new createjs.Text(myText.toString(), textSize, this.canvasColor);
        text.textAlign = 'left';
        text.textBaseline = 'alphabetic';
        this.turtles.stage.addChild(text);
        this.media.push(text);
        text.x = this.container.x;
        text.y = this.container.y;
        text.rotation = this.orientation;
        var xScaled = text.x * this.turtles.scale;
        var yScaled = text.y * this.turtles.scale;
        var sizeScaled = size * this.turtles.scale;
        this.svgOutput += '<text x="' + xScaled + '" y = "' + yScaled + '" fill="' + this.canvasColor + '" font-family = "' + this.font + '" font-size = "' + sizeScaled + '">' + myText + '</text>';
        this.turtles.refreshCanvas();
    }

    this.doRight = function(degrees) {
        // Turn right and display corresponding turtle graphic.
        this.orientation += Number(degrees);
        this.orientation %= 360;
        this.bitmap.rotation = this.orientation;
        this.container.updateCache();
        this.turtles.refreshCanvas();
    }

    this.doSetHeading = function(degrees) {
        this.orientation = Number(degrees);
        this.orientation %= 360;
        this.bitmap.rotation = this.orientation;
        this.turtles.refreshCanvas();
        this.container.updateCache();
    }

    this.doSetFont = function(font) {
        this.font = font;
        this.turtles.refreshCanvas();
        this.container.updateCache();
    }


    this.doSetColor = function(color) {
        // Color sets hue but also selects maximum chroma.
        this.closeSVG();
        this.color = Number(color);
        var results = getcolor(this.color);
        this.canvasValue = results[0];
        this.canvasChroma = results[1];
        this.canvasColor = results[2];
        this.drawingCanvas.graphics.beginStroke(this.canvasColor);
    }

    this.doSetHue = function(hue) {
        this.closeSVG();
        this.color = Number(hue);
        this.canvasColor = getMunsellColor(this.color, this.value, this.chroma);
        this.drawingCanvas.graphics.beginStroke(this.canvasColor);
    }

    this.doSetValue = function(shade) {
        this.closeSVG();
        this.value = Number(shade);
        this.canvasColor = getMunsellColor(this.color, this.value, this.chroma);
        this.drawingCanvas.graphics.beginStroke(this.canvasColor);
    }

    this.doSetChroma = function(chroma) {
        this.closeSVG();
        this.chroma = Number(chroma);
        this.canvasColor = getMunsellColor(this.color, this.value, this.chroma);
        this.drawingCanvas.graphics.beginStroke(this.canvasColor);
    }

    this.doSetPensize = function(size) {
        this.closeSVG();
        this.stroke = size;
        this.drawingCanvas.graphics.setStrokeStyle(this.stroke, 'round', 'round');
    }

    this.doPenUp = function() {
        this.closeSVG();
        this.penState = false;
    }

    this.doPenDown = function() {
        this.penState = true;
    }

    this.doStartFill = function() {
        /// start tracking points here
        this.drawingCanvas.graphics.beginFill(this.canvasColor);
        this.fillState = true;
    }

    this.doEndFill = function() {
        /// redraw the points with fill enabled
        this.drawingCanvas.graphics.endFill();
        this.closeSVG();
        this.fillState = false;
    }

    this.closeSVG = function() {
        if (this.svgPath) {
            this.svgOutput += '" style="stroke-linecap:round;fill:';
            if (this.fillState) {
                this.svgOutput += this.canvasColor + ';';
            } else {
                this.svgOutput += 'none;';
            }
            this.svgOutput += 'stroke:' + this.canvasColor + ';';
            var strokeScaled = this.stroke * this.turtles.scale;
            this.svgOutput += 'stroke-width:' + strokeScaled + 'pt;" />';
            this.svgPath = false;
        }
    }
};


function Turtles(canvas, stage, refreshCanvas) {
    this.canvas = canvas;
    this.stage = stage;
    this.refreshCanvas = refreshCanvas;
    this.scale = 1.0;
    this.rotating = false;

    this.setScale = function(scale) {
        this.scale = scale;
    }

    this.setBlocks = function(blocks) {
        this.blocks = blocks;
    }

    // The list of all of our turtles, one for each start block.
    this.turtleList = [];

    this.add = function(startBlock, infoDict) {
        // Add a new turtle for each start block
        if (startBlock != null) {
            console.log('adding a new turtle ' + startBlock.name);
        } else {
            console.log('adding a new turtle startBlock is null');
        };

        var blkInfoAvailable = false;

        if (typeof(infoDict) == 'object') {
          if (Object.keys(infoDict).length == 8) {
            blkInfoAvailable = true;
          }
        }

        var i = this.turtleList.length;
        var turtleName = i.toString();
        var myTurtle = new Turtle(turtleName, this);

        if (blkInfoAvailable) {
            myTurtle.x = infoDict['xcor'];
            myTurtle.y = infoDict['ycor'];
        }

        this.turtleList.push(myTurtle);

        // Each turtle needs its own canvas.
        myTurtle.drawingCanvas = new createjs.Shape();
        this.stage.add(myTurtle.drawingCanvas);
        // In theory, this prevents some unnecessary refresh of the
        // canvas.
        myTurtle.drawingCanvas.tickEnabled = false;

        var turtleImage = new Image();
        i %= 10;
        myTurtle.container = new createjs.Container();
        this.stage.add(myTurtle.container);
        myTurtle.container.x = this.turtleX2screenX(myTurtle.x);
        myTurtle.container.y = this.turtleY2screenY(myTurtle.y);

        var hitArea = new createjs.Shape();
        hitArea.graphics.beginFill('#FFF').drawEllipse(-27, -27, 55, 55);
        hitArea.x = 0;
        hitArea.y = 0;
        myTurtle.container.hitArea = hitArea;

        function processTurtleBitmap(me, name, bitmap, startBlock) {
            myTurtle.bitmap = bitmap;
            myTurtle.bitmap.regX = 27 | 0;
            myTurtle.bitmap.regY = 27 | 0;
            myTurtle.bitmap.cursor = 'pointer';
            myTurtle.container.addChild(myTurtle.bitmap);

            var bounds = myTurtle.container.getBounds();
            myTurtle.container.cache(bounds.x, bounds.y, bounds.width, bounds.height);

            myTurtle.startBlock = startBlock;
            if (startBlock != null) {
                myTurtle.decorationBitmap = myTurtle.bitmap.clone();
                startBlock.container.addChild(myTurtle.decorationBitmap);
                myTurtle.decorationBitmap.name = 'decoration';
                var bounds = startBlock.container.getBounds();
                myTurtle.decorationBitmap.x = bounds.width - 30 * startBlock.protoblock.scale / 2;
                myTurtle.decorationBitmap.y = 35 * startBlock.protoblock.scale / 2;
                myTurtle.decorationBitmap.scaleX = myTurtle.decorationBitmap.scaleY = myTurtle.decorationBitmap.scale = 0.5 * startBlock.protoblock.scale / 2
                startBlock.container.updateCache();
            }

            me.refreshCanvas();
        }

        makeTurtleBitmap(this, TURTLESVG.replace(/fill_color/g, FILLCOLORS[i]).replace(/stroke_color/g, STROKECOLORS[i]), 'turtle', processTurtleBitmap, startBlock);

        myTurtle.color = i * 10;
        myTurtle.canvasColor = getMunsellColor(myTurtle.color, DEFAULTVALUE, DEFAULTCHROMA);

        var turtles = this;

        myTurtle.container.on('mousedown', function(event) {
            if (turtles.rotating) {
                return;
            }

            var offset = {
                x: myTurtle.container.x - event.stageX,
                y: myTurtle.container.y - event.stageY
            }

            myTurtle.container.on('pressup', function(event) {
                myTurtle.bitmap.scaleX = 1;
                myTurtle.bitmap.scaleY = 1;
                myTurtle.bitmap.scale = 1;
                turtles.refreshCanvas();
            });

            myTurtle.container.on('pressmove', function(event) {
                if (turtles.rotating) {
                    return;
                }

                myTurtle.container.x = event.stageX + offset.x;
                myTurtle.container.y = event.stageY + offset.y;
                myTurtle.x = turtles.screenX2turtleX(myTurtle.container.x);
                myTurtle.y = turtles.screenY2turtleY(myTurtle.container.y);
                turtles.refreshCanvas();
            });
        });

        myTurtle.container.on('click', function(event) {
            var fromX, fromY;

            // If turtles listen for clicks then they can be used as buttons.
            turtles.stage.dispatchEvent('click' + myTurtle.name);

            myTurtle.container.on('mousedown', function(event) {
                // Rotation interferes with button click events.
                // turtles.rotating = true;
                fromX = event.stageX;
                fromY = event.stageY;
            }, null, true);  // once = true

            myTurtle.container.on('pressmove', function(event) {
                if (turtles.rotating && fromX !== undefined) {
                    var rad = Math.atan2(fromY - event.stageY, fromX - event.stageX);
                    var deg = rad * 180 / Math.PI - 90;
                    deg %= 360;

                    // Only rotate if there is a more than 1/2 deg difference
                    if (Math.abs(deg - myTurtle.orientation) > 0.5) {
                        myTurtle.doSetHeading(deg);
                        turtles.refreshCanvas();
                    }
                }
            });

            myTurtle.container.on('pressup', function(event) {
                turtles.rotating = false;
            });
        });

        myTurtle.container.on('mouseover', function(event) {
            myTurtle.bitmap.scaleX = 1.2;
            myTurtle.bitmap.scaleY = 1.2;
            myTurtle.bitmap.scale = 1.2;
            turtles.refreshCanvas();
        });

        myTurtle.container.on('mouseout', function(event) {
            myTurtle.bitmap.scaleX = 1;
            myTurtle.bitmap.scaleY = 1;
            myTurtle.bitmap.scale = 1;
            turtles.refreshCanvas();
        });

        document.getElementById('loader').className = '';
        setTimeout(function() {
            if (blkInfoAvailable) {
                myTurtle.doSetHeading(infoDict['heading']);
                myTurtle.doSetPensize(infoDict['pensize']);
                myTurtle.doSetChroma(infoDict['grey']);
                myTurtle.doSetValue(infoDict['shade']);
                myTurtle.doSetColor(infoDict['color']);
            }
        }, 1000);
        this.refreshCanvas();
    }

    this.screenX2turtleX = function(x) {
        return x - (this.canvas.width / (2.0 * this.scale));
    }

    this.screenY2turtleY = function(y) {
        return this.invertY(y);
    }

    this.turtleX2screenX = function(x) {
        return (this.canvas.width / (2.0 * this.scale)) + x;
    }

    this.turtleY2screenY = function(y) {
        return this.invertY(y);
    }

    this.invertY = function(y) {
        return this.canvas.height / (2.0 * this.scale) - y;
    }

    this.markAsStopped = function() {
        for (turtle in this.turtleList) {
            this.turtleList[turtle].running = false;
        }
    }

    this.running = function() {
        for (turtle in this.turtleList) {
            if (this.turtleList[turtle].running) {
                return true;
            }
        }
        return false;
    }
}

// Queue entry for managing running blocks.
function Queue (blk, count, parentBlk) {
    this.blk = blk;
    this.count = count;
    this.parentBlk = parentBlk;
}


function makeTurtleBitmap(me, data, name, callback, extras) {
    // TODO : Creating normal turtle also works but we need a 3D turtle

    // Async creation of bitmap from SVG data
    // Works with Chrome, Safari, Firefox (untested on IE)
    var img = new Image();
        img.onload = function () {
            var canvas = document.createElement('canvas');
            complete = true;
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
            var bitmap = new THREE.Mesh(new THREE.PlaneBufferGeometry(img.width, img.height),material);
            bitmap.name = name;
            bitmap.imgWidth = img.width;
            bitmap.imgHeight = img.height;
            callback(me, name, bitmap, extras);
    }
    img.src = 'data:image/svg+xml;base64,' + window.btoa(
        unescape(encodeURIComponent(data)));


};
