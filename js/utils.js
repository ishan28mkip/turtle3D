// TODO : Add 3D version to getBounds and add 2D version to intersect, using get2Dbounds

// NEWS : 
    // Fixed the get2Dbounds function and optimized a bit // 12:09 14th June
    // Fixed bug in mouse events about pressmove not getting activated when mousedown is on // 26th June



function canvasPixelRatio() {
    var devicePixelRatio = window.devicePixelRatio || 1;
    var context = document.querySelector('#myCanvas').getContext('2d');
    var backingStoreRatio = context.webkitBackingStorePixelRatio ||
                            context.mozBackingStorePixelRatio ||
                            context.msBackingStorePixelRatio ||
                            context.oBackingStorePixelRatio ||
                            context.backingStorePixelRatio || 1;
    return devicePixelRatio / backingStoreRatio;
}


// ------------------------------------------------------------------- //

(function() {
    var lastTime = 0;
    var vendors = ['ms', 'moz', 'webkit', 'o'];
    for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
        window.cancelAnimationFrame = window[vendors[x]+'CancelAnimationFrame'] 
                                   || window[vendors[x]+'CancelRequestAnimationFrame'];
    }
 
    if (!window.requestAnimationFrame)
        window.requestAnimationFrame = function(callback, element) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = window.setTimeout(function() { callback(currTime + timeToCall); }, 
              timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };
 
    if (!window.cancelAnimationFrame)
        window.cancelAnimationFrame = function(id) {
            clearTimeout(id);
        };
}());

// PE : Replace window.innerWidth & window.innerHeight with canvas width and height
function threeCoorX(x){
    return (x - window.innerWidth/2);
}

function threeCoorY(y){
    if(y <= window.innerHeight/2)
        return (window.innerHeight/2 - y);
    else
        return -(y-window.innerHeight/2);
}

function mouseCoorX(x){
    return (x + window.innerHeight/2);
}

function mouseCoorY(y){
    if(y >= 0)
        return (window.innerHeight/2 - y);
    else
        return (-y + window.innerHeight/2);
}

            // Add axis
function buildAxes( length ) {
    var axes = new THREE.Object3D();
    axes.add( buildAxis( new THREE.Vector3( 0, 0, 10 ), new THREE.Vector3( length, 0, 0 ), 0xFF0000, false ) ); // +X
    axes.add( buildAxis( new THREE.Vector3( 0, 0, 10 ), new THREE.Vector3( -length, 0, 0 ), 0xFF0000, true) ); // -X
    axes.add( buildAxis( new THREE.Vector3( 0, 0, 10 ), new THREE.Vector3( 0, length, 0 ), 0x00FF00, false ) ); // +Y
    axes.add( buildAxis( new THREE.Vector3( 0, 0, 10 ), new THREE.Vector3( 0, -length, 0 ), 0x00FF00, true ) ); // -Y
    axes.add( buildAxis( new THREE.Vector3( 0, 0, 10 ), new THREE.Vector3( 0, 0, length ), 0x0000FF, false ) ); // +Z
    axes.add( buildAxis( new THREE.Vector3( 0, 0, 10 ), new THREE.Vector3( 0, 0, -length ), 0x0000FF, true ) ); // -Z
    return axes;

}

function buildAxis( src, dst, colorHex, dashed ) {
    var geom = new THREE.Geometry(),mat; 

    if(dashed) {
        mat = new THREE.LineDashedMaterial({ linewidth: 3, color: colorHex, dashSize: 3, gapSize: 3 });
    } else {
        mat = new THREE.LineBasicMaterial({ linewidth: 3, color: colorHex });
    }
    geom.vertices.push( src.clone() );
    geom.vertices.push( dst.clone() );
    geom.computeLineDistances(); // This one is SUPER important, otherwise dashed lines will appear as simple plain lines

    var axis = new THREE.Line( geom, mat, THREE.LinePieces );

    return axis;
}

// Binding the on event to Object3D prototype
// to be used to get bounds of a container, recursively should be set to false if only no container nesting is there
// TODO
// Use a better algorithm here when time permits to get the maximum and minimum
// See if traverse uses a better appoach to iterate
// Recursive has a problem that the bounding box is giving local bounding and not global
// FIXME : Should bounds contain the scaling factor or not?

