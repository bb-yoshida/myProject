const medias = {audio : false, video : {
        facingMode : { exact : "environment" }
        // facingMode: "user"
      }},
      video  = document.getElementById("video"),
      canvas = document.getElementById("canvas"),
      context    = canvas.getContext("2d");


var fileAry = ['img/test3.png'];

var numFiles = fileAry.length;
var loadedCounter = 0;
var imgAry = [];
var aspectAry = [];

var mode = "normal";

var modeArray = ["normal", "grayscale", "brightness", "sepia", "sharpen", 'sobel', "mosaic"];
var modeNum = 0;

loadImgs();

var requestId; 

function loadImgs(){

    var img = new Image();

    img.addEventListener('load', function(){
    	var imgAspect =  img.height / img.width;
        loadedCounter++;
        imgAry.push(img);
        aspectAry.push(imgAspect);
        if(numFiles == loadedCounter){
            requestId = requestAnimationFrame(draw);
        } else {
            loadImgs();
        }
    }, false);

    img.src = fileAry[imgAry.length];
}


navigator.getUserMedia(medias, successCallback, errorCallback);

// requestAnimationFrame(draw);

function successCallback(stream) {
  video.srcObject = stream;
};

function errorCallback(err) {
  alert(err);
};

function draw() {
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
  context.drawImage(video, 0, 0);
  context.drawImage(imgAry[0], 0, 0, canvas.width, canvas.width*aspectAry[0]);
  if(mode == "grayscale"){
  	runFilter(context.getImageData(0, 0, canvas.width, canvas.width*aspectAry[0]), Filters.grayscale);
  }else if (mode == "brightness"){
  	runFilter(context.getImageData(0, 0, canvas.width, canvas.width*aspectAry[0]), Filters.brightness, 40);
  }else if (mode == "sepia"){
  	runFilter(context.getImageData(0, 0, canvas.width, canvas.width*aspectAry[0]), Filters.sepia);
  }else if (mode == "sharpen"){
  	runFilter(context.getImageData(0, 0, canvas.width, canvas.width*aspectAry[0]), Filters.convolute,
      [ 0, -1,  0,
       -1,  5, -1,
        0, -1,  0]);
  }else if (mode == "sobel") {
  	runFilter(context.getImageData(0, 0, canvas.width, canvas.width*aspectAry[0]), function(px) {
          px = Filters.grayscale(px);
          var vertical = Filters.convoluteFloat32(px,
            [-1,-2,-1,
              0, 0, 0,
              1, 2, 1]);
          var horizontal = Filters.convoluteFloat32(px,
            [-1,0,1,
             -2,0,2,
             -1,0,1]);
          var id = Filters.createImageData(vertical.width, vertical.height);
          for (var i=0; i<id.data.length; i+=4) {
            var v = Math.abs(vertical.data[i]);
            id.data[i] = v;
            var h = Math.abs(horizontal.data[i]);
            id.data[i+1] = h
            id.data[i+2] = (v+h)/4;
            id.data[i+3] = 255;
          }
          return id;
        });
  }else if (mode == "mosaic") {
  	runFilter(context.getImageData(0, 0, canvas.width, canvas.width*aspectAry[0]), Filters.mosaic);
  }

  requestId = requestAnimationFrame(draw);
}




Filters = {};
Filters.getPixels = function(img) {
 
  return img;
};
Filters.getCanvas = function(w,h) {
  var c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
};
Filters.filterImage = function(filter, image, var_args) {
  var args = [this.getPixels(image)];
  for (var i=2; i<arguments.length; i++) {
    args.push(arguments[i]);
  }
  return filter.apply(null, args);
}; 
// Important:
Filters.grayscale = function(pixels, args) {
  var d = pixels.data;
  for (var i=0; i<d.length; i+=4) {
    var r = d[i];
    var g = d[i+1];
    var b = d[i+2];
    // CIE luminance for the RGB
    var v = 0.2126*r + 0.7152*g + 0.0722*b;
    d[i] = d[i+1] = d[i+2] = v
  }
  return pixels;
};



Filters.brightness = function(pixels, adjustment) {
  var d = pixels.data;
  for (var i=0; i<d.length; i+=4) {
    d[i] += adjustment;
    d[i+1] += adjustment;
    d[i+2] += adjustment;
  }
  return pixels;
};


Filters.sepia = function(pixels, args) {
	var d = pixels.data;
    for(var i = 0;i<d.length;i+=4){
        var brightness = 0.34*d[i] + 0.5*d[i+1] + 0.16*d[i+2];
        // red
        d[i] = (brightness/255)*240;
        // green
        d[i + 1] = (brightness/255)*200;
        // blue
        d[i + 2] = (brightness/255)*145;
        
    }
    return pixels;
}

