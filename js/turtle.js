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

    /*Rotation Fuctions*/

    this.setRoll = function(degrees){
        var tempRot = degrees - this.roll;
        rotateAroundObjectAxis(this.axis,this.axisX,tempRot*Math.PI/180);
        this.axisY.applyAxisAngle(this.axisX.normalize(),tempRot*Math.PI/180);
        this.axisZ.applyAxisAngle(this.axisX.normalize(),tempRot*Math.PI/180);
        if(this.roll + tempRot >= 360)
            this.roll = this.roll + tempRot - 360;
        else if(this.roll + tempRot < 0 )
            this.roll = this.roll + tempRot + 360;
        else
            this.roll += tempRot;
        this.turtles.refreshCanvas(2);
    };

    this.setPitch = function(degrees){
        var tempRot = degrees - this.pitch;
        rotateAroundObjectAxis(this.axis,this.axisY,tempRot*Math.PI/180);
        this.axisX.applyAxisAngle(this.axisY.normalize(),tempRot*Math.PI/180);
        this.axisZ.applyAxisAngle(this.axisY.normalize(),tempRot*Math.PI/180);
        if(this.pitch + tempRot >= 360)
            this.pitch = this.pitch + tempRot - 360;
        else if(this.pitch + tempRot < 0 )
            this.pitch = this.pitch + tempRot + 360;
        else
            this.pitch += tempRot;
        this.turtles.refreshCanvas(2);
    };

    this.setYaw = function(degrees){
        var tempRot = degrees - this.yaw;
        rotateAroundObjectAxis(this.axis,this.axisZ,tempRot*Math.PI/180);
        this.axisX.applyAxisAngle(this.axisZ.normalize(),tempRot*Math.PI/180);
        this.axisY.applyAxisAngle(this.axisZ.normalize(),tempRot*Math.PI/180);
        if(this.yaw + tempRot >= 360)
            this.yaw = this.yaw + tempRot - 360;
        else if(this.yaw + tempRot < 0 )
            this.yaw = this.yaw + tempRot + 360;
        else
            this.yaw += tempRot;
        this.turtles.refreshCanvas(2);
    };

    this.doRoll = function(degrees){
        this.setRoll(this.roll+degrees);
    };

    this.doPitch = function(degrees){
        this.setPitch(this.pitch+degrees);
    };

    this.doYaw = function(degrees){
        this.setYaw(this.yaw+degrees);
    };


    
    // FIXME
    this.doShowImage = function(size, myImage) {
        // Add an image object to the canvas
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
            me.turtles.refreshCanvas(1);
        }
        image.src = myImage;
    }

    this.doShow3DModel = function(){
        // TODO : Create this function
    }

    // FIXME
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
            me.turtles.refreshCanvas(1);
        }
    }

    // TODO : Fix this function to change the turtle image, to be done when turtle graphic is finalized
    this.doTurtleShell = function(size, myImage) {
        // // Add image to turtle
        // if (myImage == null) {
        //     return;
        // }
        // var image = new Image();
        // image.src = myImage;
        // var me = this;
        // image.onload = function() {
        //     me.container.removeChild(me.bitmap);
        //     me.bitmap = new createjs.Bitmap(image);
        //     me.container.addChild(me.bitmap);
        //     me.bitmap.scaleX = Number(size) / image.width;
        //     me.bitmap.scaleY = me.bitmap.scaleX;
        //     me.bitmap.scale = me.bitmap.scaleX;
        //     me.bitmap.x = 0;
        //     me.bitmap.y = 0;
        //     me.bitmap.regX = image.width / 2;
        //     me.bitmap.regY = image.height / 2;
        //     me.bitmap.rotation = me.orientation;
        //     me.skinChanged = true;

        //     me.container.uncache();
        //     var bounds = me.container.getBounds();
        //     me.container.cache(bounds.x, bounds.y, bounds.width, bounds.height);

        //     // Recalculate the hit area as well.
        //     var hitArea = new createjs.Shape();
        //     hitArea.graphics.beginFill('#FFF').drawRect(0, 0, bounds.width, bounds.height);
        //     hitArea.x = -bounds.width / 2;
        //     hitArea.y = -bounds.height / 2;
        //     me.container.hitArea = hitArea;

        //     if (me.startBlock != null) {
        //         me.startBlock.container.removeChild(me.decorationBitmap);
        //         me.decorationBitmap = new createjs.Bitmap(myImage);
        //         me.startBlock.container.addChild(me.decorationBitmap);
        //         me.decorationBitmap.name = 'decoration';
        //         var bounds = me.startBlock.container.getBounds();
        //         // FIXME: Why is the position off? Does it need a scale factor?
        //         me.decorationBitmap.x = bounds.width - 50 * me.startBlock.protoblock.scale / 2;
        //         me.decorationBitmap.y = 20 * me.startBlock.protoblock.scale / 2;
        //         me.decorationBitmap.scaleX = (27.5 / image.width) * me.startBlock.protoblock.scale / 2;
        //         me.decorationBitmap.scaleY = (27.5 / image.height) * me.startBlock.protoblock.scale / 2;
        //         me.decorationBitmap.scale = (27.5 / image.width) * me.startBlock.protoblock.scale / 2;
        //         me.startBlock.container.updateCache();
        //     }
        //     me.turtles.refreshCanvas(1);
        // }
    }

    this.resizeDecoration = function(scale, width) {
        this.decorationBitmap.x = width - 30 * scale / 2;
        this.decorationBitmap.y = 35 * scale / 2;
        this.decorationBitmap.scaleX = this.decorationBitmap.scaleY = this.decorationBitmap.scale = 0.5 * scale / 2
    }

    this.doShowText = function(size, myText) {
        // TODO : Add a text or image object to the canvas
    }

    this.doSetFont = function(font) {
        this.font = font;
        this.turtles.refreshCanvas(1);  
        this.turtles.refreshCanvas(2);
    }


    this.doSetColor = function(color) {
        // Color sets hue but also selects maximum chroma.
        this.color = Number(color);
        var results = getcolor(this.color);
        this.canvasValue = results[0];
        this.canvasChroma = results[1];
        this.canvasColor = results[2];
        // TODO : Set color to this.canvasColor
    }

    this.doSetHue = function(hue) {
        this.color = Number(hue);
        this.canvasColor = getMunsellColor(this.color, this.value, this.chroma);
        // TODO : Set color to this.canvasColor
    }

    this.doSetValue = function(shade) {
        this.closeSVG();
        this.value = Number(shade);
        this.canvasColor = getMunsellColor(this.color, this.value, this.chroma);
        // TODO : Set color to this.canvasColor
    }

    this.doSetChroma = function(chroma) {
        this.chroma = Number(chroma);
        this.canvasColor = getMunsellColor(this.color, this.value, this.chroma);
        // TODO : Set color to this.canvasColor
    }

    this.doSetPensize = function(size) {
        this.stroke = size;
        // TODO : Add option to set pen styles
        // this.drawingCanvas.graphics.setStrokeStyle(this.stroke, 'round', 'round');
    }

    this.doPenUp = function() {
        this.penState = false;
    }

    this.doPenDown = function() {
        this.penState = true;
    }

    this.doStartFill = function() {
        // start tracking points here
        // TODO : Add a function to check and do fill operations
        this.fillState = true;
    }

    this.doEndFill = function() {
        /// redraw the points with fill enabled
        // TODO : Add a function to check and do fill operations
        this.fillState = false;
    }

};


function Turtles(canvas, stage2D, stage3D, refreshCanvas) {
    this.canvas = canvas;
    
    // TODO : Remove the concept of two stages when the turtle becomes a 3D model instead.
    this.stage2D = stage2D;
    this.stage3D = stage3D;

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
        // myTurtle.drawingCanvas = new createjs.Shape();
        // this.stage3D.add(myTurtle.drawingCanvas);
        // In theory, this prevents some unnecessary refresh of the
        // canvas.
        // myTurtle.drawingCanvas.tickEnabled = false;

        var turtleImage = new Image();
        i %= 10;

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