Object.defineProperty(THREE.Object3D.prototype, 'get2DBounds', {
    enumerable: false,
    configurable: false,
    writable: false,
    value: function(recursively,bound){
        var bounds;
        var flag;
        if(bound === undefined)
        {
            flag = true;
        }
        else{
            bounds = bound;
            flag = false;
        }

        for(var i = 0; i<this.children.length; i++){
            if(this.children[i].geometry !== undefined){
                if(flag){
                    this.children[i].geometry.computeBoundingBox();
                    bounds = this.children[i].geometry.boundingBox;
                    flag = false;
                }
                else{
                    this.children[i].geometry.computeBoundingBox();
                    var newBounds = this.children[i].geometry.boundingBox;
                    bounds.max.x = ( newBounds.max.x > bounds.max.x) ?  newBounds.max.x : bounds.max.x;
                    bounds.max.y = ( newBounds.max.y > bounds.max.y) ?  newBounds.max.y : bounds.max.y;
                    bounds.min.x = ( newBounds.min.x < bounds.min.x) ?  newBounds.min.x : bounds.min.x;
                    bounds.min.y = ( newBounds.min.x < bounds.min.x) ?  newBounds.min.y : bounds.min.y;
                }
            }
            else if(recursively){
                if(flag){
                    bounds = this.children[i].get2DBounds(true);
                    flag = false;
                }
                else{
                    bounds = this.children[i].get2DBounds(true, bounds);
                }
            }
        }
        bounds.width = bounds.max.x - bounds.min.x;
        bounds.height = bounds.max.y - bounds.min.y;
        bounds.max.x += this.position.x;
        bounds.min.x += this.position.x;
        bounds.max.y += this.position.y;
        bounds.min.y += this.position.y;
        return bounds;
    }
});



// Gets the 3D bound of any object
function get3DBounds(container,recursively){

}

// News 
// Bubbling needs to be added
// Optimize the library
// FIXME mouseup bug : If mousedown is on element1 and element2 also has mousedown and mouseup events attached then mouseup event will fire even if mouse is on element2. Event should only fire if mouse is on element1. 
// FIXME mouseout can only be used with mouseover & pressmove can only be used along with pressup
// TODO : Add many to one and one to many binding on hitmesh
// TODO : Option to generate event even when hidden

// Event handler arrays
var clickArray = [];
var dblclickArray = [];
var mousedownArray = [];
var mouseupArray = [];
var mousemotionArray = [];
var mouseTHREECoordinates = new THREE.Vector2();
var raycaster = new THREE.Raycaster();
var scriptingRenderer;
var scriptingCamera;

// Binding the on event to Object3D prototype
Object.defineProperty(THREE.Object3D.prototype, 'on', {
    enumerable: false,
    configurable: false,
    writable: false,
    value: function(eventName,callback){
        if(this.type == 'Mesh'){
            if(!(this.hasOwnProperty('hitmesh')) || this.hitmesh == undefined){
                this.hitmesh = this;
                this.hitmesh.parentMesh = this;
            }
        }
        if(this.hasOwnProperty('hitmesh') && this.hitmesh.type == 'Mesh' && this.hitmesh.hasOwnProperty('parentMesh') && this.hitmesh.parentMesh !== undefined){
            this.addEventListener(eventName, function(event){
                callback(event);
            });
            switch(eventName){
                case 'click': clickArray.push(this.hitmesh);
                break;
                case 'dblclick': dblclickArray.push(this.hitmesh);
                break;
                case 'mousedown' : mousedownArray.push(this.hitmesh);
                break;
                case 'mouseup' : mouseupArray.push(this.hitmesh);
                break;
                case 'mousemove' : mousemotionArray.push(this.hitmesh);
                break;
                case 'mouseover' : mousemotionArray.push(this.hitmesh);
                break;
                case 'mouseout' : mousemotionArray.push(this.hitmesh);
                break;
                case 'pressmove' : mousedownArray.push(this.hitmesh);
                break;
                case 'pressup' : mouseupArray.push(this.hitmesh);
                break;
                default : callback(false);
            }
        }
    }
});

