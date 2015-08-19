// TODO :
// (1) Make a utility to produce a thick line in windows (IMP)


// Turtles
var DEFAULTCOLOR = 0;
var DEFAULTVALUE = 50;
var DEFAULTCHROMA = 100;
var DEFAULTSTROKE = 3;
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
    this.material = new THREE.LineBasicMaterial({color: this.canvasColor, linewidth: this.stroke});
    this.media = [];  // Media (text, images) we need to remove on clear.

    // Turtle functions
    this.doClear = function() {
        // Reset turtle.
        var i = this.turtles.turtleList.indexOf(this) % 10;
        this.color = i * 10;
        this.value = DEFAULTVALUE;
        this.chroma = DEFAULTCHROMA;
        this.stroke = DEFAULTSTROKE;
        this.font = DEFAULTFONT;

        if(this.axis){ // Can occur if the turtle is still not initialized
            this.axis.position.copy(ORIGIN);
        }

        this.setCameraPosition(60,60,60);
        this.setCameraLookat(0,0,0);

        this.position.copy(ORIGIN);

        clearCanvas(this.drawingCanvas);

        this.setRoll(0);
        this.setPitch(0);
        this.setYaw(0);

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
        alongX.copy(this.axisX);
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

    // Camera options

    this.setCameraPosition = function(x,y,z){
        var dx,dy,dz;
        dx = x - this.turtles.camera.position.x;
        dy = z - this.turtles.camera.position.y;
        dz = y - this.turtles.camera.position.z;
        this.cameraForwardX(dx);
        this.cameraForwardY(dy);
        this.cameraForwardZ(dz);
    }

    this.setCameraLookat = function(x,y,z){
        this.turtles.camera.lookAt(new THREE.Vector3(x,y,z));
        this.turtles.refreshCanvas(2);
    }

    this.cameraForwardX = function(value){
        var currentX = { x : this.turtles.camera.position.x };
        var finalX = currentX.x + value;
        var me = this;
        var tween = TweenLite.to(currentX, 0.5, {   
                x : finalX,
                onUpdate: function() {
                    me.turtles.camera.position.setX(currentX.x);
                    me.turtles.refreshCanvas(2);
                }
        });
    }


    this.cameraForwardY = function(value){
        var currentY = { y : this.turtles.camera.position.y };
        var finalY = currentY.y + value;
        var me = this;
        var tween = TweenLite.to(currentY, 0.5, {   
                y : finalY,
                onUpdate: function() {
                    me.turtles.camera.position.setY(currentY.y);
                    me.turtles.refreshCanvas(2);
                }
        });
    }


    this.cameraForwardZ = function(value){
        var currentZ = { z : this.turtles.camera.position.z };
        var finalZ = currentZ.z + value;
        var me = this;
        var tween = TweenLite.to(currentZ, 0.5, {   
                z : finalZ,
                onUpdate: function() {
                    me.turtles.camera.position.setZ(currentZ.z);
                    me.turtles.refreshCanvas(2);
                }
        });
    }

    // TODO : Add circumference rotations
    this.cameraRoll = function(degrees){
        var DEGTORAD = Math.PI / 180;
        var RADTODEG = 180 / Math.PI;
        this.turtles.refreshCanvas(2);
        
    }

    this.cameraPitch = function(degrees){
        var currentRotate = { x : this.turtles.camera.rotation.x , y : this.turtles.camera.rotation.y , z : this.turtles.camera.rotation.z };
        this.turtles.refreshCanvas(2);

    }

    this.cameraYaw = function(degrees){
        this.turtles.refreshCanvas(2);
    }


// 
    this.doShowImage = function(size, myImage) {
        // Set the orientation of the image
    }

    this.doShow3DModel = function(){
        // Show the 3D model
    }

    this.doShowURL = function(size, myURL) {
        // if (myURL == null) {
        //     return;
    }

    this.resizeDecoration = function(scale, width) {
        // this.decorationBitmap.x = width - 30 * scale / 2;
        // this.decorationBitmap.y = 35 * scale / 2;
        // this.decorationBitmap.scaleX = this.decorationBitmap.scaleY = this.decorationBitmap.scale = 0.5 * scale / 2
    }

    this.doShowText = function(size, myText) {
        // TODO : Add a text or image object to the canvas
        // This object should be 3D Text
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
        this.material = new THREE.LineBasicMaterial({color: this.canvasColor, linewidth: this.stroke});
        this.turtles.refreshCanvas(2);
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
        this.material = new THREE.LineBasicMaterial({color: this.canvasColor, linewidth: this.stroke});
    }

    this.doPenUp = function() {
        this.penState = false;
    }

    this.doPenDown = function() {
        this.penState = true;
    }

     // TODO : Add a function to check and do fill operations
    this.doStartFill = function() {
        // start tracking points here
        this.fillState = true;
    }

    // TODO : Add a function to check and do fill operations
    this.doEndFill = function() {
        /// redraw the points with fill enabled
        this.fillState = false;
    }

};