Filters.tmpCanvas = document.createElement('canvas');
Filters.tmpCtx = Filters.tmpCanvas.getContext('2d');

Filters.createImageData = function(w,h) {
  return this.tmpCtx.createImageData(w,h);
};


Filters.mosaic = function(pixels, args) {
	var d = pixels.data;
	var sw = pixels.width;
  	var sh = pixels.height;

  	var w = sw;
  	var h = sh;
  	var output = Filters.createImageData(w, h);
  	var dst = output.data;
  	var size = 5;

    for (let y = 0; y < h; y += size) {
      for (let x = 0; x < w; x += size) {
        /**
         * r,g,b,a の順で格納されている値を取り出す
         */
        let cR = d[(y * w + x) * 4],
            cG = d[(y * w + x) * 4 + 1],
            cB = d[(y * w + x) * 4 + 2];
        context.fillStyle = `rgb(${cR},${cG},${cB})`;
        context.fillRect(x, y, x + size, y + size);
      }
    }
   	// context.putImageData(canvas, 0, 0);
   output = context.getImageData(0, 0, w, h);
    return output;
}



Filters.convolute = function(pixels, weights, opaque) {
  var side = Math.round(Math.sqrt(weights.length));
  var halfSide = Math.floor(side/2);

  var src = pixels.data;
  var sw = pixels.width;
  var sh = pixels.height;

  var w = sw;
  var h = sh;
  var output = Filters.createImageData(w, h);
  var dst = output.data;

  var alphaFac = opaque ? 1 : 0;

  for (var y=0; y<h; y++) {
    for (var x=0; x<w; x++) {
      var sy = y;
      var sx = x;
      var dstOff = (y*w+x)*4;
      var r=0, g=0, b=0, a=0;
      for (var cy=0; cy<side; cy++) {
        for (var cx=0; cx<side; cx++) {
          var scy = Math.min(sh-1, Math.max(0, sy + cy - halfSide));
          var scx = Math.min(sw-1, Math.max(0, sx + cx - halfSide));
          var srcOff = (scy*sw+scx)*4;
          var wt = weights[cy*side+cx];
          r += src[srcOff] * wt;
          g += src[srcOff+1] * wt;
          b += src[srcOff+2] * wt;
          a += src[srcOff+3] * wt;
        }
      }
      dst[dstOff] = r;
      dst[dstOff+1] = g;
      dst[dstOff+2] = b;
      dst[dstOff+3] = a + alphaFac*(255-a);
    }
  }
  return output;
};


if (!window.Float32Array)
  Float32Array = Array;

Filters.convoluteFloat32 = function(pixels, weights, opaque) {
  var side = Math.round(Math.sqrt(weights.length));
  var halfSide = Math.floor(side/2);

  var src = pixels.data;
  var sw = pixels.width;
  var sh = pixels.height;

  var w = sw;
  var h = sh;
  var output = {
    width: w, height: h, data: new Float32Array(w*h*4)
  };
  var dst = output.data;

  var alphaFac = opaque ? 1 : 0;

  for (var y=0; y<h; y++) {
    for (var x=0; x<w; x++) {
      var sy = y;
      var sx = x;
      var dstOff = (y*w+x)*4;
      var r=0, g=0, b=0, a=0;
      for (var cy=0; cy<side; cy++) {
        for (var cx=0; cx<side; cx++) {
          var scy = Math.min(sh-1, Math.max(0, sy + cy - halfSide));
          var scx = Math.min(sw-1, Math.max(0, sx + cx - halfSide));
          var srcOff = (scy*sw+scx)*4;
          var wt = weights[cy*side+cx];
          r += src[srcOff] * wt;
          g += src[srcOff+1] * wt;
          b += src[srcOff+2] * wt;
          a += src[srcOff+3] * wt;
        }
      }
      dst[dstOff] = r;
      dst[dstOff+1] = g;
      dst[dstOff+2] = b;
      dst[dstOff+3] = a + alphaFac*(255-a);
    }
  }
  return output;
};


function runFilter(img, filter, arg1, arg2, arg3) {
    // var s = img.previousSibling.style;
    // var b = c.parentNode.getElementsByTagName('button')[0];
   
      var idata = Filters.filterImage(filter, img, arg1, arg2, arg3);
      // c.width = idata.width;
      // c.height = idata.height;
      var ctx = context;

      ctx.putImageData(idata, 0, 0);
    
  }








$(".filterBtn1").on('click',function(){
	// grayscale();
	modeNum ++;
	if(modeNum >= modeArray.length){
		modeNum = 0;
	}
	mode  = modeArray[modeNum];
	
	
});