// Binding the off event to Object3D prototype
Object.defineProperty(THREE.Object3D.prototype, 'off', {
    enumerable: false,
    configurable: false,
    writable: false,
    value: function(eventName,callback,listener){
        if(listener === undefined){
            if ( this._listeners === undefined ){
                callback(false);
            }
            else if(this._listeners.hasOwnProperty(eventName)){
                this._listeners[eventName] = undefined;
                callback(true);
            }  
        }
        else{
            if ( this._listeners === undefined )
                callback(false);
            var listeners = this._listeners;
            var listenerArray = listeners[ type ];
            if ( listenerArray !== undefined ) {
                var index = listenerArray.indexOf( listener );
                if ( index !== - 1 ) {
                    listenerArray.splice( index, 1 );
                    callback(true);
                }
            }
        }
    }
});


function initMouseEvents(events, renderer, camera){
    scriptingRenderer = renderer;
    scriptingCamera = camera;

    for(var i = 0; i<events.length ; i++){
        switch(events[i]){
            case 'click': renderer.domElement.addEventListener( 'click', function(event){
                if(clickArray.length > 0){
                    onSceneEvent(event,'click');
                }
            }, false );
            break;
            case 'dblclick': renderer.domElement.addEventListener( 'dblclick', function(event){
                if(dblclickArray.length > 0){
                    onSceneEvent(event,'dblclick');
                }
            }, false ); 
            break;
            case 'mousedown' : renderer.domElement.addEventListener( 'mousedown',  function(event){
                if(mousedownArray.length > 0){
                    onSceneEvent(event,'mousedown');
                }
            }, false);
            break;
            case 'mouseup' : renderer.domElement.addEventListener( 'mouseup',  function(event){
                if(mouseupArray.length > 0){
                    onSceneEvent(event,'mouseup');
                }
            }, false ); 
            break;
            case 'mousemove' : renderer.domElement.addEventListener( 'mousemove',  function(event){
                if(mousemotionArray.length > 0 || mousedownArray.length > 0){
                    onSceneEvent(event,'mousemotion');
                }
            }, false );
            break;
            default : console.log('Invalid event entered');
        }
    }
}


