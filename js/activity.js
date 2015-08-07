// Bug List
    // FIXME
    // TODO
    // PE : Probable source of error

// Done list
    // createMsgContainer();
    // creatErrorContainer();
    // setupBlocksContainerEvents();

// TODO
    // Add touch support by using on cordova

// NEWS



// Code Snippets
    // createMsgContainer
        // Code to add a bounding box
        // var box = new THREE.BoxHelper( msgBlock );
        // scriptingScene.add(box);

        // Code to get 2D bounds of the container
        // console.log(get2DBounds(container,false));

        // Code to make the error handler draggable
        // var px,py;
        // var coor = new THREE.Vector3();
        // coor.z = 0;
        // container.on('pressmove',function(event){
        //     if(!px || !py){
        //         px = event.clientX;
        //         py = event.clientY;
        //     }
            // else{
        //         coor.x = event.clientX - px;
        //         coor.y = py - event.clientY;
        //     }
        //     container.position.add(coor);
        //     px = event.clientX;
        //     py = event.clientY;
        //     refreshCanvas(1);
        // });
        // container.on('pressup',function(event){
            // px = false;
            // py = false;
        // });

        // Code to add axes to any container
        // axes = buildAxes( 1000 );
        // container.add( axes );



// var lang = document.webL10n.getLanguage();
// if (lang.indexOf("-") != -1) {
//     lang = lang.slice(0, lang.indexOf("-"));
//     document.webL10n.setLanguage(lang);
// }