function Turtles(canvas, stage2D, stage3D, camera, refreshCanvas) {
    this.canvas = canvas;
    
    this.stage2D = stage2D;
    this.stage3D = stage3D;

    this.camera = camera;

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

        // Add's a 3D Axis to the turtle
        var axislength = 8;
        turtleAxis = new THREE.Object3D();
        turtleAxis.add(new THREE.ArrowHelper(XAXIS, ORIGIN, axislength, 0xff0000, 1, 1), new THREE.ArrowHelper(YAXIS, ORIGIN, axislength, 0x00ff00, 1, 1),new THREE.ArrowHelper(ZAXIS, ORIGIN, axislength, 0x0000ff, 1, 1));
        myTurtle.axis = turtleAxis;
        stage3D.add(turtleAxis);
        // Adds the drawing canvas of a block
        stage3D.add(myTurtle.drawingCanvas);
        this.refreshCanvas(2);

        // myTurtle.container.position.x = this.turtleX2screenX(myTurtle.x);
        // myTurtle.container.position.y = this.turtleY2screenY(myTurtle.y);
        // myTurtle.container.position.setX(myTurtle.x);
        // myTurtle.container.position.setY(myTurtle.y);

        function processTurtleBitmap(me, name, bitmap, startBlock) {
            myTurtle.bitmap = bitmap;
            myTurtle.bitmap.cursor = 'pointer';
            myTurtle.startBlock = startBlock;

            if (startBlock != null) {
                
                if(startBlock.decorationContainer === null){
                    startBlock.decorationContainer = new THREE.Group();
                    startBlock.container.add(startBlock.decorationContainer)
                }
                startBlock.decorationContainer.add(myTurtle.bitmap);

                var bounds = new THREE.Box3().setFromObject( startBlock.container );
                startBlock.bounds = bounds;
                startBlock.bounds.size = startBlock.bounds.size();

                startBlock.decorationContainer.position.setX(bounds.size.x / 2 - 20);
                startBlock.decorationContainer.position.setY(-(startBlock.docks[1][1] + startBlock.docks[0][1]) / 2);

            }
            loadBlockInfo(me,myTurtle,blkInfoAvailable);
            me.refreshCanvas(1);
        }
        makeTurtleBitmap(this, TURTLESVG.replace(/fill_color/g, FILLCOLORS[i]).replace(/stroke_color/g, STROKECOLORS[i]), 'turtle', processTurtleBitmap, startBlock, 0.5 * startBlock.protoblock.scale / 2 );
    }

    // TODO : When the blkInfoAvailable data is fixed in blocks.js update this file
    function loadBlockInfo(turtles, myTurtle, blkInfoAvailable){
        document.getElementById('loader').className = '';
        setTimeout(function() {
            if (blkInfoAvailable) {
                // myTurtle.doSetHeading(infoDict['heading']);
                // myTurtle.doSetPensize(infoDict['pensize']);
                // myTurtle.doSetChroma(infoDict['grey']);
                // myTurtle.doSetValue(infoDict['shade']);
                // myTurtle.doSetColor(infoDict['color']);
            }
        }, 1000);
        turtles.refreshCanvas(1);
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


function makeTurtleBitmap(me, data, name, callback, extras, scale) {
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
            callback(me, name, bitmap, extras);
    }
    img.src = 'data:image/svg+xml;base64,' + window.btoa(
        unescape(encodeURIComponent(data)));

};
