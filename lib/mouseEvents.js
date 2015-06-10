
/*
----NEWS----
0.1 : Initial version, performance improvements due, define operation in 2D or 3D mode and accordingly set bounding box or raytracker algo.
0.2 : Implemented the mouse over and mouse out functionality, removed the frequency option as it was not working.
0.3 : Added pressmove and pressup support

Next version:
* Frequency setting for mousemove and mouseover.
* touch support
* Need to make the api cleaner / better (mesh.on & mesh.off directly)
* Need to optimize code
* Need to add code to remove object duplicates
* Need to add remove event handlers
* Add hit area support like easel js

*/

/*
Library use example : 
	// Event library initialize
	var events = [{'name' : 'click', 'bubble' : false},{'name' : 'dblclick', 'bubble' : false},{'name' : 'mousedown', 'bubble' : false},{'name' : 'mouseup', 'bubble' : false},{'name' : 'mousemove', 'bubble' : false}];
	var eventObject  = new MouseEvents(events, webGLRenderer, window.innerWidth, window.innerHeight,camera,'3D');
	eventObject.initMouseEvents(eventObject);

	mesh.addEventListener('click',function(){
		console.log('Object Clicked');
	}, false);
	eventObject.add('click',mesh);


*/


// Takes the events that need to be initialize and the renderer
function MouseEvents(events, renderer, width, height, camera, mode){
	this.events = events;
	this.renderer = renderer;
	this.mode = mode;
	this.mouseTHREECoordinates = new THREE.Vector2();
	this.mouseCoordinates = new THREE.Vector2();
	this.windowInnerWidth = width;
	this.windowInnerHeight = height;
	this.raycaster = new THREE.Raycaster();
	this.camera = camera;
	this.clickArray = [];
	this.dblclickArray = [];
	this.mousedownArray = [];
	this.mouseupArray = [];
	this.mousemotionArray = [];

	this.initMouseEvents = function(me){
		for(var i = 0; i<this.events.length ; i++){
			var eventName = this.events[i].name;
			switch(eventName){
				case 'click': this.renderer.domElement.addEventListener( 'click', function(event){
					if(me.clickArray.length > 0){
						me.onSceneEvent(event,'click');
					}
				}, this.events[i].bubble );
				break;
				case 'dblclick': this.renderer.domElement.addEventListener( 'dblclick', function(event){
					if(me.dblclickArray.length > 0){
						me.onSceneEvent(event,'dblclick');
					}
				}, this.events[i].bubble );	
				break;
				case 'mousedown' : this.renderer.domElement.addEventListener( 'mousedown',  function(event){
					if(me.mousedownArray.length > 0){
						me.onSceneEvent(event,'mousedown');
					}
				}, this.events[i].bubble );
				break;
				case 'mouseup' : this.renderer.domElement.addEventListener( 'mouseup',  function(event){
					if(me.mouseupArray.length > 0){
						me.onSceneEvent(event,'mouseup');
 					}
				}, this.events[i].bubble );	
				break;
				case 'mousemove' : this.renderer.domElement.addEventListener( 'mousemove',  function(event){
					if(me.mousemotionArray.length > 0 || me.mousedownArray.length > 0){
						me.onSceneEvent(event,'mousemotion');
					}
				}, this.events[i].bubble );
				break;
				default : console.log('Invalid event entered');
			}
		}
	}

	this.add = function(event,mesh){
		switch(event){
			case 'click': this.clickArray.push(mesh);
			break;
			case 'dblclick': this.dblclickArray.push(mesh);
			break;
			case 'mousedown' : this.mousedownArray.push(mesh);
			break;
			case 'mouseup' : this.mouseupArray.push(mesh);
			break;
			case 'mousemotion' : this.mousemotionArray.push(mesh);
			break;
			case 'pressmove' : this.mousedownArray.push(mesh);
			break;
			case 'pressup' : this.mouseupArray.push(mesh);
			break;
			default : console.log('Invalid event entered');
		}
	}

	this.onSceneEvent = function(event,eventName){
		event.preventDefault();
		var intersects;
		this.mouseTHREECoordinates.x = ( event.clientX / this.renderer.domElement.width ) * 2 - 1;
        this.mouseTHREECoordinates.y = - ( event.clientY / this.renderer.domElement.height ) * 2 + 1;
        this.raycaster.setFromCamera( this.mouseTHREECoordinates, this.camera );
		switch(eventName){
			case 'click': 
				intersects = this.raycaster.intersectObjects(this.clickArray);
        		if(intersects.length > 0){

        			for(var i=0; i<intersects.length; i++){
        				intersects[i].object.dispatchEvent(setEventTypeMesh(event,'click', intersects[i].object));
        			}
       			 }
				break;
			case 'dblclick':
				intersects = this.raycaster.intersectObjects(this.dblclickArray);
        		if(intersects.length > 0){
        			for(var i=0; i<intersects.length; i++){
        				intersects[i].object.dispatchEvent(setEventTypeMesh(event,'dblclick', intersects[i].object));
        			}
       			 }
				break;
			case 'mousedown' :
				intersects = this.raycaster.intersectObjects(this.mousedownArray);
        		if(intersects.length > 0){
        			for(var i=0; i<intersects.length; i++){
        				if(intersects[i].object._listeners.hasOwnProperty('mousedown')){
        					intersects[i].object.dispatchEvent(setEventTypeMesh(event,'mousedown', intersects[i].object));
        					intersects[i].object._listeners.mousedown.active = true;
        				}
        				else if(intersects[i].object._listeners.hasOwnProperty('pressmove')){
        					intersects[i].object.dispatchEvent(setEventTypeMesh(event,'pressmove', intersects[i].object));
        					intersects[i].object._listeners.pressmove.active = true;
        				}
        			}
       			 }
				break;
			case 'mouseup' : 
				intersects = this.raycaster.intersectObjects(this.mouseupArray);
        		if(intersects.length > 0){
        			for(var i=0; i<intersects.length; i++){
        				if(intersects[i].object._listeners.hasOwnProperty('mousedown')){
        					if(intersects[i].object._listeners.mousedown.active){
        						intersects[i].object._listeners.mousedown.active = false;
        					}
        				}
        				if(intersects[i].object._listeners.hasOwnProperty('mouseup')){
        					intersects[i].object.dispatchEvent(setEventTypeMesh(event,'mouseup', intersects[i].object));
        				}
        				if(intersects[i].object._listeners.hasOwnProperty('pressup')){
        					if(intersects[i].object._listeners.pressmove.active){
        						intersects[i].object.dispatchEvent(setEventTypeMesh(event,'pressup', intersects[i].object));
       			 				intersects[i].object._listeners.pressmove.active = false;
       			 			}
        				}
        			}
       			 }
       			 for(i=0; i< this.mousedownArray.length; i++){
       			 	if(this.mousedownArray[i]._listeners.hasOwnProperty('mousedown')){
       			 		if(this.mousedownArray[i]._listeners.mousedown.active){
       			 			this.mousedownArray[i]._listeners.mousedown.active = false;
       			 		}
       			 	}
       			 	else if(this.mousedownArray[i]._listeners.hasOwnProperty('pressmove')){
       			 		if(this.mousedownArray[i]._listeners.pressmove.active){
       			 			this.mousedownArray[i].dispatchEvent(setEventTypeMesh(event,'pressup', this.mousedownArray[i]));
       			 			this.mousedownArray[i]._listeners.pressmove.active = false;
       			 		}
       			 	}
       			 }
				break;

			case 'mousemotion' : 
				var flag;
				for(var i = 0; i<this.mousedownArray.length; i++){
					if(this.mousedownArray[i]._listeners.hasOwnProperty('pressmove')){
						if(this.mousedownArray[i]._listeners.pressmove.active){
							this.mousedownArray[i].dispatchEvent(setEventTypeMesh(event,'pressmove', this.mousedownArray[i]));
						}
					}
				}
				intersects = this.raycaster.intersectObjects(this.mousemotionArray);
        		if(intersects.length > 0){
        			for(var i=0; i<intersects.length; i++){
        				if(intersects[i].object._listeners.hasOwnProperty('mousemove')){
        					intersects[i].object.dispatchEvent(setEventTypeMesh(event,'mousemove', intersects[i].object));
        				}
        				else if(intersects[i].object._listeners.hasOwnProperty('mouseover')){
        					if(intersects[i].object._listeners.mouseover.active == undefined){
        						intersects[i].object._listeners.mouseover.active = true;
        						intersects[i].object.dispatchEvent(setEventTypeMesh(event,'mouseover', intersects[i].object));
        						
        					}
        					else if(intersects[i].object._listeners.mouseover.active == false){
        						intersects[i].object._listeners.mouseover.active = true;
        						intersects[i].object.dispatchEvent(setEventTypeMesh(event,'mouseover', intersects[i].object));
        					}
        				}
        			}
       			 }

       			 // Check for mouseout
       			 for(i=0; i < this.mousemotionArray.length; i++){
       			 	flag = false;
       			 	if(this.mousemotionArray[i]._listeners.mouseover.active == true){
       			 		for(var j = 0; j<intersects.length; j++){
	       			 		if(intersects[j].object == this.mousemotionArray[i])
	       			 			flag = true;
	       			 			break;
	       			 	}
	       			 	if(flag){
       			 			break;
       			 		}
	       			 	else if(!flag){
	       			 		if(this.mousemotionArray[i]._listeners.hasOwnProperty('mouseout')){
	       			 			this.mousemotionArray[i].dispatchEvent(setEventTypeMesh(event,'mouseout', this.mousemotionArray[i]));
	       			 		}
	       			 		this.mousemotionArray[i]._listeners.mouseover.active = false;
	       			 	}
       			 	}
       			 }
				break;

			default : console.log('Invalid event entered');
		}
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