define(function(require) {
    require('easeljs');
    require('preloadjs');
    require('howler');
    require('p5.sound');
    require('p5.dom');
    require('mespeak');
    require('jquery-1.11.3.min');
    // require('activity/utils');
    require('activity/artwork');
    require('activity/munsell');
    require('activity/trash');
    require('activity/turtle');
    require('activity/palette');
    require('activity/protoblocks');
    require('activity/blocks');
    require('activity/block');
    require('activity/logo');
    require('activity/clearbox');
    require('activity/samplesviewer');
    require('activity/basicblocks');
    require('activity/blockfactory');

    // Manipulate the DOM only when it is ready.
    require(['domReady!'], function(doc) {

        window.scroll(0, 0);

        try {
            meSpeak.loadConfig('lib/mespeak_config.json');
            meSpeak.loadVoice('lib/voices/en/en.json');
        } catch (e) {
            console.log(e);
        }

        // var canvas = docById('myCanvas');
        var canvas = docById('scriptingOutput');

        // See why is this queue created?
        // var queue = new createjs.LoadQueue(false);

        // Check for the various File API support.
        if (window.File && window.FileReader && window.FileList && window.Blob) {
            var files = true;
        } else {
            alert('The File APIs are not fully supported in this browser.');
            var files = false;
        }

        // Set up a file chooser for the doOpen function.
        var fileChooser = docById('myOpenFile');
        // Set up a file chooser for the doOpenPlugin function.
        var pluginChooser = docById('myOpenPlugin');
        // The file chooser for all files.
        var allFilesChooser = docById('myOpenAll')

        // Are we running off of a server?
        var server = true;
        var scale = 1;
        var stage;
        var turtles;
        var palettes;
        var blocks;
        var logo;
        var clearBox;
        var thumbnails;
        var buttonsVisible = true;
        var headerContainer = null;
        var toolbarButtonsVisible = true;
        var menuButtonsVisible = false;
        var menuContainer = null;
        var currentKey = '';
        var currentKeyCode = 0;
        var lastKeyCode = 0;
        var pasteContainer = null;

        // See where is this scene variable used?
        // var scene;


        // Setup variables for three.js
        var scriptingScene;
        var turtleScene;

        var scriptingCameraWidth;
        var scriptingCameraHeight;
        var scriptingCamera;

        var turtleCameraWidth;
        var turtleCameraHeight;
        var turtleCamera;

        var scriptingRenderer;
        var turtleRenderer;

        var ambientLight;

        // Variable initialization done


        pluginObjs = {
            'PALETTEPLUGINS': {},
            'PALETTEFILLCOLORS': {},
            'PALETTESTROKECOLORS': {},
            'PALETTEHIGHLIGHTCOLORS': {},
            'FLOWPLUGINS': {},
            'ARGPLUGINS': {},
            'BLOCKPLUGINS': {}
        };

        // Stacks of blocks saved in local storage
        var macroDict = {};

        var stopTurtleContainer = null;
        var stopTurtleContainerX = 0;
        var stopTurtleContainerY = 0;
        var cameraID = null;
        var toLang = null;
        var fromLang = null;

        // initial scroll position
        var scrollX = 0;
        var scrollY = 0;

        // default values
        var CAMERAVALUE = '##__CAMERA__##';
        var VIDEOVALUE = '##__VIDEO__##';

        var DEFAULTDELAY = 500;  // milleseconds
        var TURTLESTEP = -1;  // Run in step-by-step mode

        var blockscale = 2;
        var blockscales = [1, 1.5, 2, 3, 4];

        // Time when we hit run
        var time = 0;

        // Used by pause block
        var waitTime = {};

        // Used to track mouse state for mouse button block
        var stageMouseDown = false;
        var stageX = 0;
        var stageY = 0;

        var onAndroid = /Android/i.test(navigator.userAgent);
        console.log('on Android? ' + onAndroid);

        var onXO = (screen.width == 1200 && screen.height == 900) || (screen.width == 900 && screen.height == 1200);
        console.log('on XO? ' + onXO);

        var cellSize = 55;
        if (onXO) {
            cellSize = 75;
        };

        var onscreenButtons = [];
        var onscreenMenu = [];

        var helpContainer = null;
        var helpIdx = 0;
        var HELPCONTENT = [[_('Welcome to Turtle Blocks 3D'), _('Turtle Blocks is a Logo-inspired turtle that draws colorful pictures with snap-together visual-programming blocks.'), 'activity/activity-icon-color.svg'],
                           [_('Palette buttons'), _('This toolbar contains the palette buttons: click to show or hide the palettes of blocks (Turtle, Pen, Numbers, Boolean, Flow, Blocks, Media, Sensors, and Extras). Once open, you can drag blocks from the palettes onto the canvas to use them.'), 'images/icons.svg'],
                           [_('Run fast'), _('Click to run the project in fast mode.'), 'icons/fast-button.svg'],
                           [_('Run slow'), _('Click to run the project in slow mode.'), 'icons/slow-button.svg'],
                           [_('Run step by step'), _('Click to run the project step by step.'), 'icons/step-button.svg'],
                           [_('Stop'), _('Stop the current project.'), 'icons/stop-turtle-button.svg'],
                           [_('Clean'), _('Clear the screen and return the turtles to their initial positions.'), 'icons/clear-button.svg'],
                           [_('Show/hide palettes'), _('Hide or show the block palettes.'), 'icons/palette-button.svg'],
                           [_('Show/hide blocks'), _('Hide or show the blocks and the palettes.'), 'icons/hide-blocks-button.svg'],
                           [_('Expand/collapse collapsable blocks'), _('Expand or collapse stacks of blocks, e.g, start and action stacks.'), 'icons/collapse-blocks-button.svg'],
                           [_('Help'), _('Show these messages.'), 'icons/help-button.svg'],
                           [_('Expand/collapse option toolbar'), _('Click this button to expand or collapse the auxillary toolbar.'), 'icons/menu-button.svg'],
                           [_('Load samples from server'), _('This button opens a viewer for loading example projects.'), 'icons/planet-button.svg'],
                           [_('Paste'), _('The paste button is enabled then there are blocks copied onto the clipboard.'), 'icons/paste-disabled-button.svg'],
                           [_('Cartesian'), _('Show or hide a Cartesian-coordinate grid.'), 'icons/Cartesian-button.svg'],
                           [_('Polar'), _('Show or hide a polar-coordinate grid.'), 'icons/polar-button.svg'],
                           [_('Load plugin from file'), _('You can load new blocks from the file system.'), 'icons/plugin-button.svg'],
                           [_('Delete all'), _('Remove all content on the canvas, including the blocks.'), 'icons/empty-trash-button.svg'],
                           [_('Undo'), _('Restore blocks from the trash.'), 'icons/restore-trash-button.svg'],
                           [_('Congratulations.'), _('You have finished the tour. Please enjoy Turtle Blocks!'), 'activity/activity-icon-color.svg']]

        pluginsImages = {};

        function allClear() {
            logo.boxes = {};
            logo.time = 0;
            hideMsgs();
            logo.setBackgroundColor(-1);
            for (var turtle = 0; turtle < turtles.turtleList.length; turtle++) {
                turtles.turtleList[turtle].doClear();
            }
            blocksContainer.position.setX(0);
            blocksContainer.position.setY(0);
        }

        function doFastButton() {
            logo.setTurtleDelay(0);
            if (!turtles.running()) {
                logo.runLogoCommands();
            } else {
                logo.step();
            }
        }

        function doSlowButton() {
            logo.setTurtleDelay(DEFAULTDELAY);
            if (!turtles.running()) {
                logo.runLogoCommands();
            } else {
                logo.step();
            }
        }

        function doStepButton() {
            var turtleCount = 0;
            for (var turtle in logo.stepQueue) {
                turtleCount += 1;
            }
            if (turtleCount == 0 || logo.turtleDelay != TURTLESTEP) {
                // Either we haven't set up a queue or we are
                // switching modes.
                logo.setTurtleDelay(TURTLESTEP);
                // Queue and take first step.
                if (!turtles.running()) {
                    logo.runLogoCommands();
                }
                logo.step();
            } else {
                logo.setTurtleDelay(TURTLESTEP);
                logo.step();
            }
        }

        var stopTurtle = false;
        function doStopButton() {
            logo.doStopTurtle();
        }

        var cartesianVisible = false;
        function doCartesian() {
            if (cartesianVisible) {
                hideCartesian();
                cartesianVisible = false;
            } else {
                showCartesian();
                cartesianVisible = true;
            }
        }

        var polarVisible = false;
        function doPolar() {
            if (polarVisible) {
                hidePolar();
                polarVisible = false;
            } else {
                showPolar();
                polarVisible = true;
            }
        }

        function doBiggerFont() {
            if (blockscale < blockscales.length - 1) {
                blockscale += 1;
                blocks.setBlockScale(blockscales[blockscale]);
            }
        }

        function doSmallerFont() {
            if (blockscale > 0) {
                blockscale -= 1;
                blocks.setBlockScale(blockscales[blockscale]);
            }
        }

        // Do we need to update the stage?
        var update = true;

        // The dictionary of action name: block
        var actions = {};

        // The dictionary of box name: value
        var boxes = {};

        // Coordinate grid
        var cartesianBitmap = null;

        // Polar grid
        var polarBitmap = null;

        // Msg block
        var msgText = null;

        // ErrorMsg block
        var errorMsgText = null;
        var errorMsgArrow = null;
        var errorArtwork = {};
        var ERRORARTWORK = ['emptybox', 'emptyheap', 'negroot', 'noinput', 'zerodivide', 'notanumber', 'nostack'];

        // Get things started
        init();

        function init() {
            docById('loader').className = 'loader';

            // Three.js initialization
            // Create a scriptingScene, that will hold all our elements such as objects, cameras and lights.
            scriptingScene = new THREE.Scene();

            // Create a turtleScene that will hold all the turtle elements this demarcation of scenes has been done because
            // of difference in cameras but this can cause problems with selecting the turtle
            turtleScene = new THREE.Scene();


            // Create a orthographic camera for the graphical scripting
            scriptingCameraWidth = window.innerWidth;
            scriptingCameraHeight = window.innerHeight; 
            scriptingCamera = new THREE.OrthographicCamera( scriptingCameraWidth / - 2, scriptingCameraWidth / 2, scriptingCameraHeight / 2, scriptingCameraHeight / - 2, 1, 1000 );

            turtleCameraWidth = window.innerWidth;
            turtleCameraHeight = window.innerHeight;
            turtleCamera = new THREE.PerspectiveCamera( 45, turtleCameraWidth / turtleCameraHeight, 1, 2000 );

            // Create a scripting renderer and set the size
            scriptingRenderer = new THREE.WebGLRenderer( { alpha: true, antialias : true} );
            scriptingRenderer.setSize(window.innerWidth, window.innerHeight);
            scriptingRenderer.shadowMapEnabled = true;
            document.getElementById("scriptingOutput").appendChild(scriptingRenderer.domElement);


            // Create the turtle renderer and set the size
            turtleRenderer = new THREE.WebGLRenderer( {alpha: true, antialias : true} );
            turtleRenderer.setSize(window.innerWidth, window.innerHeight);
            turtleRenderer.shadowMapEnabled = true;
            document.getElementById("turtleOutput").appendChild(turtleRenderer.domElement);

            // Position and point the scripting camera to the center of the scene
            scriptingCamera.position.x = 0;
            scriptingCamera.position.y = 0;
            scriptingCamera.position.z = 10000;
            scriptingCamera.lookAt(new THREE.Vector3(0, 0, 0));

            // Position and point the turtle camera to the center of the screen
            turtleCamera.position.x = 50;
            turtleCamera.position.y = 50;
            turtleCamera.position.z = 50;
            turtleCamera.lookAt(new THREE.Vector3(0,0,0));

            // Add ambient light to the scripting scene
            ambientLight = new THREE.AmbientLight(0xffffff);
            scriptingScene.add(ambientLight);

            // Add ambient light to the turtle scene
            turtleScene.add(ambientLight);

            // Axes
            axes = buildAxes( 1000 );
            scriptingScene.add( axes );

            // Initialize the DOM Mouse Events
            var events = ['click','dblclick','mousedown','mouseup','mousemove'];
            initMouseEvents(events,scriptingRenderer,scriptingCamera);

            // TODO create a tick library for three.js

            createMsgContainer('#ffffff', '#7a7a7a', function(text) {
                msgText = text;
            }, 55);

            createMsgContainer('#ffcbc4', '#ff0031', function(text) {
                errorMsgText = text;
            }, 110);

            createErrorContainers();

            /* Z-Order (top to bottom):
             *   menus 
             *   palettes
             *   blocks
             *   trash
             *   turtles
             *   logo (drawing)
             */

            palettesContainer = new THREE.Group();
            blocksContainer = new THREE.Group();
            trashContainer = new THREE.Group();
            turtle2DContainer = new THREE.Group();
            turtle3DContainer = new THREE.Group();

            scriptingScene.add(palettesContainer,blocksContainer,trashContainer,turtle2DContainer);
            turtleScene.add(turtle3DContainer);
            setupBlocksContainerEvents();

            trashcan = new Trashcan(canvas, trashContainer, cellSize, refreshCanvas);
            turtles = new Turtles(canvas, turtle2DContainer, turtle3DContainer, refreshCanvas);
            blocks = new Blocks(canvas, blocksContainer, refreshCanvas, trashcan);
            palettes = initPalettes(canvas, refreshCanvas, palettesContainer, cellSize, trashcan, blocks);

            palettes.setBlocks(blocks);
            turtles.setBlocks(blocks);
            blocks.setTurtles(turtles);
            blocks.setErrorMsg(errorMsg);
            blocks.makeCopyPasteButtons(makeButton, updatePasteButton);

            // TODO: clean up this mess.
            logo = new Logo(canvas, blocks, turtles, turtle2DContainer, turtle3DContainer,
                            refreshCanvas,
                            textMsg, errorMsg, hideMsgs, onStopTurtle,
                            onRunTurtle, prepareExport, getStageX, getStageY,
                            getStageMouseDown, getCurrentKeyCode,
                            clearCurrentKeyCode, meSpeak, saveLocally);
            blocks.setLogo(logo);

            // Set the default background color...
            logo.setBackgroundColor(-1);

            clearBox = new ClearBox(canvas, stage, refreshCanvas, sendAllToTrash);

            thumbnails = new SamplesViewer(canvas, stage, refreshCanvas, loadProject, loadRawProject, sendAllToTrash);

            initBasicProtoBlocks(palettes, blocks);

            // Load any macros saved in local storage.
            var macroData = localStorage.getItem('macros');
            if (macroData != null) {
                processMacroData(macroData, palettes, blocks, macroDict);
            }
            // Blocks and palettes need access to the macros dictionary.
            blocks.setMacroDictionary(macroDict);
            palettes.setMacroDictionary(macroDict);

            // FIXME : Activate this local storage retrive when everything else works fine
            // Load any plugins saved in local storage.
            // var pluginData = localStorage.getItem('plugins');
            // if (pluginData != null) {
            //     var obj = processPluginData(pluginData, palettes, blocks, logo.evalFlowDict, logo.evalArgDict, logo.evalParameterDict, logo.evalSetterDict);
            //     updatePluginObj(obj);
            // }

            fileChooser.addEventListener('click', function(event) { this.value = null; });
            fileChooser.addEventListener('change', function(event) {

                // Read file here.
                var reader = new FileReader();

                reader.onload = (function(theFile) {
                    // Show busy cursor.
                    document.body.style.cursor = 'wait';
                    setTimeout(function() {
                        var rawData = reader.result;
                        var cleanData = rawData.replace('\n', ' ');
                        console.log(cleanData);
                        var obj = JSON.parse(cleanData);
                        console.log(obj)
                        blocks.loadNewBlocks(obj);
                        // Restore default cursor.
                        document.body.style.cursor = 'default';
                    }, 200);
                });

                reader.readAsText(fileChooser.files[0]);
            }, false);

            allFilesChooser.addEventListener('click', function(event) { this.value = null; });

            pluginChooser.addEventListener('click', function(event) {
                window.scroll(0, 0);
                this.value = null;
            });
            pluginChooser.addEventListener('change', function(event) {
                window.scroll(0, 0)

                // Read file here.
                var reader = new FileReader();

                reader.onload = (function(theFile) {
                    // Show busy cursor.
                    document.body.style.cursor = 'wait';
                    setTimeout(function() {
                        obj = processRawPluginData(reader.result, palettes, blocks, errorMsg, logo.evalFlowDict, logo.evalArgDict, logo.evalParameterDict, logo.evalSetterDict);
                        // Save plugins to local storage.
                        if (obj != null) {
                            var foo = preparePluginExports(obj);
                            console.log(foo);
                            localStorage.setItem('plugins', foo); // preparePluginExports(obj));
                        }

                        // Refresh the palettes.
                        setTimeout(function() {
                            if (palettes.visible) {
                                palettes.hide();
                            }
                            palettes.show();
                            palettes.bringToTop();
                        }, 1000);

                        // Restore default cursor.
                        document.body.style.cursor = 'default';
                    }, 200);
                });

                reader.readAsText(pluginChooser.files[0]);
            }, false);

            cartesianBitmap = createGrid('images/Cartesian.svg','cartesian');
            polarBitmap = createGrid('images/polar.svg','polar');

            var URL = window.location.href;
            var projectName = null; 
            try {
                httpGet(null);
                console.log('running from server or the user can access to examples.');
                server = true;
            } catch (e) {
                console.log('running from filesystem or the connection isnt secure');
                server = false;
            }

            setupAndroidToolbar();

            // Scale the canvas relative to the screen size.
            onResize();

            if (URL.indexOf('?') > 0) {
                var urlParts = URL.split('?');
                if (urlParts[1].indexOf('=') > 0) {
                    var projectName = urlParts[1].split('=')[1];
                }
            }
            if (projectName != null) {
                setTimeout(function () { console.log('load ' + projectName); loadProject(projectName); }, 2000);
            } else {
                setTimeout(function () { loadStart(); }, 2000);
            }

            document.addEventListener('mousewheel', scrollEvent, false);
            document.addEventListener('DOMMouseScroll', scrollEvent, false);

            this.document.onkeydown = keyPressed;
        }

        // FIXME : Works well before clicking any block and then stops working
        // FIXME : Is not detecting clicks well
        function setupBlocksContainerEvents() {
            var moving = false;
            var lastCords;

            scriptingRenderer.domElement.addEventListener( 'mousedown',  function(event){
                stagemousedown = true;
                var mouseTHREECoordinates = {};
                var intersects;
                mouseTHREECoordinates.x = ( event.clientX / scriptingRenderer.domElement.width ) * 2 - 1;
                mouseTHREECoordinates.y = - ( event.clientY / scriptingRenderer.domElement.height ) * 2 + 1;
                raycaster.setFromCamera( mouseTHREECoordinates, scriptingCamera ); 
                intersects = raycaster.intersectObjects(scriptingScene.children,true);

                // Only checks till immidiate parent for visibility
                for(var i = intersects.length - 1; i>=0; i--){
                    if(intersects[i].object.visible === false || intersects[i].object.parent.visible === false){
                        intersects.splice(i,1);
                    }
                }

                if (intersects.length > 0 || turtles.running()) {
                    return;
                }

                moving = true;
                lastCords = {x: event.clientX, y: event.clientY};
            }, false);

            scriptingRenderer.domElement.addEventListener( 'mouseup',  function(event){
                moving = false;
                stagemousedown = false;
            }, false);

            scriptingRenderer.domElement.addEventListener('mousemove',function(event){
                if (!moving) {
                    return;
                }
                stageX = event.clientX;
                stageY = event.clientY;

                // blocksContainer.position.setX(blocksContainer.position.x + event.clientX - lastCords.x);
                // blocksContainer.position.setY(blocksContainer.position.y - event.clientY + lastCords.y);
                lastCords = {x: event.clientX, y: event.clientY};
                refreshCanvas(1);
            },false);    
        }

        function scrollEvent(event) {
            var data = event.wheelDelta || -event.detail;
            var delta = Math.max(-1, Math.min(1, (data)));
            var scrollSpeed = 3;

            if (event.clientX < cellSize) {
                palettes.menuScrollEvent(delta, scrollSpeed);
            } else {
                palette = palettes.findPalette(event.clientX, event.clientY);
                if (palette) {
                    palette.scrollEvent(delta, scrollSpeed);
                }
            }
        }

        function getStageX() {
            return turtles.screenX2turtleX(stageX / blocks.scale);
        }

        function getStageY() {
            return turtles.screenY2turtleY(stageY / blocks.scale);
        }

        function getStageMouseDown() {
            return stageMouseDown;
        }

        function setCameraID(id) {
            cameraID = id;
        }

        function createGrid(imagePath,name) {
            var container = new THREE.Group();
            scriptingScene.add(container);

            var img = new Image();
            img.onload = function() {

                var canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                var context = canvas.getContext('2d');
                context.drawImage(img, 0, 0);
                var texture = new THREE.Texture(canvas);
                texture.needsUpdate = true;
                texture.minFilter = THREE.NearestFilter; 
                var material = new THREE.MeshBasicMaterial( {map: texture, transparent : true, depthWrite : false} );
                var bitmap = new THREE.Mesh(new THREE.PlaneBufferGeometry(img.width, img.height),material);
                bitmap.name = name;
                bitmap.imgWidth = img.width;
                bitmap.imgHeight = img.height;

                // TODO : Set scaling when size is different
                // if(size != originalSize){
                //     bitmap.scale.setX(size/originalSize);
                //     bitmap.scale.setY(size/originalSize);
                // }

                container.add(bitmap);
                bitmap.visible = false;
                refreshCanvas(1);
            }
            img.src = imagePath;
            return container;
        };


        function createMsgContainer(fillColor, strokeColor, callback, y) {
            var container = new THREE.Group();
            scriptingScene.add(container);
            container.position.set(0, window.innerHeight/2 - (y+cellSize/2),1); //cellsize/2 to center it
            container.visible = false;

            // axes = buildAxes( 1000 );
            // container.add( axes );

            var img = new Image();
            var svgData = MSGBLOCK.replace('fill_color', fillColor).replace(
                'stroke_color', strokeColor);
            var img = new Image();
            img.onload = function(){
                var texture = new THREE.Texture(img) 
                texture.needsUpdate = true;
                texture.minFilter = THREE.NearestFilter; 
                var material = new THREE.MeshBasicMaterial( {map: texture, side: THREE.DoubleSide} );
                material.transparent = true;
                var msgBlock = new THREE.Mesh(new THREE.PlaneBufferGeometry(img.width, img.height),material);
                container.add(msgBlock);

                var options = {'font' : 'helvetiker','weight' : 'normal', 'style' : 'normal','size' : 15,'curveSegments' : 20};
                var textShapes = THREE.FontUtils.generateShapes( 'The message has changed and has been replaced', options );
                var text = new THREE.ShapeGeometry( textShapes );
                var textMesh = new THREE.Mesh( text, new THREE.MeshBasicMaterial( { color: 0x000000 } ) ) ;
                
                textMesh.geometry.computeBoundingBox(); 
                var textbounds = textMesh.geometry.boundingBox.size();
                textMesh.position.set(-textbounds.x/2,-textbounds.y/4,1); // FLAG : See why -textbounds.y/4 works
                container.add(textMesh);

                container.hitmesh = msgBlock;

                // container.on('click',function(){
                //     container.visible = false;
                //     if (errorMsgArrow !== null) {
                //         errorMsgArrow.removeAllChildren(); // Hide the error arrow.
                //     }
                //     refreshCanvas(1);
                // });

                // FIXME : Implement the new drag and drop functionality

                var px,py;
                var coor = new THREE.Vector3();
                coor.z = 0;
                container.on('pressmove',function(event){
                    if(!px || !py){
                        px = event.clientX;
                        py = event.clientY;
                    }
                    else{
                        coor.x = event.clientX - px;
                        coor.y = py - event.clientY;
                    }
                    container.position.add(coor);
                    px = event.clientX;
                    py = event.clientY;
                    refreshCanvas(1);
                });
                container.on('pressup',function(event){
                    px = false;
                    py = false;
                });

                refreshCanvas(1);
                callback(textMesh);
                blocks.setMsgText(textMesh);

            }
            img.src = 'data:image/svg+xml;base64,' + window.btoa(
                unescape(encodeURIComponent(svgData)));
        };


        function createErrorContainers() {
            // Some error messages have special artwork.
            for (var i = 0; i < ERRORARTWORK.length; i++) {
                var name = ERRORARTWORK[i];
                makeErrorArtwork(name);
            }
        }

        // TODO : Replace the manual text creation with function
        function makeErrorArtwork(name) {
            var container = new THREE.Group();
            scriptingScene.add(container);
            container.position.set(-200 , threeCoorY(cellSize*2)-100,1);
            errorArtwork[name] = container;
            errorArtwork[name].name = name;
            errorArtwork[name].visible = false;

            var img = new Image();
            img.onload = function() {
                console.log('creating error message artwork for ' + img.src);
                var texture = new THREE.Texture(img) 
                texture.needsUpdate = true;
                texture.minFilter = THREE.NearestFilter; 
                var material = new THREE.MeshBasicMaterial( {map: texture, side: THREE.DoubleSide} );
                material.transparent = true;
                var artwork = new THREE.Mesh(new THREE.PlaneBufferGeometry(img.width, img.height),material);
                container.add(artwork);

                var options = {'font' : 'helvetiker','weight' : 'normal', 'style' : 'normal','size' : 10,'curveSegments' : 20};
                var textShapes = THREE.FontUtils.generateShapes( '', options );
                var text = new THREE.ShapeGeometry( textShapes );
                var textMesh = new THREE.Mesh( text, new THREE.MeshBasicMaterial( { color: 0x000000 } ) ) ;
                
                textMesh.geometry.computeBoundingBox(); 
                var textbounds = textMesh.geometry.boundingBox.size();
                textMesh.position.set(-textbounds.x/2,-textbounds.y/4,1); // FLAG : See why -textbounds.y/4 works
                container.add(textMesh);

                container.hitmesh = artwork;

                container.on('click', function(event) {
                    container.visible = false;
                    // On the possibility that there was an error
                    // arrow associated with this container
                    if (errorMsgArrow !== null) {
                        errorMsgArrow.removeAllChildren(); // Hide the error arrow.
                    }
                    refreshCanvas(1);
                });

                refreshCanvas(1);
            }
            img.src = 'images/' + name + '.svg';
        }

        function keyPressed(event) {
            if (docById('labelDiv').classList.contains('hasKeyboard')) {
                return;
            }

            var ESC = 27;
            var ALT = 18;
            var CTRL = 17;
            var SHIFT = 16;
            var RETURN = 13;
            var SPACE = 32;

            // Captured by browser
            var PAGE_UP = 33;
            var PAGE_DOWN = 34;
            var KEYCODE_LEFT = 37;
            var KEYCODE_RIGHT = 39;
            var KEYCODE_UP = 38;
            var KEYCODE_DOWN = 40;

            if (event.altKey) {
                switch (event.keyCode) {
                    case 69: // 'E'
                        allClear();
                        break;
                    case 82: // 'R'
                        doFastButton();
                        break;
                    case 83: // 'S'
                        logo.doStopTurtle();
                        break;
                }
            } else if (event.ctrlKey) {} else {
                switch (event.keyCode) {
                    case ESC:
                        // toggle full screen
                        toggleToolbar();
                        break
                    case RETURN:
                        // toggle run
                        runLogoCommands();
                        break
                    default:
                        currentKey = String.fromCharCode(event.keyCode);
                        currentKeyCode = event.keyCode;
                        break;
                }
            }
        }

        function getCurrentKeyCode() {
            return currentKeyCode;
        }

        function clearCurrentKeyCode() {
            currentKey = '';
            currentKeyCode = 0;
        }

        // FIXME : Important funciton to fix when fixing the scaling
        function onResize() {
            if (docById('labelDiv').classList.contains('hasKeyboard')) {
                return;
            }
            if (!onAndroid) {
                var w = window.innerWidth;
                var h = window.innerHeight;
            } else {
                var w = window.outerWidth;
                var h = window.outerHeight;
            }

            var smallSide = Math.min(w, h);
            if (smallSide < cellSize * 10) {
                if (w < cellSize * 10) {
                    scale = smallSide / (cellSize * 10);
                } else {
                    scale = Math.max(smallSide / (cellSize * 10), 0.75);
                }
            } else {
                if (w > h) {
                    scale = w / 1200;
                } else {
                    scale = w / 900;
                }
            }

            scriptingCameraWidth = window.innerWidth;
            scriptingCameraHeight = window.innerHeight; 

            turtleCameraWidth = window.innerWidth;
            turtleCameraHeight = window.innerHeight;

            scriptingRenderer.setSize(window.innerWidth, window.innerHeight);
            turtleRenderer.setSize(window.innerWidth, window.innerHeight);

            scriptingCamera.position.x = 0;
            scriptingCamera.position.y = 0;
            scriptingCamera.position.z = 1000;
            scriptingCamera.lookAt(new THREE.Vector3(0, 0, 0));

            turtleCamera.position.x = 50;
            turtleCamera.position.y = 50;
            turtleCamera.position.z = 50;
            turtleCamera.lookAt(new THREE.Vector3(0,0,0));

            // stage.scaleX = scale;
            // stage.scaleY = scale;

            // stage.canvas.width = w;
            // stage.canvas.height = h;

            console.log('Resize: scale ' + scale +
                ', windowW ' + w + ', windowH ' + h +
                ', canvasW ' + canvas.width + ', canvasH ' + canvas.height +
                ', screenW ' + screen.width + ', screenH ' + screen.height);

            turtles.setScale(scale);
            blocks.setScale(scale);
            palettes.setScale(scale);
            trashcan.resizeEvent(scale);
            setupAndroidToolbar();

            // Reposition coordinate grids.
            cartesianBitmap.position.setX(0);
            cartesianBitmap.position.setY(0);
            polarBitmap.position.setX(0);
            polarBitmap.position.setY(0);
            refreshCanvas(1);

            // Setup help now that we have calculated scale.
            showHelp(true);
        }

        window.onresize = function() {
            onResize();
        }

        // FIXME
        function restoreTrash() {
            var dx = 0;
            var dy = -cellSize * 3; // Reposition blocks about trash area.
            for (var blk in blocks.blockList) {
                if (blocks.blockList[blk].trash) {
                    blocks.blockList[blk].trash = false;
                    blocks.moveBlockRelative(blk, dx, dy);
                    blocks.blockList[blk].show();
                    if (blocks.blockList[blk].name == 'start') {
                        turtle = blocks.blockList[blk].value;
                        turtles.turtleList[turtle].trash = false;
                        turtles.turtleList[turtle].container.visible = true;
                    }
                }
            }
            refreshCanvas(1);
        }

        function deleteBlocksBox() {
            clearBox.show(scale);
        }

        // FIXME: confirm???
        // FIXME : fix this function
        function sendAllToTrash(addStartBlock, doNotSave) {
            var dx = 2000;
            var dy = cellSize;
            for (var blk in blocks.blockList) {
                blocks.blockList[blk].trash = true;
                blocks.moveBlockRelative(blk, dx, dy);
                blocks.blockList[blk].hide();
                if (blocks.blockList[blk].name == 'start') {
                    console.log('start blk ' + blk + ' value is ' + blocks.blockList[blk].value)
                    turtle = blocks.blockList[blk].value;
                    if (turtle != null) {
                        console.log('sending turtle ' + turtle + ' to trash');
                        turtles.turtleList[turtle].trash = true;
                        turtles.turtleList[turtle].container.visible = false;
                    }
                }
            }
            if (addStartBlock) {
                function postprocess() {
                    last(blocks.blockList).x = 250;
                    last(blocks.blockList).y = 250;
                    last(blocks.blockList).connections = [null, null, null];
                    turtles.add(last(blocks.blockList));
                    last(blocks.blockList).value = turtles.turtleList.length - 1;
                    blocks.updateBlockPositions();
                    if (!doNotSave) {
                        console.log('save locally');
                        saveLocally();
                    }
                }

                blocks.makeNewBlock('start', postprocess);
            }

            if (!doNotSave) {
                // Overwrite session data too.
                console.log('save locally');
                saveLocally();
            }

            update = true;
        }

        function changePaletteVisibility() {
            if (palettes.visible) {
                palettes.hide();
            } else {
                palettes.show();
                // palettes.bringToTop();
            }
        }

        function changeBlockVisibility() {
            if (blocks.visible) {
                logo.hideBlocks();
            } else {
                logo.showBlocks();
            }
        }

        function toggleCollapsibleStacks() {
            if (blocks.visible) {
                console.log('calling toggleCollapsibles');
                blocks.toggleCollapsibles();
            }
        }

        function stop() {
            // FIXME: who calls this???
            createjs.Ticker.removeEventListener('tick', tick);
        }

        function onStopTurtle() {
            // TODO: plugin support
            if (!buttonsVisible) {
                hideStopButton();
            }
        }

        function onRunTurtle() {
            // TODO: plugin support
            // If the stop button is hidden, show it.
            if (!buttonsVisible) {
                showStopButton();
            }
        }

        function refreshCanvas(renderer) {
            if(renderer ==  0){
                scriptingRenderer.render(scriptingScene,scriptingCamera);
                turtleRenderer.render(turtleScene, turtleCamera);
            }
            else if(renderer == 1){
                scriptingRenderer.render(scriptingScene, scriptingCamera);
            }
            else if(renderer == 2){
                turtleRenderer.render(turtleScene, turtleCamera);
            }
        }

        // Remove this function if it is not used later on 
        // function tick(event) {
        //     // This set makes it so the stage only re-renders when an
        //     // event handler indicates a change has happened.
        //     if (update) {
        //         update = false; // Only update once
        //         stage.update(event);
        //     }
        // }

        function doOpenSamples() {
            console.log('save locally');
            saveLocally();
            thumbnails.show()
        }

        // FIXME 
        function saveLocally() {
            console.log('overwriting session data');

            if (localStorage.currentProject === undefined) {
                try {
                    localStorage.currentProject = 'My Project';
                    localStorage.allProjects = JSON.stringify(['My Project'])
                } catch (e) {
                    // Edge case, eg. Firefox localSorage DB corrupted
                    console.log(e);
                }
            }

            try {
                var p = localStorage.currentProject;
                localStorage['SESSION' + p] = prepareExport();
            } catch (e) { console.log(e); }

            // TODO : Add a flag in turtles to check if nothing has been drawn as of yet instead of this function 
            // if (isSVGEmpty(turtles)) {
            //     return;
            // }

            // var img = new Image();
            // var svgData = doSVG(canvas, logo, turtles, 320, 240, 320 / canvas.width);
            // img.onload = function() {
            //     var bitmap = new createjs.Bitmap(img);
            //     var bounds = bitmap.getBounds();
            //     bitmap.cache(bounds.x, bounds.y, bounds.width, bounds.height);
            //     try {
            //         localStorage['SESSIONIMAGE' + p] = bitmap.getCacheDataURL();
            //     } catch (e) { console.log(e); }
            // }
            // img.src = 'data:image/svg+xml;base64,' +
            //           window.btoa(unescape(encodeURIComponent(svgData)));
        }

        // FIXME
        function loadProject(projectName) {
            // Show busy cursor.
            document.body.style.cursor = 'wait';
            // palettes.updatePalettes();
            setTimeout(function() {
                if (fileExt(projectName) != 'tb') {
                    projectName += '.tb';
                }
                try {
                    if (server) {
                        var rawData = httpGet(projectName);
                        console.log('receiving ' + rawData);
                        var cleanData = rawData.replace('\n', '');
                    }
                    var obj = JSON.parse(cleanData);
                    blocks.loadNewBlocks(obj);
                    console.log('save locally');
                    saveLocally();
                } catch (e) {
                   console.log(e);
                   loadStart();
                }
                // Restore default cursor
                document.body.style.cursor = 'default';
                update = true;
            }, 200);

            docById('loading-image-container').style.display = 'none';
        }

        function loadRawProject(data) {
            console.log('loadRawProject ' + data);
            document.body.style.cursor = 'wait';
            allClear();
            var obj = JSON.parse(data);
            blocks.loadNewBlocks(obj);

            docById('loading-image-container').style.display = 'none';
            document.body.style.cursor = 'default';
        }

        // FIXME : All the blocks are centered on screen when loaded, fix that 
        function saveProject(projectName) {
            // palettes.updatePalettes();
            // Show busy cursor.
            document.body.style.cursor = 'wait';
            setTimeout(function() {
                var punctuationless = projectName.replace(/['!"#$%&\\'()\*+,\-\.\/:;<=>?@\[\\\]\^`{|}~']/g, '');
                projectName = punctuationless.replace(/ /g, '_');
                if (fileExt(projectName) != 'tb') {
                    projectName += '.tb';
                }
                try {
                    // Post the project
                    var returnValue = httpPost(projectName, prepareExport());
                    errorMsg('Saved ' + projectName + ' to ' + window.location.host);

                    var img = new Image();
                    var svgData = doSVG(canvas, logo, turtles, 320, 240, 320 / canvas.width);
                    img.onload = function() {
                        var bitmap = new createjs.Bitmap(img);
                        var bounds = bitmap.getBounds();
                        bitmap.cache(bounds.x, bounds.y, bounds.width, bounds.height);
                        // and base64-encoded png
                        httpPost(projectName.replace('.tb', '.b64'), bitmap.getCacheDataURL());
                    }
                    img.src = 'data:image/svg+xml;base64,' + window.btoa(
                        unescape(encodeURIComponent(svgData)));
                    // Restore default cursor
                    document.body.style.cursor = 'default';
                    return returnValue;
                } catch (e) {
                    console.log(e);
                    // Restore default cursor
                    document.body.style.cursor = 'default';
                    return;
                }
            }, 200);
        }


        function loadStart() {
            // where to put this?
            // palettes.updatePalettes();

            justLoadStart = function() {
                console.log('loading start');
                postProcess = function(thisBlock) {
                    blocks.blockList[0].x = 250;
                    blocks.blockList[0].y = 250;
                    blocks.blockList[0].connections = [null, null, null];
                    blocks.blockList[0].value = turtles.turtleList.length;
                    blocks.blockList[0].collapsed = false;
                    turtles.add(blocks.blockList[0]);
                    blocks.updateBlockPositions();
                }
                blocks.makeNewBlock('start', postProcess, null);
            }

            sessionData = null;
            // Try restarting where we were when we hit save.
            if (typeof(Storage) !== 'undefined') {
                // localStorage is how we'll save the session (and metadata)
                var currentProject = localStorage.currentProject;
                sessionData = localStorage['SESSION' + currentProject];
            }
            if (sessionData) {
                try {
                    if (sessionData == 'undefined' || sessionData == '[]') {
                        console.log('empty session found: loading start');
                        justLoadStart();
                    } else {
                        console.log('restoring session: ' + sessionData);
                        blocks.loadNewBlocks(JSON.parse(sessionData));
                    }
                } catch (e) {
                    console.log(e);
                }
            } else {
                justLoadStart();
            }
            update = true;

            docById('loading-image-container').style.display = 'none';
        }

        function hideMsgs() {
            errorMsgText.parent.visible = false;
            if (errorMsgArrow !== null) {
                for(var i = 0; i < errorMsgArrow.children.length; i++){
                    errorMsgArrow.remove(errorMsgArrow.children[i]);
                }
                refreshCanvas(1);
            }
            if(msgText.parent !== undefined){
                msgText.parent.visible = false;
            }

            for(var i in errorArtwork) {
                errorArtwork[i].visible = false;
            }
        }   

        function textMsg(msg) {
            if (msgText == null) {
                // The container may not be ready yet... so do nothing
                return;
            }
            var msgContainer = msgText.parent;
            msgContainer.visible = true;
            msgText.text = msg;
            // stage.setChildIndex(msgContainer, stage.getNumChildren() - 1);
        }


        // FIXME :
        // (1) Need to create a arrow graphic
        // (2) Need to create a function to bring the function to the top
        function errorMsg(msg, blk, text) {
            if (errorMsgText == null) {
                // The container may not be ready yet... so do nothing
                return;
            }

            if (blk !== undefined && blk !== null
                && !blocks.blockList[blk].collapsed) {
                var fromX = (canvas.width - 1000) / 2;
                var fromY = 128;
                var toX = blocks.blockList[blk].x + blocksContainer.position.x;
                var toY = blocks.blockList[blk].y + blocksContainer.position.y;

                if (errorMsgArrow == null) {
                    errorMsgArrow = new THREE.Group();
                    scriptingScene.add(errorMsgArrow);
                }

                // TODO : Create a arrow here

                // var line = new createjs.Shape();
                // errorMsgArrow.addChild(line);
                // line.graphics.setStrokeStyle(4).beginStroke('#ff0031').moveTo(fromX, fromY).lineTo(toX, toY);
                // stage.setChildIndex(errorMsgArrow, stage.getNumChildren() - 1);

                // var angle = Math.atan2(toX - fromX, fromY - toY) / Math.PI * 180;
                // var head = new createjs.Shape();
                // errorMsgArrow.addChild(head);
                // head.graphics.setStrokeStyle(4).beginStroke('#ff0031').moveTo(-10, 18).lineTo(0, 0).lineTo(10, 18);
                // head.x = toX;
                // head.y = toY;
                // head.rotation = angle;
            }

            // TODO : Bring to top all the error artwork when setting visibility as true
            console.log(msg);
            switch (msg) {
                case 'empty heap.':
                    // errorArtwork['emptyheap'].visible = true;
                    break;
                case 'Cannot take square root of negative number.':
                    // errorArtwork['negroot'].visible = true;
                    break;
		        case 'Cannot find action.':
                    if (text == null) {
                        text = 'foo';
                    }
                    // TODO : Edit the text here
                    // errorArtwork['nostack'].children[1].text = text;
                    // errorArtwork['nostack'].visible = true;
                    break;
		        case 'Cannot find box.':
                    if (text == null) {
                        text = 'foo';
                    }
                    // errorArtwork['emptybox'].children[1].text = text;
                    // errorArtwork['emptybox'].visible = true;
                    break;
                case 'Cannot divide by zero.':
                    // errorArtwork['zerodivide'].visible = true;
                    break;
                case 'Not a number.':
                    // errorArtwork['notanumber'].visible = true;
                    break;
                case 'Missing argument.':
                    // errorArtwork['noinput'].visible = true;
                    break;
                default:
                    // TODO : Uncomment this when the container is ready
                    // var errorMsgContainer = errorMsgText.parent;
                    // errorMsgContainer.visible = true;
                    // TODO : Set default error message text
                    // errorMsgText.text = msg;
                    break;
            }

            update = true;
        }

        function hideCartesian() {
            cartesianBitmap.children[0].visible = false;
            refreshCanvas(1);
        }

        function showCartesian() {
            cartesianBitmap.children[0].visible = true;
            refreshCanvas(1);
        }

        function hidePolar() {
            polarBitmap.children[0].visible = false;
            refreshCanvas(1);
        }

        function showPolar() {
            polarBitmap.children[0].visible = true;
            refreshCanvas(1);
        }

        function pasteStack() {
            blocks.pasteStack();
        }

        function prepareExport() {
            // We don't save blocks in the trash, so we need to
            // consolidate the block list and remap the connections.
            var blockMap = [];
            for (var blk = 0; blk < blocks.blockList.length; blk++) {
                var myBlock = blocks.blockList[blk];
                if (myBlock.trash) {
                    // Don't save blocks in the trash.
                    continue;
                }
                blockMap.push(blk);
            }

            var data = [];
            for (var blk = 0; blk < blocks.blockList.length; blk++) {
                var myBlock = blocks.blockList[blk];
                if (myBlock.trash) {
                    // Don't save blocks in the trash.
                    continue;
                }
                if (blocks.blockList[blk].isValueBlock() || blocks.blockList[blk].name == 'loadFile') {
                    // FIX ME: scale image if it exceeds a maximum size.
                    var args = {'value': myBlock.value};
                } else  if (myBlock.name == 'start') {
                    // It's a turtle.
                    turtle = turtles.turtleList[myBlock.value];
                    var args = {'collapsed': myBlock.collapsed,
                                'xcor': turtle.x,
                                'ycor': turtle.y,
                                'heading': turtle.orientation,
                                'color': turtle.color,
                                'shade': turtle.value,
                                'pensize': turtle.stroke,
                                'grey': turtle.chroma};
                } else if (myBlock.name == 'action') {
                    var args = {'collapsed': myBlock.collapsed}
                } else if (myBlock.name == 'namedbox') {
                    var args = {'value': myBlock.privateData}
                } else if (myBlock.name == 'nameddo') {
                    var args = {'value': myBlock.privateData}
                } else {
                    var args = {};
                }

                connections = [];
                for (var c = 0; c < myBlock.connections.length; c++) {
                    var mapConnection = blockMap.indexOf(myBlock.connections[c]);
                    if (myBlock.connections[c] == null || mapConnection == -1) {
                        connections.push(null);
                    } else {
                        connections.push(mapConnection);
                    }
                }
                data.push([blockMap.indexOf(blk), [myBlock.name, args], myBlock.container.x, myBlock.container.y, connections]);
            }
            return JSON.stringify(data);
        }

        function doOpenPlugin() {
            // Click on the plugin open chooser in the DOM (.json).
            pluginChooser.focus();
            pluginChooser.click();
        }

        function saveToFile() {
            var filename = prompt('Filename:');
            if (fileExt(filename) != 'tb') {
                filename += '.tb';
            }
            download(filename, 'data:text/plain;charset=utf-8,' + encodeURIComponent(prepareExport()));
        };

        function hideStopButton() {
            stopTurtleContainer.position.setX(stopTurtleContainerX);
            stopTurtleContainer.position.setY(stopTurtleContainerY);
            stopTurtleContainer.visible = false;
        }

        function showStopButton() {
            stopTurtleContainer.position.setX(onscreenButtons[0].x);
            stopTurtleContainer.position.setY(onscreenButtons[0].y);
            stopTurtleContainer.visible = true;
        }

        function updatePasteButton() {
            // pasteContainer.remove(pasteContainer.children[0]);
            // FIXME : How to remove children in three.js ?
            var img = new Image();
            img.onload = function() {
                var originalSize = 55; // this is the original svg size
                var halfSize = Math.floor(cellSize / 2);

                var canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                var context = canvas.getContext('2d');
                context.drawImage(img, 0, 0);
                var texture = new THREE.Texture(canvas);
                texture.needsUpdate = true;
                texture.minFilter = THREE.NearestFilter; 
                var material = new THREE.MeshBasicMaterial( {map: texture, transparent : true, depthWrite : false} );
                var bitmap = new THREE.Mesh(new THREE.PlaneBufferGeometry(img.width, img.height),material);
                bitmap.name = 'paste-disabled-button';
                bitmap.imgWidth = img.width;
                bitmap.imgHeight = img.height;
                if(size != originalSize){
                    bitmap.scale.setX(size/originalSize);
                    bitmap.scale.setY(size/originalSize);
                }
                pasteContainer.add(bitmap);
                // bitmap.regX = halfSize / bitmap.scaleX; //PE : Why is this regX,regY set here?
                // bitmap.regY = halfSize / bitmap.scaleY;
                refreshCanvas(1);
            }
            img.src = 'icons/paste-button.svg';
        }

        function setupAndroidToolbar() {
            if (headerContainer !== undefined) {
                scriptingScene.remove(headerContainer);
                for (i in onscreenButtons) {
                    scriptingScene.remove(onscreenButtons[i]);
                }
            }

            headerContainer = new THREE.Group();
            var material = new THREE.MeshBasicMaterial( {color : 0x2196f3, transparent : true, depthWrite : false} );
            var background = new THREE.Mesh(new THREE.PlaneBufferGeometry(window.innerWidth, cellSize),material);
            headerContainer.add(background);
            headerContainer.position.setY(threeCoorY(cellSize/2));
            scriptingScene.add(headerContainer);


            // headerContainer.graphics.f('#2196f3').r(0, 0,
            //     screen.width / scale, cellSize);
            // headerContainer.shadow = new createjs.Shadow('#777', 0, 2, 2);
            // stage.addChild(headerContainer);

            var buttonNames = [
                ['fast', doFastButton],
                ['slow', doSlowButton],
                ['step', doStepButton],
                ['stop-turtle', doStopButton],
                ['clear', allClear],
                ['palette', changePaletteVisibility],
                ['hide-blocks', changeBlockVisibility],
                ['collapse-blocks', toggleCollapsibleStacks],
                ['help', showHelp]
            ];

            var btnSize = cellSize;
            var x = threeCoorX(cellSize/2);
            var y = threeCoorY(cellSize/2);
            var dx = btnSize;
            var dy = 0;

            for (var name in buttonNames) {
                var container = makeButton(buttonNames[name][0],
                    x, y, btnSize, 0 , buttonNames[name][1]);
                
                onscreenButtons.push(container);
                
                if (buttonNames[name][0] == 'stop-turtle') {
                    stopTurtleContainer = container;
                    stopTurtleContainerX = x;
                    stopTurtleContainerY = y;
                }

                x += dx;
                y += dy;
            }

            setupRightMenu(scale);
        }

        function setupRightMenu(scale) {
            if (menuContainer !== undefined) {
                    scriptingScene.remove(menuContainer);
                for (i in onscreenMenu) {
                    scriptingScene.remove(onscreenMenu[i]);
                }
            }

            // Misc. other buttons
            var menuNames = [
                ['planet', doOpenSamples],
                ['paste-disabled', pasteStack],
                ['Cartesian', doCartesian],
                ['polar', doPolar],
                ['bigger', doBiggerFont],
                ['smaller', doSmallerFont],
                ['plugin', doOpenPlugin],
                ['empty-trash', deleteBlocksBox],
                ['restore-trash', restoreTrash]
            ];

            var btnSize = cellSize;
            var x = window.innerWidth/2 - cellSize/2; //PE : x is dependent on cellSize see how this works on resize
            var y = threeCoorY(cellSize/2);

            var dx = 0;
            var dy = btnSize;

            menuContainer = makeButton('menu', x, y, btnSize,
                                       menuButtonsVisible? 90 : undefined, doMenuButton);

            for (var name in menuNames) {
                x += dx;
                y -= dy;
                var container = makeButton(menuNames[name][0],
                    x, y, btnSize, 0, menuNames[name][1]);
                onscreenMenu.push(container);
                container.visible = false;
            }

            if (menuButtonsVisible) {
                for (button in onscreenMenu) {
                    onscreenMenu[button].visible = true;
                }
            }
        }

        function showHelp(firstTime) {
            helpIdx = 0;

            if (firstTime) {
                if (helpContainer == null) {
                    helpContainer = new THREE.Group();
                    scriptingScene.add(helpContainer);

                    var img = new Image();
                    img.onload = function() {

                        var canvas = document.createElement('canvas');
                        canvas.width = img.width;
                        canvas.height = img.height;
                        var context = canvas.getContext('2d');
                        context.drawImage(img, 0, 0);
                        var texture = new THREE.Texture(canvas);
                        texture.needsUpdate = true;
                        texture.minFilter = THREE.NearestFilter; 
                        var material = new THREE.MeshBasicMaterial( {map: texture, transparent : true, depthWrite : false} );
                        var bitmap = new THREE.Mesh(new THREE.PlaneBufferGeometry(img.width, img.height),material);
                        bitmap.name = 'helpbitmap';
                        bitmap.imgWidth = img.width;
                        bitmap.imgHeight = img.height;


                        // if(scale > 1){
                        bitmap.scale.setX(scale); //PE : Why are these conditions used, this is working well
                        bitmap.scale.setY(scale);
                        bitmap.scale = scale;
                        // }
                        // else{
                            // bitmap.scale.setX(1.125);
                            // bitmap.scale.setY(1.125);
                            // bitmap.scale = 1.125;
                        // }
                        helpContainer.position.setX(threeCoorX(65)+img.width*scale/2);
                        helpContainer.position.setY(threeCoorY(65)-img.height*scale/2);
                        helpContainer.add(bitmap);

                        refreshCanvas(1);

                        var bounds = helpContainer.get2DBounds(true);

                        var h = bounds.height * scale; //Scaling has to be included
                        var w = bounds.width * scale;
                        var rectShape = new THREE.Shape();
                        rectShape.moveTo( -w/2, h/2 );
                        rectShape.lineTo( w/2, h/2 );
                        rectShape.lineTo( w/2, -h/2 );
                        rectShape.lineTo( -w/2, -h/2 );
                        rectShape.lineTo( -w/2, h/2 );

                        var rectGeom = new THREE.ShapeGeometry( rectShape );
                        var rectMesh = new THREE.Mesh( rectGeom, new THREE.MeshBasicMaterial( { color: 0xFFE5B4 } ) ) ;   
                        rectMesh.position.setZ(1);
                        rectMesh.visible = false;
                        helpContainer.add(rectMesh);
                        helpContainer.hitmesh = rectMesh;

                        helpContainer.on('click', function(event) {
                            if (event.clientY < mouseCoorY(helpContainer.position.y) ) {
                                helpContainer.visible = false;
                                docById('helpElem').style.visibility = 'hidden';
                            } else {
                                helpIdx += 1;
                                if (helpIdx >= HELPCONTENT.length) {
                                    helpIdx = 0;
                                }
                                var imageScale = 55 * scale; 
                                helpElem.innerHTML = '<img src ="' + HELPCONTENT[helpIdx][2] + '" style="height:' + imageScale + 'px; width: auto"></img> <h2>' + HELPCONTENT[helpIdx][0] + '</h2><p>' + HELPCONTENT[helpIdx][1] + '</p>'
                            }
                            refreshCanvas(1);
                        });

                        docById('helpElem').innerHTML = '<img src ="' + HELPCONTENT[helpIdx][2] + '"</img> <h2>' + HELPCONTENT[helpIdx][0] + '</h2><p>' + HELPCONTENT[helpIdx][1] + '</p>'
                        if (!doneTour) {
                            docById('helpElem').style.visibility = 'visible';
                        }
                        refreshCanvas(1);
                    }
                    img.src = 'images/help-container.svg';
                }

                var helpElem = docById('helpElem');
                helpElem.style.position= 'absolute';
                helpElem.style.display = 'block';
                helpElem.style.paddingLeft = 20 * scale + 'px';
                helpElem.style.paddingRight = 20 * scale + 'px';
                helpElem.style.paddingTop = '0px';
                helpElem.style.paddingBottom = 20 * scale + 'px';
                helpElem.style.fontSize = 20 * scale + 'px';
                helpElem.style.color = '#ffffff';
                helpElem.style.left = 65 * scale + 'px';
                helpElem.style.top = 105 * scale + 'px';
                var w = Math.min(300, 300 * scale);
                var h = Math.min(300, 300 * scale);
                helpElem.style.width = w + 'px';
                helpElem.style.height = h + 'px';
                helpElem.style.zIndex = 100;
            }

            var doneTour = localStorage.doneTour === 'true';

            if (firstTime && doneTour) {
                docById('helpElem').style.visibility = 'hidden';
                helpContainer.visible = false;
            } else {
                localStorage.doneTour = 'true';
                docById('helpElem').innerHTML = '<img src ="' + HELPCONTENT[helpIdx][2] + '"</img> <h2>' + HELPCONTENT[helpIdx][0] + '</h2><p>' + HELPCONTENT[helpIdx][1] + '</p>'
                docById('helpElem').style.visibility = 'visible';
                helpContainer.visible = true;
                refreshCanvas(1);

                // Make sure the palettes and the secondary menus are
                // visible while help is shown.

                palettes.show();
                if (!menuButtonsVisible) {
                    doMenuAnimation(1);
                }
            }
        }

        function doMenuButton() {
            doMenuAnimation(1);
        }

        function doMenuAnimation() {
            var bitmap = first(menuContainer.children);

            // FIXME : Make the rotation a animation instead of direct change

            if (bitmap !== null) {
                bitmap.rotation.z = -Math.PI / 2;
            } else {
                // Race conditions during load
                setTimeout(doMenuAnimation, 50);
            }
            setTimeout(function() {
                if (menuButtonsVisible) {
                    menuButtonsVisible = false;
                    for (button in onscreenMenu) {
                        onscreenMenu[button].visible = false;
                    }
                } else {
                    menuButtonsVisible = true;
                    for (button in onscreenMenu) {
                        onscreenMenu[button].visible = true;
                    }
                }
                refreshCanvas(1);
            }, 500);
        }

        function toggleToolbar() {
            buttonsVisible = !buttonsVisible;
            menuContainer.visible = buttonsVisible;
            headerContainer.visible = buttonsVisible;
            for (button in onscreenButtons) {
                onscreenButtons[button].visible = buttonsVisible;
            }
            for (button in onscreenMenu) {
                onscreenMenu[button].visible = buttonsVisible;
            }
            update = true;
        }

        // creates a button
        function makeButton(name, x, y, size, rotation) {
            var container = new THREE.Group();
            if (name == 'paste-disabled-button') {
                pasteContainer = container;
            }

            scriptingScene.add(container);
            container.position.setX(x);
            container.position.setY(y);

            var img = new Image();

            img.onload = function() {
                var originalSize = 55; // this is the original svg size
                var halfSize = Math.floor(size / 2);

                var canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                var context = canvas.getContext('2d');
                context.drawImage(img, 0, 0);
                var texture = new THREE.Texture(canvas);
                texture.needsUpdate = true;
                texture.minFilter = THREE.NearestFilter; 
                var material = new THREE.MeshBasicMaterial( {map: texture, transparent : true, depthWrite : false} );
                var bitmap = new THREE.Mesh(new THREE.PlaneBufferGeometry(img.width, img.height),material);
                bitmap.name = name;
                bitmap.imgWidth = img.width;
                bitmap.imgHeight = img.height;
                if(size != originalSize){
                    bitmap.scale.setX(size/originalSize);
                    bitmap.scale.setY(size/originalSize);
                }
                container.add(bitmap);

                var circleRadius = cellSize/2;
                var circleShape = new THREE.Shape();
                circleShape.moveTo( 0, circleRadius );
                circleShape.quadraticCurveTo( circleRadius, circleRadius, circleRadius, 0 );
                circleShape.quadraticCurveTo( circleRadius, -circleRadius, 0, -circleRadius );
                circleShape.quadraticCurveTo( -circleRadius, -circleRadius, -circleRadius, 0 );
                circleShape.quadraticCurveTo( -circleRadius, circleRadius, 0, circleRadius );
                var circleGeometry = new THREE.ShapeGeometry( circleShape );
                var circleMesh = new THREE.Mesh( circleGeometry, new THREE.MeshBasicMaterial( { color: 0xdddddd } ) ) ; 
                circleMesh.position.setZ(2);
                circleMesh.visible = false;
                container.add(circleMesh);

                container.hitmesh = circleMesh;

                if(rotation !== undefined){
                    bitmap.rotation.z = rotation;
                }

                refreshCanvas(1);

                // bitmap.regX = halfSize / bitmap.scaleX; //PE : Why is cache used and what is regX,regY for?
                // bitmap.regY = halfSize / bitmap.scaleY;

                // bitmap.cache(0, 0, size, size);
                // bitmap.updateCache();
            }
            img.src = 'icons/' + name + '.svg';
            return container;
        }

        // TODO : fix this event handler later
        function loadButtonDragHandler(container, ox, oy, action) {
            // Prevent multiple button presses (i.e., debounce).
            var locked = false;

            container.on('mousedown', function(event) {
                var moved = true;
                var offset = {
                    x: container.x - Math.round(event.clientX / blocks.scale),
                    y: container.y - Math.round(event.clientY / blocks.scale)
                };
                container.traverse(function(node){
                    console.log(node);
                });

                var circles = showMaterialHighlight(ox, oy, cellSize / 2, //Add circle hover on this
                                                    event, scale, stage);
            });
            container.on('pressup', function(event) {
                    hideMaterialHighlight(circles, stage);

                    container.x = ox;
                    container.y = oy;
                    if (action != null && moved && !locked) {
                        locked = true;
                        setTimeout(function() {
                            locked = false;
                        }, 500);
                        action();
                    }
                    moved = false;
            });
        }
    });
});