function onSceneEvent(event,eventName){
    event.preventDefault();
    var intersects;
    mouseTHREECoordinates.x = ( event.clientX / scriptingRenderer.domElement.width ) * 2 - 1;
    mouseTHREECoordinates.y = - ( event.clientY / scriptingRenderer.domElement.height ) * 2 + 1;
    raycaster.setFromCamera( mouseTHREECoordinates, scriptingCamera ); 

    switch(eventName){
        case 'click': 
            intersects = raycaster.intersectObjects(clickArray);
            if(intersects.length > 0){
                for(var i = intersects.length - 1 ; i >=0 ; i--){
                    if(intersects[i].object.parentMesh.visible == true){
                        intersects[i].object.parentMesh.dispatchEvent(setEventTypeMesh(event,'click', intersects[i].object.parentMesh));
                        break;
                    }
                }
            }
            break;
        case 'dblclick':
            intersects = raycaster.intersectObjects(dblclickArray);
            if(intersects.length > 0){
                for(var i = intersects.length - 1 ; i >=0 ; i--){
                    if(intersects[i].object.parentMesh.visible == true){
                        intersects[i].object.parentMesh.dispatchEvent(setEventTypeMesh(event,'dblclick', intersects[i].object.parentMesh));
                        break;
                    }
                }
             }
            break;
        case 'mousedown' :
            intersects = raycaster.intersectObjects(mousedownArray);
            if(intersects.length > 0){
                for(var i=intersects.length-1; i>=0; i--){
                    if(intersects[i].object.parentMesh.visible == true){
                        if(intersects[i].object.parentMesh._listeners.hasOwnProperty('mousedown')){
                            intersects[i].object.parentMesh.dispatchEvent(setEventTypeMesh(event,'mousedown', intersects[i].object.parentMesh));
                            intersects[i].object.parentMesh._listeners.mousedown.active = true;
                        }
                        if(intersects[i].object.parentMesh._listeners.hasOwnProperty('pressmove')){
                            intersects[i].object.parentMesh.dispatchEvent(setEventTypeMesh(event,'pressmove', intersects[i].object.parentMesh));
                            intersects[i].object.parentMesh._listeners.pressmove.active = true;
                        }
                        break;
                    }
                }
             }
            break;
        case 'mouseup' : 
            intersects = raycaster.intersectObjects(mouseupArray);
            if(intersects.length > 0){
                for(var i=intersects.length - 1; i>=0; i--){
                    if(intersects[i].object.parentMesh.visible == true){
                        if(intersects[i].object.parentMesh._listeners.hasOwnProperty('mousedown')){
                            if(intersects[i].object.parentMesh._listeners.mousedown.active){
                                intersects[i].object.parentMesh._listeners.mousedown.active = false;
                            }
                        }
                        if(intersects[i].object.parentMesh._listeners.hasOwnProperty('mouseup')){
                            intersects[i].object.parentMesh.dispatchEvent(setEventTypeMesh(event,'mouseup', intersects[i].object.parentMesh));
                        }
                        if(intersects[i].object.parentMesh._listeners.hasOwnProperty('pressup')){
                            if(intersects[i].object.parentMesh._listeners.pressmove.active){
                                intersects[i].object.parentMesh.dispatchEvent(setEventTypeMesh(event,'pressup', intersects[i].object.parentMesh));
                                intersects[i].object.parentMesh._listeners.pressmove.active = false;
                            }
                        }
                        break;                       
                    }

                }
             }
             for(i=0; i< mousedownArray.length; i++){
                if(mousedownArray[i].parentMesh._listeners.hasOwnProperty('mousedown')){
                    if(mousedownArray[i].parentMesh._listeners.mousedown.active){
                        mousedownArray[i].parentMesh._listeners.mousedown.active = false;
                    }
                }
                if(mousedownArray[i].parentMesh._listeners.hasOwnProperty('pressmove')){
                    if(mousedownArray[i].parentMesh._listeners.pressmove.active){
                        if(mousedownArray[i].parentMesh.visible == true){
                            mousedownArray[i].parentMesh.dispatchEvent(setEventTypeMesh(event,'pressup', mousedownArray[i].parentMesh));
                        }
                        mousedownArray[i].parentMesh._listeners.pressmove.active = false;
                    }
                }
             }
            break;

        case 'mousemotion' : 
            var flag, intersected;
            for(var i = 0; i<mousedownArray.length; i++){
                if(mousedownArray[i].parentMesh._listeners.hasOwnProperty('pressmove')){
                    if(mousedownArray[i].parentMesh._listeners.pressmove.active){
                        mousedownArray[i].parentMesh.dispatchEvent(setEventTypeMesh(event,'pressmove', mousedownArray[i].parentMesh));
                    }
                }
            }
            intersects = raycaster.intersectObjects(mousemotionArray);
            if(intersects.length > 0){
                for(var i=intersects.length - 1; i>=0; i--){
                    if(intersects[i].object.parentMesh.visible == true){
                        intersected = intersects[i].object;
                        break;
                    }
                }
                if(intersected !== undefined){
                    if(intersected.parentMesh._listeners.hasOwnProperty('mousemove')){
                        intersected.parentMesh.dispatchEvent(setEventTypeMesh(event,'mousemove', intersected.parentMesh));
                    }
                    else if(intersected.parentMesh._listeners.hasOwnProperty('mouseover')){
                        if(intersected.parentMesh._listeners.mouseover.active == undefined){
                            intersected.parentMesh._listeners.mouseover.active = true;
                            intersected.parentMesh.dispatchEvent(setEventTypeMesh(event,'mouseover', intersected.parentMesh));
                        }
                        else if(intersected.parentMesh._listeners.mouseover.active == false){
                            intersected.parentMesh._listeners.mouseover.active = true;
                            intersected.parentMesh.dispatchEvent(setEventTypeMesh(event,'mouseover', intersected.parentMesh));
                        }
                    }
                }
             }


             // Check for mouseout
             for(i=0; i < mousemotionArray.length; i++){
                flag = false;
                if(mousemotionArray[i].parentMesh._listeners.hasOwnProperty('mouseover') && mousemotionArray[i].parentMesh._listeners.mouseover.active == true){
                    if(intersected == mousemotionArray[i])
                        flag = true;
                    if(flag){
                        break;
                    }
                    else if(!flag){
                        if(mousemotionArray[i].parentMesh._listeners.hasOwnProperty('mouseout')){
                            mousemotionArray[i].parentMesh.dispatchEvent(setEventTypeMesh(event,'mouseout', mousemotionArray[i].parentMesh));
                        }
                        mousemotionArray[i].parentMesh._listeners.mouseover.active = false;
                    }
                }
             }
            break;

        default : console.log('Invalid event');
    }
}