$("#canvas_save").on('click',function(){
	cancelAnimationFrame(requestId);
    // var dataURL = canvas.toDataURL("image/jpeg", 0.75);
    // appendDataURLImage($resultArea, dataURL);
    // var image = document.getElementById("output");
    $("#videobox").hide();
    $("#color_cell").show();
    $(".btn_save").hide();
    $(".filterBtns").hide();
    $(".btn_save2").show();
    canvasStart();
    // image.src = dataURI;
});
$("#canvas_save2").on('click',function(){

    // var dataURL = canvas.toDataURL("image/jpeg", 0.75);
    // appendDataURLImage($resultArea, dataURL);
    // var image = document.getElementById("output");
    $("#color_cell").hide();
    $(".btn_save2").hide();
    $("#canvas").hide();
    $("#output").show();
    var dataURL = canvas.toDataURL("image/jpeg", 0.75);
    var image = document.getElementById("output");
    image.src = dataURL;
});



var offset=$("#canvas").offset();
var canvas_mouse_event = false;
var canvas_touch_event = false;

var isTouch = ('ontouchstart' in window);

		var txy  = 0;
		var oldX = 0;
		var oldY = 0;
		//*************************************************
		// LineColor 
		//*************************************************
		var color      = "rgba(255,255,255,1)";
		var bold_line  = 3;
		
		var colorList = {
		"black_line"   : "rgba(0,0,0,1)",
		"glay_line"    : "rgba(192,192,192,1)",
		"blue_line"    : "rgba(0,0,255,1)",
		"red_line"     : "rgba(255,0,0,1)",
		"magenta_line" : "rgba(255,0,255,1)",
		"green_line"   : "rgba(0,255,0,1)",
		"cyan_line"    : "rgba(0,255,255,1)",
		"yellow_line"  : "rgba(255,255,0,1)",
		"brawn_line"   : "rgba(153,51,0,1)",
		"orange_line"  : "rgba(255,128,0,1)",
		"red_line"     : "rgba(255,0,0,1)",
		"white_line"   : "rgba(255,255,255,1)"
		};

//ColorMethod
		function colorSwitch(target){
			color = colorList[target];
		}

		//lineMethod
		function lineSwitch(target){
			bold_line = target.value;
		}
function canvasStart(){
			//MouseEvent[mouseDown]
			canvas.addEventListener("mousedown", function(e){
				oldX = e.offsetX;
				oldY = e.offsetY-txy;
				canvas_mouse_event=true;
			},false);
			canvas.addEventListener("touchstart", function(e){
				e.preventDefault();
				oldX = e.changedTouches[0].pageX-offset.left;
				oldY = e.changedTouches[0].pageY-offset.top;
				canvas_mouse_event=true;
			},false);
			
			//MouseEvent[mouseMove]
			//canvas.addEventListener('mousemove', onMouseMove);
    		canvas.addEventListener('touchmove', onTouchMove);
			
			canvas.addEventListener("mousemove", function (e){
				if(canvas_mouse_event==true){
					var px = e.offsetX;
					var py =e.offsetY-txy;
					context.strokeStyle = color;
					context.lineWidth = bold_line;
					context.beginPath();
					context.lineJoin= "round";
                    context.lineCap = "round";
					context.moveTo(oldX, oldY);
					context.lineTo(px, py);
					context.closePath();
					context.stroke();
					oldX = px;
					oldY = py;
				}
			});
			
			function onMouseMove(e) {
    			e.changedTouches = [{pageX: e.offsetX+offset.left, pageY: e.offsetY+offset.top}];
				onTouchMove(e);
			}
			
			function onTouchMove(e) {
				if(canvas_mouse_event==true){
					var px = e.changedTouches[0].pageX-offset.left;
					var py = e.changedTouches[0].pageY-offset.top;
					context.strokeStyle = color;
					context.lineWidth = bold_line;
					context.beginPath();
					context.lineJoin= "round";
                    context.lineCap = "round";
					context.moveTo(oldX, oldY);
					context.lineTo(px, py);
					context.closePath();
					context.stroke();
					oldX = px;
					oldY = py;
				}
			}
			
			//MouseEvent[mouseUp]
			canvas.addEventListener("mouseup", function(e){
				canvas_mouse_event=false;
			}, false);
			canvas.addEventListener("touchend", function(e){
				canvas_mouse_event=false;
			}, false);
			
			//MouseEvent[mouseout]
			canvas.addEventListener("mouseout", function(e){
				canvas_mouse_event=false;
			}, false);
			
			
			//キャンパスクリア
			function canClear(){
				if(confirm("キャンパスに描いたデータを消去しますか？")){
					context.beginPath();
					context.clearRect(0, 0, canvas.width, canvas.height);
					//context.drawImage(image, 0, 0);
				}
			}

			$("#color_cell input").change(function(){
				colorSwitch($(this).attr("id"));
			});
		}

