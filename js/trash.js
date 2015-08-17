// PE : Check the scaling and if it is not working fix it
// Code Snippets
   // Set interval based opacity animation
    // var me = this;
    // var interval = setInterval(function(){
    //     me.container.traverse( function( node ) {
    //         if( node.material) {
    //             if(node.material.opacity - (1/10) > 0)
    //                 node.material.opacity = node.material.opacity - (1/10);
    //             else
    //                 clearInterval(interval);
    //         }
    //     });
    //     me.refreshCanvas(1);
    // },20);
    
    // View overtrashcan function for coordinate conversion demo

// require(['activity/utils']);

var TRASHWIDTH = 320;
var TRASHHEIGHT = 120;


function Trashcan (canvas, stage, size, refreshCanvas) {
    this.canvas = canvas;
    this.stage = stage;
    this.refreshCanvas = refreshCanvas;
    this.size = size;
    this.iconsize = 55;  // default value
    this.container = new THREE.Group();

    function makeBorderHighlight(me) {

        var img = new Image();
        img.onload = function(){
            var texture = new THREE.Texture(img) 
            texture.needsUpdate = true;
            var material = new THREE.MeshBasicMaterial( {map: texture, side: THREE.DoubleSide} );
            material.transparent = true;
            var border = new THREE.Mesh(new THREE.PlaneBufferGeometry(img.width*me.container.scaleX, img.height*me.container.scaleY),material);
            me.container.add(border);
            border.name = 'trashBorderHighlight';
            // bounds = me.container.getBounds(); //cache feature does not make sense for webgl based rendering
            // me.container.cache(bounds.x, bounds.y, bounds.width, bounds.height);
            // Hide the trash until a block is moved
            me.container.visible = false;
            refreshCanvas(1);
        }
        img.src = 'data:image/svg+xml;base64,' + window.btoa(
            unescape(encodeURIComponent(BORDER.replace('stroke_color', '#555555'))));
    }

    function makeBorder(me) {
        var img = new Image();
        img.onload = function(){
            var texture = new THREE.Texture(img) 
            texture.needsUpdate = true;
            var material = new THREE.MeshBasicMaterial( {map: texture, side: THREE.DoubleSide} );
            material.transparent = true;
            var border = new THREE.Mesh(new THREE.PlaneBufferGeometry(img.width*me.container.scaleX, img.height*me.container.scaleY),material);
            me.container.add(border);
            border.name = 'trashBorder';
            
            me.container.hitmesh = border;
            border.parentMesh = me.container;

            // Remove these when done
            me.container.on('mouseover',function(event){
                me.highlight();
            });
            me.container.on('mouseout',function(event){
                me.unhighlight();
            });

            makeBorderHighlight(me);
        }
        img.src = 'data:image/svg+xml;base64,' + window.btoa(
            unescape(encodeURIComponent(BORDER.replace('stroke_color', '#e0e0e0'))));
    }

    function makeTrash(me) {
        var img = new Image();
        img.onload = function () {
            var texture = new THREE.Texture(img) 
            texture.needsUpdate = true;
            var material = new THREE.MeshBasicMaterial( {map: texture, side: THREE.DoubleSide} );
            material.transparent = true;
            me.container.scaleX = size/me.iconsize;
            me.container.scaleY = size/me.iconsize;
            var bitmap = new THREE.Mesh(new THREE.PlaneBufferGeometry(me.container.scaleX*img.width, me.container.scaleY*img.height),material);
            me.container.add(bitmap);
            bitmap.name = 'trashIcon';
            // var axes = buildAxes( 1000 );
            // me.container.add( axes );
            // me.iconsize = bitmap.getBounds().width; //PE : see why is this done
            me.container.position.set(0, -window.innerHeight/2 + ((TRASHHEIGHT + size) / 2) * me.container.scaleY ,1);
            makeBorder(me);
        }
        img.src = 'images/trash.svg';
    }

    // TODO set the y properly
    this.resizeEvent = function(scale) {
        this.container.position.setX(0);
        this.container.position.setY(-window.innerHeight/2 + ((TRASHHEIGHT + size) / 2) * this.container.scaleY);
    }

    this.stage.add(this.container);
    // this.stage.setChildIndex(this.container, 0); //see why this is used
    this.resizeEvent(1);
    makeTrash(this);


    this.hide = function() {
        var me = this;
        this.container.visible = false;
        // TODO : Fix this animation. See how to add requestAnimationFrame properly.
        // this.container.traverse(function(node){
        //     if(node.material){
        //         node.material.transparent = true;
        //         var tween = new TWEEN.Tween( node.material )
        //         .to( { opacity: 0 }, 200 )
        //         .onUpdate( function () {
        //             me.refreshCanvas(1);
        //         })
        //         .onComplete( function(){
        //             me.container.visible = false;
        //         })
        //         .start();
        //     }
        // });
    }

    this.show = function() {
        var me = this;
        var flag;
        this.container.visible = true;
        // TODO : Fix this animation. See how to add requestAnimationFrame properly.
        // this.container.traverse(function(node){
        //     if(node.material){
        //         node.material.transparent = true;
        //         if(!flag){
        //             flag = true;
        //             me.container.visible = true;
        //         }
        //         node.material.opacity = 0;
        //         var tween = new TWEEN.Tween( node.material )
        //         .to( { opacity: 1.0 }, 200 )
        //         .onUpdate( function () {
        //             me.refreshCanvas(1);
        //         })
        //         .start();
        //     }
        // });        
    }

    this.highlight = function() {
        if (!last(this.container.children).visible) {
            last(this.container.children).visible = true;
            this.container.children[1].visible = false;
            this.container.visible = true;
            this.refreshCanvas(1);
        }
    }

    this.unhighlight = function() {
        if (last(this.container.children).visible) {
            last(this.container.children).visible = false;
            this.container.children[1].visible = true;
            this.container.visible = true;
            this.refreshCanvas(1);
        }
    }

    this.overTrashcan = function(x, y) {

        var currentTrashWidth = (TRASHWIDTH * this.size / this.iconsize);
        var currentTrashHeight = (TRASHHEIGHT * this.size / this.iconsize);
        var tx = this.container.position.x;
        var ty = this.container.position.y;
        tx = mouseCoorX(tx-currentTrashWidth/2);
        ty = mouseCoorY(ty+currentTrashHeight/2);

        if (x < tx) {
            return false;
        } else if (x > tx + currentTrashWidth) {
            return false;
        }
        if (y < ty) {
            return false;
        }
        return true;
    }
}