function setEventTypeMesh(event,type, mesh){
    var eventObject = {};
    var property;
    for(property in event){
        eventObject[property] = event[property];
    }
    eventObject.type = type;
    eventObject.srcElement = mesh;
    return eventObject;
}




// ------------------------------------------------------------------- //

function windowHeight() {
    var onAndroid = /Android/i.test(navigator.userAgent);
    if (onAndroid) {
        return window.outerHeight;
    } else {
        return window.innerHeight;
    }
}
// Fix this function later
// function httpGet(projectName) {
//     var xmlHttp = null;

//     xmlHttp = new XMLHttpRequest();

//     if (projectName == null) {
//         xmlHttp.open("GET", window.server, false);
//         xmlHttp.setRequestHeader('x-api-key', '3tgTzMXbbw6xEKX7');
//     } else {
//         xmlHttp.open("GET", window.server + projectName, false);
//         xmlHttp.setRequestHeader('x-api-key', '3tgTzMXbbw6xEKX7');
//     }
//     xmlHttp.send();
//     if (xmlHttp.status > 299) {
//         throw 'Error from server';
//     }
//     return xmlHttp.responseText;
// }


function httpPost(projectName, data) {
    var xmlHttp = null;
    xmlHttp = new XMLHttpRequest();
    xmlHttp.open("POST", window.server + projectName, false);
    xmlHttp.setRequestHeader('x-api-key', '3tgTzMXbbw6xEKX7');
    xmlHttp.send(data);
    // return xmlHttp.responseText;
    return 'https://apps.facebook.com/turtleblocks/?file=' + projectName;
}


function HttpRequest(url, loadCallback, userCallback) {
    // userCallback is an optional callback-handler.
    var req = this.request = new XMLHttpRequest();
    this.handler = loadCallback;
    this.url = url;
    this.localmode = Boolean(self.location.href.search(/^file:/i) == 0);
    this.userCallback = userCallback;
    var objref = this;
    try {
        req.open('GET', url);
        req.onreadystatechange = function() { objref.handler(); };
        req.send('');
    }
    catch(e) {
        if (self.console) console.log('Failed to load resource from ' + url + ': Network error.');
        if (typeof userCallback == 'function') userCallback(false, 'network error');
        this.request = this.handler = this.userCallback = null;
    }
}


function docByTagName(tag) {
    document.getElementsByTagName(tag);
}


function docById(id) {
    return document.getElementById(id);
}


function last(myList) {
    var i = myList.length;
    if (i == 0) {
        return null;
    } else {
        return myList[i - 1];
    }
}

// Making this function to work analogous to the last function even though first element can be taken as [0]
function first(myList){
    var i = myList.length;
    if(i==0){
        return null;
    }
    else{
        return myList[0];
    }
}



function doSVG(canvas, logo, turtles, width, height, scale) {
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + width + '" height="' + height + '">\n';
    svg += '<g transform="scale(' + scale + ',' + scale + ')">\n';
    svg += logo.svgOutput;
    for (var turtle in turtles.turtleList) {
        turtles.turtleList[turtle].closeSVG();
        svg += turtles.turtleList[turtle].svgOutput;
    }
    svg += '</g>';
    svg += '</svg>';
    return svg;
}

function isSVGEmpty(turtles) {
    for (var turtle in turtles.turtleList) {
        turtles.turtleList[turtle].closeSVG();
        if (turtles.turtleList[turtle].svgOutput !== '') {
            return false;
        }
    }
    return true;
}


function fileExt(file) {
    var parts = file.split('.');
    if (parts.length == 1 || (parts[0] == '' && parts.length == 2)) {
        return '';
    }
    return parts.pop();
}


function fileBasename(file) {
    var parts = file.split('.');
    if (parts.length == 1) {
        return parts[0];
    } else if (parts[0] == '' && parts.length == 2) {
        return file;
    } else {
        parts.pop(); // throw away suffix
        return parts.join('.');
    }
}


