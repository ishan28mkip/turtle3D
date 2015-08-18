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
    
    this.icon  = null;
    this.border = null;
    this.borderHighlight = null;

    this.container = new THREE.Group();

    function makeBorderHighlight(me) {
        // FIXME : Scale
        var scale = 1;
        scale = me.size / me.iconsize;

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

            var borderHighlight = new THREE.Mesh(new THREE.PlaneBufferGeometry(img.width * scale, img.height * scale),material);
            borderHighlight.name = 'trashBorderHighlight';
            borderHighlight.imgWidth = img.width * scale;
            borderHighlight.imgHeight = img.height * scale;
            borderHighlight.initialWidth = img.width;
            borderHighlight.initialHeight = img.height;

            me.borderHighlight = borderHighlight;

            me.container.add(borderHighlight);
            me.container.visible = false;
            me.borderHighlight.visible = false;
            me.icon.visible = true;
            me.border.visible = true;
            
        }
        img.src = 'data:image/svg+xml;base64,' + window.btoa(
            unescape(encodeURIComponent(BORDER.replace('stroke_color', '#555555'))));
    }

    function makeBorder(me) {
        var scale = 1;
        scale = me.size / me.iconsize;

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

            var border = new THREE.Mesh(new THREE.PlaneBufferGeometry(img.width * scale, img.height * scale),material);
            border.name = 'trashBorder';
            border.imgWidth = img.width * scale;
            border.imgHeight = img.height * scale;
            border.initialWidth = img.width;
            border.initialHeight = img.height;

            me.border = border;

            me.container.add(border);

            me.container.hitmesh = border;
            border.parentMesh = me.container;

            me.container.on('mouseover',function(event){
                me.highlight();
            });
            me.container.on('mouseout',function(event){
                me.unhighlight();
            });

            border.visible = false;

            makeBorderHighlight(me);
            
        }
        img.src = 'data:image/svg+xml;base64,' + window.btoa(
            unescape(encodeURIComponent(BORDER.replace('stroke_color', '#e0e0e0'))));
    }

    function makeTrash(me) {
        var scale = 1;
        scale = me.size / me.iconsize;

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

            var trashIcon = new THREE.Mesh(new THREE.PlaneBufferGeometry(img.width * scale, img.height * scale),material);
            trashIcon.name = 'trashIcon';
            trashIcon.imgWidth = img.width * scale;
            trashIcon.imgHeight = img.height * scale;
            trashIcon.initialWidth = img.width;
            trashIcon.initialHeight = img.height;

            me.icon = trashIcon;
            me.container.add(me.icon);
            me.icon.visible = false;

            me.container.position.setX(0);
            me.container.position.setY(-window.innerHeight/2 + ((TRASHHEIGHT + size) / 2));
            // FIXME : Scaling
            // me.container.position.setY(-window.innerHeight/2 + ((TRASHHEIGHT + size) / 2) * me.container.scaleY);

            makeBorder(me);            
        }
        img.src = 'images/trash.svg';
    }

    this.resizeEvent = function(scale) {
        this.container.position.setX(0);
        this.container.position.setY(-window.innerHeight/2 + ((TRASHHEIGHT + size) / 2));
        // FIXME : Scaling
        // this.container.position.setY(-window.innerHeight/2 + ((TRASHHEIGHT + size) / 2) * this.container.scaleY);
    }

    this.stage.add(this.container);
    // FIXME : Z-index, push to bottom
    this.resizeEvent(1);
    makeTrash(this);

    this.hide = function() {
        var me = this;
        this.container.traverse(function(node){
            if(node.material){
                var tween = TweenLite.to(node.material, 0.5, 
                {   
                    opacity : 0,
                    onUpdate: function(){
                        me.refreshCanvas(1);
                    },
                    onComplete: function(){
                        me.container.visible = false;
                    }
                });
            }
        });
    }

    this.show = function() {
        var me = this;
        this.container.visible = true;
        this.container.traverse(function(node){
            if(node.material){
                var tween = TweenLite.to(node.material, 0.5, 
                {   
                    opacity : 1,
                    onUpdate: function() {
                        me.refreshCanvas(1);
                    },
                });
            }
        }); 
    }

    this.highlight = function() {
        if (this.borderHighlight !== null) {
            this.borderHighlight.visible = true;
            this.border.visible = false;
            this.icon.visible = true;
            this.container.visible = true;
            this.refreshCanvas(1);
        }
    }

    this.unhighlight = function() {
        if (this.border !== null) {
            this.border.visible = true;
            this.borderHighlight.visible = false;
            this.icon.visible = true;
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

