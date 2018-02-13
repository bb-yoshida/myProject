const medias = {audio : false, video : {
        facingMode : { exact : "environment" }
        // facingMode: "user"
      }},
      video  = document.getElementById("video"),
      canvas = document.getElementById("canvas"),
      context    = canvas.getContext("2d");


var fileAry = ['img/test.png'];

var numFiles = fileAry.length;
var loadedCounter = 0;
var imgAry = [];
var aspectAry = [];

var mode = "normal";



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
  // alert(err);
};

function draw() {
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
  // context.drawImage(video, 0, 0);
  context.drawImage(imgAry[0], 0, 0, canvas.width, canvas.width*aspectAry[0]);
  if(mode != "normal"){
  	runFilter(context.getImageData(0, 0, canvas.width, canvas.width*aspectAry[0]), Filters.grayscale);
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


function runFilter(img, filter, arg1, arg2, arg3) {
        // var s = img.previousSibling.style;
        // var b = c.parentNode.getElementsByTagName('button')[0];
       
          var idata = Filters.filterImage(filter, img, arg1, arg2, arg3);
          // c.width = idata.width;
          // c.height = idata.height;
          var ctx = context;

          ctx.putImageData(idata, 0, 0);
        
      }


      grayscale = function() {
        runFilter('grayscale', Filters.grayscale);
      }



$(".filterBtn1").on('click',function(){
	// grayscale();
	if(mode != "normal"){
		mode = "normal";
	}else {
		mode = "grayscale";
	}
	
});

$("#canvas_save").on('click',function(){
	cancelAnimationFrame(requestId);
    // var dataURL = canvas.toDataURL("image/jpeg", 0.75);
    // appendDataURLImage($resultArea, dataURL);
    // var image = document.getElementById("output");
    $("#videobox").hide();
    $("#color_cell").show();
    $(".btn_save").hide();
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