// Needed to generate new data for localization.ini
// var translated = "";
function _(text) {
    replaced = text;
    replace = [",", "(", ")", "?", "¿", "<", ">", ".", '"\n', '"', ":", "%s", "%d", "/", "'", ";", "×", "!", "¡"];
    for (p = 0; p < replace.length; p++) {
        replaced = replaced.replace(replace[p], "");
    }
    replaced = replaced.replace(/ /g, '-');
    // Needed to generate new data for localization.ini
    // txt = "\n" + replaced + " = " + text;
    // if (translated.lastIndexOf(txt) == -1) {
    //     translated = translated + txt;
    //  }
    // You can log translated in console.log(translated)
    try {
        translation = document.webL10n.get(replaced);
        if (translation == '') {
            translation = text;
        };
        return translation;
    } catch (e) {
        return text;
    }
};


function processRawPluginData(rawData, palettes, blocks, errorMsg, evalFlowDict, evalArgDict, evalParameterDict, evalSetterDict) {
    // console.log(rawData);
    var lineData = rawData.split('\n');
    var cleanData = '';

    // We need to remove blank lines and comments and then
    // join the data back together for processing as JSON.
    for (i = 0; i < lineData.length; i++) {
        if (lineData[i].length == 0) {
            continue;
        }
        if (lineData[i][0] == '/') {
            continue;
        }
        cleanData += lineData[i];
    }

    // Note to plugin developers: You may want to comment out this
    // try/catch while debugging your plugin.
    try {
        var obj = processPluginData(cleanData.replace(/\n/g,''), palettes, blocks, evalFlowDict, evalArgDict, evalParameterDict, evalSetterDict);
    } catch (e) {
        var obj = null;
        errorMsg('Error loading plugin: ' + e);
    }
    return obj;
}


function processPluginData(pluginData, palettes, blocks, evalFlowDict, evalArgDict, evalParameterDict, evalSetterDict) {
    // Plugins are JSON-encoded dictionaries.
    // console.log(pluginData);
    var obj = JSON.parse(pluginData);

    // Create a palette entry.
    var newPalette = false;
    if ('PALETTEPLUGINS' in obj) {
        for (var name in obj['PALETTEPLUGINS']) {
            PALETTEICONS[name] = obj['PALETTEPLUGINS'][name];
            var fillColor = '#ff0066';
            if ('PALETTEFILLCOLORS' in obj) {
                if (name in obj['PALETTEFILLCOLORS']) {
                    var fillColor = obj['PALETTEFILLCOLORS'][name];
                    // console.log(fillColor);
                }
            }
            PALETTEFILLCOLORS[name] = fillColor;

            var strokeColor = '#ef003e';
            if ('PALETTESTROKECOLORS' in obj) {
                if (name in obj['PALETTESTROKECOLORS']) {
                    var strokeColor = obj['PALETTESTROKECOLORS'][name];
                    // console.log(strokeColor);
                }
            }
            PALETTESTROKECOLORS[name] = strokeColor;

            var highlightColor = '#ffb1b3';
            if ('PALETTEHIGHLIGHTCOLORS' in obj) {
                if (name in obj['PALETTEHIGHLIGHTCOLORS']) {
                    var highlightColor = obj['PALETTEHIGHLIGHTCOLORS'][name];
                    // console.log(highlightColor);
                }
            }
            PALETTEHIGHLIGHTCOLORS[name] = highlightColor;

            var strokeHighlightColor = '#404040';
            if ('HIGHLIGHTSTROKECOLORS' in obj) {
                if (name in obj['HIGHLIGHTSTROKECOLORS']) {
                    var strokeHighlightColor = obj['HIGHLIGHTSTROKECOLORS'][name];
                    // console.log(highlightColor);
                }
            }
            HIGHLIGHTSTROKECOLORS[name] = strokeHighlightColor;

            if (name in palettes.buttons) {
                console.log('palette ' + name + ' already exists');
            } else {
                console.log('adding palette ' + name);
                palettes.add(name);
                newPalette = true;
            }
        }
    }

    if (newPalette) {
        try {
            palettes.makePalettes();
        } catch (e) {
            console.log('makePalettes: ' + e);
        }
    }

    // Define the image blocks
    if ('IMAGES' in obj)  {
        for (var blkName in obj['IMAGES'])  {
            pluginsImages[blkName] = obj['IMAGES'][blkName];
        }
    }


    // Populate the flow-block dictionary, i.e., the code that is
    // eval'd by this block.
    if ('FLOWPLUGINS' in obj) {
        for (var flow in obj['FLOWPLUGINS']) {
            evalFlowDict[flow] = obj['FLOWPLUGINS'][flow];
        }
    }

    // Populate the arg-block dictionary, i.e., the code that is
    // eval'd by this block.
    if ('ARGPLUGINS' in obj) {
        for (var arg in obj['ARGPLUGINS']) {
            evalArgDict[arg] = obj['ARGPLUGINS'][arg];
        }
    }

    // Populate the setter dictionary, i.e., the code that is
    // used to set a value block.
    if ('SETTERPLUGINS' in obj) {
        for (var setter in obj['SETTERPLUGINS']) {
            evalSetterDict[setter] = obj['SETTERPLUGINS'][setter];
        }
    }

    // Create the plugin protoblocks.
    if ('BLOCKPLUGINS' in obj) {
        for (var block in obj['BLOCKPLUGINS']) {
            console.log('adding plugin block ' + block);
            try {
                eval(obj['BLOCKPLUGINS'][block]);
            } catch (e) {
                console.log('Failed to load plugin for ' + block + ': ' + e);
            }
        }
    }

    // Create the globals.
    if ('GLOBALS' in obj) {
        eval(obj['GLOBALS']);
    }

    if ('PARAMETERPLUGINS' in obj) {
        for (var parameter in obj['PARAMETERPLUGINS']) {
            evalParameterDict[parameter] = obj['PARAMETERPLUGINS'][parameter];
        }
    }

    // Push the protoblocks onto their palettes.
    for (var protoblock in blocks.protoBlockDict) {
        if (blocks.protoBlockDict[protoblock].palette == undefined) {
            console.log('Cannot find palette for protoblock ' + protoblock);
        } else {
            blocks.protoBlockDict[protoblock].palette.add(blocks.protoBlockDict[protoblock]);
        }
    }

    palettes.updatePalettes();

    // Populate the lists of block types.
    blocks.findBlockTypes();

    // Return the object in case we need to save it to local storage.
    return obj;
}


