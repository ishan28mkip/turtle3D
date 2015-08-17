// TODO : Fix the bug that if a object is present infront of a clickable object the object will still be clicked,
//        this should not happen but if all objects on screen are again and again checked for clicks than the
//        library will become very slow, so instead we will just add a new event handler to objects known as
//        canObstruct which will be added in all arrays. 

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

// TODO : Replace window.innerWidth & window.innerHeight with canvas width and height or with current scene height and width with scaling
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
    return (x + window.innerWidth/2);
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
    axes.add( buildAxis( new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( length, 0, 0 ), 0xFF0000, false ) ); // +X
    axes.add( buildAxis( new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( -length, 0, 0 ), 0xFF0000, true) ); // -X
    axes.add( buildAxis( new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( 0, length, 0 ), 0x00FF00, false ) ); // +Y
    axes.add( buildAxis( new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( 0, -length, 0 ), 0x00FF00, true ) ); // -Y
    axes.add( buildAxis( new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( 0, 0, length ), 0x0000FF, false ) ); // +Z
    axes.add( buildAxis( new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( 0, 0, -length ), 0x0000FF, true ) ); // -Z
    return axes;

}

function buildAxis( src, dst, colorHex, dashed ) {
    var geom = new THREE.Geometry(),mat; 

    if(dashed) {
        mat = new THREE.LineDashedMaterial({ linewidth: 3, color: colorHex, dashSize: 1, gapSize: 1 });
    } else {
        mat = new THREE.LineBasicMaterial({ linewidth: 3, color: colorHex });
    }
    geom.vertices.push( src.clone() );
    geom.vertices.push( dst.clone() );
    geom.computeLineDistances(); 

    var axis = new THREE.Line( geom, mat, THREE.LinePieces );

    return axis;
}