function updatePluginObj(obj) {
    for (var name in obj['PALETTEPLUGINS']) {
        pluginObjs['PALETTEPLUGINS'][name] = obj['PALETTEPLUGINS'][name];
    }
    for (var name in obj['PALETTEFILLCOLORS']) {
        pluginObjs['PALETTEFILLCOLORS'][name] = obj['PALETTEFILLCOLORS'][name];
    }
    for (var name in obj['PALETTESTROKECOLORS']) {
        pluginObjs['PALETTESTROKECOLORS'][name] = obj['PALETTESTROKECOLORS'][name];
    }
    for (var name in obj['PALETTEHIGHLIGHTCOLORS']) {
        pluginObjs['PALETTEHIGHLIGHTCOLORS'][name] = obj['PALETTEHIGHLIGHTCOLORS'][name];
    }
    for (var flow in obj['FLOWPLUGINS']) {
        pluginObjs['FLOWPLUGINS'][flow] = obj['FLOWPLUGINS'][flow];
    }
    for (var arg in obj['ARGPLUGINS']) {
        pluginObjs['ARGPLUGINS'][arg] = obj['ARGPLUGINS'][arg];
    }
    for (var block in obj['BLOCKPLUGINS']) {
        pluginObjs['BLOCKPLUGINS'][block] = obj['BLOCKPLUGINS'][block];
    }
    if ('GLOBALS' in obj) {
        pluginObjs['GLOBALS'] = obj['GLOBALS'];
    }
    if ('IMAGES' in obj) {
        pluginObjs['IMAGES'] = obj['IMAGES'];
    }
}


function preparePluginExports(obj) {
    // add obj to plugin dictionary and return as JSON encoded text
    updatePluginObj(obj);

    return JSON.stringify(pluginObjs);
}