// News 
// Bubbling needs to be added
// Optimize the library
// FIXME mouseup bug : If mousedown is on element1 and element2 also has mousedown and mouseup events attached then mouseup event will fire even if mouse is on element2. Event should only fire if mouse is on element1. 
// FIXME mouseout can only be used with mouseover & pressmove can only be used along with pressup
// TODO : Add many to one and one to many binding on hitmesh

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
var num = 0;

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
        else if(!(this.hasOwnProperty('hitmesh'))){
            // TODO : Later log this in a debugger instead
            // console.log(this , 'does not have a hitmesh and is not a mesh');
        }
        else if(this.hitmesh.type !== 'Mesh'){
            // TODO : Later log this in a debugger instead
            // console.log(this ,  'has a hitmesh which is not a mesh');
        }

        if(this.hasOwnProperty('hitmesh') && this.hitmesh.type == 'Mesh'){
            this.hitmesh.parentMesh = this;
            this.addEventListener(eventName, function(event){
                callback(event);
            });
            switch(eventName){
                case 'click': clickArray.push(this.hitmesh);
                break;
                case 'dblclick': dblclickArray.push(this.hitmesh);
                break;
                case 'mousedown' : 
                    if(this._listeners.hasOwnProperty('pressmove')){
                        break;
                    }
                    else{
                        mousedownArray.push(this.hitmesh);
                        break;
                    }
                case 'mouseup' : 
                    if(this._listeners.hasOwnProperty('pressup')){
                        break;
                    }
                    else{
                        mouseupArray.push(this.hitmesh);
                        break;
                    }
                case 'mousemove' : 
                    if(this._listeners.hasOwnProperty('mouseover') || this._listeners.hasOwnProperty('mouseout')){
                        break;
                    }
                    else{
                        mousemotionArray.push(this.hitmesh);
                        break;
                    }
                case 'mouseover' : 
                    if(this._listeners.hasOwnProperty('mousemove') || this._listeners.hasOwnProperty('mouseout')){
                        break;
                    }
                    else{
                        mousemotionArray.push(this.hitmesh);
                        break;
                    }
                case 'mouseout' :
                    if(this._listeners.hasOwnProperty('mousemove') || this._listeners.hasOwnProperty('mouseover')){
                        break;
                    }
                    else{
                        mousemotionArray.push(this.hitmesh);
                        break;
                    }
                case 'pressmove' : 
                    if(this._listeners.hasOwnProperty('mousedown')){
                        break;
                    }
                    else{
                        mousedownArray.push(this.hitmesh);
                        break;
                    }
                case 'pressup' : 
                    if(this._listeners.hasOwnProperty('mouseup')){
                        break;
                    }
                    else{
                        mouseupArray.push(this.hitmesh);
                        break;
                    }
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
        if(eventName === undefined){
            for(var eventName in this._listeners)
                this.off(eventName);
        }
        if(listener === undefined){
            if ( this._listeners === undefined ){
                if(typeof(callback) === 'function')
                    callback(false);
            }
            else if(this._listeners.hasOwnProperty(eventName)){
                this._listeners[eventName] = undefined;
                switch(eventName){
                    case 'click': 
                    if (clickArray.indexOf(this.hitmesh) > -1) {
                        clickArray.splice(clickArray.indexOf(this.hitmesh), 1);
                    }
                    break;
                    case 'dblclick':
                    if (dblClickArray.indexOf(this.hitmesh) > -1) {
                        dblClickArray.splice(dblClickArray.indexOf(this.hitmesh), 1);
                    }
                    break;
                    case 'mousedown' :
                    if (mousedownArray.indexOf(this.hitmesh) > -1) {
                        mousedownArray.splice(mousedownArray.indexOf(this.hitmesh), 1);
                    }
                    break;
                    case 'mouseup' :
                    if (mouseupArray.indexOf(this.hitmesh) > -1) {
                        mouseupArray.splice(mouseupArray.indexOf(this.hitmesh), 1);
                    }
                    break;
                    case 'mousemove' :
                    if (mousemotionArray.indexOf(this.hitmesh) > -1) {
                        mousemotionArray.splice(mousemotionArray.indexOf(this.hitmesh), 1);
                    }
                    break;
                    case 'mouseover' :
                    if (mousemotionArray.indexOf(this.hitmesh) > -1) {
                        mousemotionArray.splice(mousemotionArray.indexOf(this.hitmesh), 1);
                    }
                    break;
                    case 'mouseout' :
                    if (mousemotionArray.indexOf(this.hitmesh) > -1) {
                        mousemotionArray.splice(mousemotionArray.indexOf(this.hitmesh), 1);
                    }
                    break;
                    case 'pressmove' :
                    if (mousedownArray.indexOf(this.hitmesh) > -1) {
                        mousedownArray.splice(mousedownArray.indexOf(this.hitmesh), 1);
                    }
                    break;
                    case 'pressup' :
                    if (mouseupArray.indexOf(this.hitmesh) > -1) {
                        mouseupArray.splice(mouseupArray.indexOf(this.hitmesh), 1);
                    }
                    break;
                }

                if(typeof(callback) === 'function')
                    callback(true);
            }  
        }
        else{
            if ( this._listeners === undefined )
                if(typeof(callback) === 'function')
                    callback(false);
            var listeners = this._listeners;
            var listenerArray = listeners[ type ];
            if ( listenerArray !== undefined ) {
                var index = listenerArray.indexOf( listener );
                if ( index !== - 1 ) {
                    listenerArray.splice( index, 1 );
                    if(typeof(callback) === 'function')
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
                // TODO : Comment this out when no longer needed
                // Adding code to update the mouse coordinate helper window
                document.getElementById('mouseCoorX').innerHTML = event.clientX;
                document.getElementById('mouseCoorY').innerHTML = event.clientY;
                document.getElementById('threeCoorX').innerHTML = threeCoorX(event.clientX);
                document.getElementById('threeCoorY').innerHTML = threeCoorY(event.clientY);
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
                for(var i = 0; i < intersects.length ; i++){
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
                for(var i = 0; i < intersects.length ; i++){
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
                for(var i = 0; i < intersects.length ; i++){
                    if(intersects[i].object.parentMesh.visible == true){
                        if(intersects[i].object.parentMesh._listeners.hasOwnProperty('mousedown')){
                            intersects[i].object.parentMesh.dispatchEvent(setEventTypeMesh(event,'mousedown', intersects[i].object.parentMesh));
                            intersects[i].object.parentMesh._listeners.mousedown.active = true;
                        }
                        if(intersects[i].object.parentMesh._listeners.hasOwnProperty('pressmove')){
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
                for(var i = 0; i < intersects.length ; i++){
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
                            if(intersects[i].object.parentMesh._listeners.pressmove !== undefined){
                                if(intersects[i].object.parentMesh._listeners.pressmove.active){
                                   intersects[i].object.parentMesh.dispatchEvent(setEventTypeMesh(event,'pressup', intersects[i].object.parentMesh));
                                   intersects[i].object.parentMesh._listeners.pressmove.active = false;
                                }
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
                for(var i = 0; i < intersects.length ; i++){
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

function createBoundingBitmap(container,scene){
    var bounds = container.get2DBounds(true);

    var hexColor = '#'+Math.floor(Math.random()*16777215).toString(16);
    var material = new THREE.LineBasicMaterial({
        color: hexColor,
        linewidth: 3
    });
    var geometry = new THREE.Geometry();
    geometry.vertices.push(new THREE.Vector3(bounds.min.x, bounds.min.y, 10));
    geometry.vertices.push(new THREE.Vector3(bounds.max.x, bounds.min.y, 10));
    geometry.vertices.push(new THREE.Vector3(bounds.max.x, bounds.max.y, 10));
    geometry.vertices.push(new THREE.Vector3(bounds.min.x, bounds.max.y, 10));
    geometry.vertices.push(new THREE.Vector3(bounds.min.x, bounds.min.y, 10));

    var line = new THREE.Line(geometry, material);
    scene.add(line);
}

function createRectangle(width,height,color){
    var rectShape = new THREE.Shape();
    rectShape.moveTo( -width/2, height/2 );
    rectShape.lineTo( width/2, height/2 );
    rectShape.lineTo( width/2, -height/2 );
    rectShape.lineTo( -width/2, -height/2 );
    rectShape.lineTo( -width/2, height/2 );
    var rectGeom = new THREE.ShapeGeometry( rectShape );
    var rectMesh = new THREE.Mesh( rectGeom, new THREE.MeshBasicMaterial( { 'color': color } ) ) ;
    return rectMesh;
}

function createText(text,color,size,font,weight,style,curveSegments){
    // Setting the defaul values
    text = (text === undefined) ? 'Default Text' : text;
    color = (color === undefined) ? 0x000000 : color;
    size = (size === undefined) ? 15 : size;
    font = (font === undefined) ? 'helvetiker' : font;
    weight = (weight === undefined) ? 'normal' : weight;
    style = (style === undefined) ? 'normal' : style;
    curveSegments = (curveSegments === undefined) ? 20 : curveSegments;

    var options = {text : text, 'font' : font,'weight' : weight, 'style' : style,'size' : size,'curveSegments' : curveSegments};

    var textShapes = THREE.FontUtils.generateShapes( text, options );
    var textGeometry = new THREE.ShapeGeometry( textShapes );
    var textMesh = new THREE.Mesh( textGeometry, new THREE.MeshBasicMaterial( { color: color } ) ) ;


    // Setting the default options in the mesh
    options.margin = 10;
    options.color = color;
    options.align = null;
    options.vAlign = null;

    textMesh.options = options;

    textMesh.geometry.computeBoundingBox();
    textMesh.localBounds = textMesh.geometry.boundingBox;

    Object.defineProperty(textMesh, 'text',{
        configurable : false,
        enumerable : false,
        set: function(value) {
            if (typeof value === 'string' || value instanceof String){
                editText(this,value);
                this.options.text = value;
            }   
            else{
                // ERROR 
                console.log('Text Set to non string value');
            } 
        }
    });

    // TODO : Check for valid rgb and hex values
    Object.defineProperty(textMesh, 'color',{
        configurable : false,
        enumerable : false,
        set: function(value) {
            if (typeof value === 'string' || value instanceof String){
                editText(this,this.options.text,{color : value});
                this.options.color = value;
            }   
            else{
                // ERROR 
                console.log('Color set to non string value');
            } 
        }
    });

    // TODO : Place a check to verify if font is loaded otherwise try to load font, otherwise hit error.
    Object.defineProperty(textMesh, 'font',{
        set: function(value) {
            if (typeof value === 'string' || value instanceof String){
                editText(this,this.options.text,{font : value});
                this.options.font = value;
            }   
            else{
                // ERROR 
                console.log('Color set to non string value');
            } 
        }
    });

    // TODO : Place a check to verify if font is loaded otherwise try to load font, otherwise hit error.
    Object.defineProperty(textMesh, 'weight',{
        configurable : false,
        enumerable : false,
        set: function(value) {
            if (!isNaN(value)){
                editText(this,this.options.text,{weight : value});
                this.options.weight = value;
            }   
            else{
                // ERROR 
                console.log('Weight set to not a number');
            } 
        }
    });

    // TODO : Place a check to verify if font is loaded and style exists otherwise try to load font, otherwise hit error.
    Object.defineProperty(textMesh, 'style',{
        configurable : false,
        enumerable : false,
        set: function(value) {
            if (typeof value === 'string' || value instanceof String){
                editText(this,this.options.text,{style : value});
                this.options.style = value;
            }   
            else{
                // ERROR 
                console.log('Style set to non string value');
            } 
        }
    });

    Object.defineProperty(textMesh, 'size',{
        configurable : false,
        enumerable : false,
        set: function(value) {
            if (!isNaN(value)){
                editText(this,this.options.text,{size : value});
                this.options.size = value;
            }   
            else{
                // ERROR 
                console.log('Size set to not a number');
            } 
        }
    });

    Object.defineProperty(textMesh, 'curveSegments',{
        configurable : false,
        enumerable : false,
        set: function(value) {
            if (!isNaN(value)){
                editText(this,this.options.text,{curveSegments : value});
                this.options.curveSegments = value;
            }   
            else{
                // ERROR 
                console.log('curveSegments set to non string value');
            } 
        }
    });

    Object.defineProperty(textMesh, 'align',{
        configurable : false,
        enumerable : false,
        set: function(value) {
            if ((typeof value === 'string' || value instanceof String) && (value === 'left' || value === 'center' || value === 'right')){
                alignText(this,value);
            }   
            else{
                // ERROR 
                console.log('Align value is wrong');
            } 
        }
    });

    Object.defineProperty(textMesh, 'vAlign',{
        configurable : false,
        enumerable : false,
        set: function(value) {
            if ((typeof value === 'string' || value instanceof String) && (value === 'top' || value === 'middle' || value === 'bottom')){
                alignText(this,value);
            }   
            else{
                // ERROR 
                console.log('vAlign value is wrong');
            } 
        }
    });

    return textMesh;
}

function editText(mesh,text,options){
    if(mesh === undefined){ 
        return;
    }

    if(options === undefined){
        options = mesh.options;
    }
    else{
        options.text = (options.text === undefined) ? mesh.options.text : options.text;
        options.size = (options.size === undefined) ? mesh.options.size : options.size;
        options.font = (options.font === undefined) ? mesh.options.font : options.font;
        options.weight = (options.weight === undefined) ? mesh.options.weight : options.weight;
        options.style = (options.style === undefined) ? mesh.options.style : options.style;
        options.curveSegments = (options.curveSegments === undefined) ? mesh.options.curveSegments : options.curveSegments;
    }
    
    var textShapes = THREE.FontUtils.generateShapes( text, options );
    var newText = new THREE.ShapeGeometry( textShapes );
    mesh.geometry = newText;
    if(options.color !== undefined){
        mesh.material.color.copy(new THREE.Color(options.color));
    }
    mesh.geometry.needsUpdate = true;
    // Call refreshCanvas after call to this function
    mesh.geometry.computeBoundingBox();
    mesh.options.bounds = mesh.geometry.boundingBox;
    mesh.options.baselineHeight = mesh.options.bounds.min.y;
}


function alignText(mesh, value, parent){
    if(mesh === undefined){
        return;
    }

    parent = (parent === undefined) ? mesh.parent : parent;

    if(parent === null || parent === undefined){
        return;
    }

    mesh.options.margin = (mesh.options.margin === undefined) ? 15 : mesh.options.margin;

    if(mesh.options.bounds === undefined){
        mesh.geometry.computeBoundingBox();
        mesh.options.bounds = mesh.geometry.boundingBox;
    }
    
    var width = mesh.options.bounds.max.x - mesh.options.bounds.min.x;
    var height = mesh.options.bounds.max.y - mesh.options.bounds.min.y;

    var parentHeight;
    var parentWidth;
    
    if(parent.type === 'Scene'){
        parentHeight = window.innerHeight;
        parentWidth = window.innerWidth;
    }
    else{
        parent.bounds = new THREE.Box3().setFromObject( parent );
        parent.bounds.size = parent.bounds.size();
        parentHeight = parent.bounds.size.y;
        parentWidth = parent.bounds.size.x;
    }

    switch(value){
        case 'left': 
            mesh.position.setX(-parentWidth/2 + mesh.options.margin);
            break;
        case 'center':
            mesh.position.setX(-width/2);
            break;
        case 'right':
            mesh.position.setX(parentWidth/2 - width - mesh.options.margin);
            break;
        case 'top':
            mesh.position.setY(parentHeight/2 - mesh.options.baselineHeight - height - mesh.options.margin);
            break;
        case 'middle':
            mesh.position.setY(-height/2 - mesh.options.baselineHeight);
            break;
        case 'bottom':
            mesh.position.setY(-parentHeight/2 + mesh.options.margin);
            break;
    }
}

// TODO : Find a better way to find the scene
function getMeshScene(mesh){
    if(mesh === undefined)
        return;
    if(mesh.parent === undefined){
        if(mesh.type === 'Scene'){
            return mesh;
        }
    }    
    else{
        return getMeshScene(mesh.parent);
    }
}


// WARNING : Recursive function avoid usage
function visibilityCheck(object){
    if(object.parent === undefined && object.visible === true)
        return true;
    else if(object.visible == true)
        return visibilityCheck(object.parent);
    else if(object.visible === false)
        return false;
}

//Rotation about the arbitary axis
var rotObjectMatrix;
function rotateAroundObjectAxis(object, axis, radians) {
    rotObjectMatrix = new THREE.Matrix4();
    rotObjectMatrix.makeRotationAxis(axis.normalize(), radians);
    object.matrix.multiply(rotObjectMatrix);
    object.rotation.setFromRotationMatrix(object.matrix);
}

//rotation about world axis
var rotWorldMatrix;
function rotateAroundWorldAxis(object, axis, radians) {
    rotWorldMatrix = new THREE.Matrix4();
    rotWorldMatrix.makeRotationAxis(axis.normalize(), radians);
    rotWorldMatrix.multiply(object.matrix); 
    object.matrix = rotWorldMatrix;
    object.rotation.setFromRotationMatrix(object.matrix);
}

// Removes a mesh and deallocates heap
// FIXME : removeMesh doesn't work anymore
function removeMesh(obj) {
    // FIXME : No dispose function is available for obj.type == Line, also check whether this is supported now
    // if (obj.type === 'Mesh' || obj.type === 'Line'
    if(obj.type === 'Mesh')
    {
        obj.geometry.dispose();
        obj.geometry = null;
        obj.dispose();
        obj = null;
    }
    else
    {
        if (obj.children !== undefined) {
            while (obj.children.length > 0) {
                removeMesh(obj.children[0]);
                obj.remove(obj.children[0]);
            }
        }
    }
}

// Clears a drawing canvas
function clearCanvas(canvas){
    if (canvas.children !== undefined) {
        while (canvas.children.length > 0) {
            removeMesh(canvas.children[0]);
            canvas.remove(canvas.children[0]);
        }
    }
}

function setZindex(container, minLimit, maxLimit){
    container.zIndex = minLimit;
    container.position.setZ(minLimit);
    
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

// DONE
function prepareMacroExports(name, stack, macroDict) {
    if (name != null) {
        macroDict[name] = stack;
    }
    return JSON.stringify(macroDict);
}

// TEST
function doSaveSVG(logo, desc) {
    var svg = doSVG(logo.canvas, logo, logo.turtles, logo.canvas.width, logo.canvas.height, 1.0);
    download(desc, 'data:image/svg+xml;utf8,' + svg, desc, '"width=' + logo.canvas.width + ', height=' + logo.canvas.height + '"');
}

// TEST
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
// DONE
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
// TEST
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

// DONE
function doStopVideoCam(cameraID, setCameraID) {
    if (cameraID != null) {
        window.clearInterval(cameraID);
    }
    setCameraID(null);
    document.querySelector('#camVideo').pause();
}

// DONE
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

// FIXME : Make the edit text command and adding text method in activity
function displayMsg(blocks, text) {
    return;
    var msgContainer = blocks.msgText.parent;
    msgContainer.visible = true;
    // blocks.msgText.text = text;

    // FIXME : Add a bring to top code here
    // blocks.stage.setChildIndex(msgContainer, blocks.stage.getNumChildren() - 1);
}