function processMacroData(macroData, palettes, blocks, macroDict) {
    // Macros are stored in a JSON-encoded dictionary.
    if (macroData != '{}') {
        var obj = JSON.parse(macroData);
        console.log('adding myblocks palette');
        palettes.add('myblocks', 'black', '#a0a0a0');
        for (name in obj) {
            console.log('adding ' + name + ' to macroDict');
            macroDict[name] = obj[name];
            blocks.addToMyPalette(name, macroDict[name]);
        }
        palettes.makePalettes();
    }
}


function prepareMacroExports(name, stack, macroDict) {
    if (name != null) {
        macroDict[name] = stack;
    }
    return JSON.stringify(macroDict);
}


function doSaveSVG(logo, desc) {
    var svg = doSVG(logo.canvas, logo, logo.turtles, logo.canvas.width, logo.canvas.height, 1.0);
    download(desc, 'data:image/svg+xml;utf8,' + svg, desc, '"width=' + logo.canvas.width + ', height=' + logo.canvas.height + '"');
}

function download(filename, data) {
    var a = document.createElement('a');
    a.setAttribute('href', data);
    a.setAttribute('download', filename);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

// Some block-specific code

// Publish to FB
function doPublish(desc) {
    var url = doSave();
    console.log('push ' + url + ' to FB');
    var descElem = docById("description");
    var msg = desc + ' ' + descElem.value + ' ' + url;
    console.log('comment: ' + msg);
    var post_cb = function() {
        FB.api('/me/feed', 'post', {
            message: msg
        });
    };

    FB.login(post_cb, {
        scope: 'publish_actions'
    });
}


// TODO: Move to camera plugin
var hasSetupCamera = false;
function doUseCamera(args, turtles, turtle, isVideo, cameraID, setCameraID, errorMsg) {
    var w = 320;
    var h = 240;

    var streaming = false;
    var video = document.querySelector('#camVideo');
    var canvas = document.querySelector('#camCanvas');
    navigator.getMedia = (navigator.getUserMedia ||
                          navigator.mozGetUserMedia ||
                          navigator.webkitGetUserMedia ||
                          navigator.msGetUserMedia);
    if (navigator.getMedia === undefined) {
        errorMsg('Your browser does not support the webcam');
    }

    if (!hasSetupCamera) {
        navigator.getMedia(
            {video: true, audio: false},
            function (stream) {
                if (navigator.mozGetUserMedia) {
                    video.mozSrcObject = stream;
                } else {
                    var vendorURL = window.URL || window.webkitURL;
                    video.src = vendorURL.createObjectURL(stream);
                }
                video.play();
                hasSetupCamera = true;
            }, function (error) {
                errorMsg('Could not connect to camera');
                console.log('Could not connect to camera', error);
        });
    } else {
        streaming = true;
        video.play();
        if (isVideo) {
            cameraID = window.setInterval(draw, 100);
            setCameraID(cameraID);
        } else {
            draw();
        }
    }

    video.addEventListener('canplay', function (event) {
        console.log('canplay', streaming, hasSetupCamera);
        if (!streaming) {
            video.setAttribute('width', w);
            video.setAttribute('height', h);
            canvas.setAttribute('width', w);
            canvas.setAttribute('height', h);
            streaming = true;

            if (isVideo) {
                cameraID = window.setInterval(draw, 100);
                setCameraID(cameraID);
            } else {
                draw();
            }
        }
    }, false);

    function draw() {
        canvas.width = w;
        canvas.height = h;
        canvas.getContext('2d').drawImage(video, 0, 0, w, h);
        var data = canvas.toDataURL('image/png');
        turtles.turtleList[turtle].doShowImage(args[0], data);
    }
}


function doStopVideoCam(cameraID, setCameraID) {
    if (cameraID != null) {
        window.clearInterval(cameraID);
    }
    setCameraID(null);
    document.querySelector('#camVideo').pause();
}


function hideDOMLabel() {
    var textLabel = docById('textLabel');
    if (textLabel != null) {
        textLabel.style.display = 'none';
    }
    var numberLabel = docById('numberLabel');
    if (numberLabel != null) {
        numberLabel.style.display = 'none';
    }
}


function displayMsg(blocks, text) {
    return;
    var msgContainer = blocks.msgText.parent;
    msgContainer.visible = true;
    blocks.msgText.text = text;
    msgContainer.updateCache();
    blocks.stage.setChildIndex(msgContainer, blocks.stage.getNumChildren() - 1);
}
