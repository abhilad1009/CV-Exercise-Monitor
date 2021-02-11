// Webcam Element
// ==========================================================================================================
const webcamElement = document.getElementById('webcam');
// ==========================================================================================================

// Display Variables
// ==========================================================================================================
var angle = document.getElementById('angle');
var squat_count = document.getElementById('count');
var count = 0;
// ==========================================================================================================

// State Control Variables
// ==========================================================================================================
var fnstate = 0;
var squat_state=0;
// ==========================================================================================================

// Button Elements
// ==========================================================================================================
const ctbutton=document.getElementById('ctbutton');
const rstbutton=document.getElementById('rstbutton');
// ==========================================================================================================


// Script environment variables
// ==========================================================================================================
let net;
const lineWidth = 2;
var colour='blue';
const minConfidencescore=0.5;
// ==========================================================================================================


// HTML Button Functions
// ==========================================================================================================
function squatreset(){
    count=0;
    squat_count.innerHTML=count;
}

function startsquat(){
    if (fnstate){
        fnstate=0;
        ctbutton.innerHTML='Start';
    }
    else{
        fnstate=1;
        ctbutton.innerHTML='Stop';
    }
}

// ==========================================================================================================


// Main Function
// ==========================================================================================================
async function app() {
    console.log('Loading model..');

    // Load the model.
    /*net = await posenet.load({
        architecture: 'ResNet50',
        outputStride: 32,
        inputResolution: 257,
        quantBytes: 2
    });*/

    net = await posenet.load();
    console.log('Successfully loaded model');

    await setupWebcam();   

    
    function draw(){
        const canvas = document.getElementById('output');
        const ctx = canvas.getContext('2d');
    
        // since images are being fed from a webcam, we want to feed in the
        // original image and then just flip the keypoints' x coordinates. If instead
        // we flip the image, then correcting left-right keypoint pairs requires a
        // permutation on all the keypoints.
        const flipPoseHorizontal = true;
    
        canvas.width = 600;
        canvas.height = 500;

        async function drawpose(){
            const result = await net.estimateSinglePose(webcamElement,{flipHorizontal: flipPoseHorizontal,});
            angle_measure=find_angle(result.keypoints[11].position,result.keypoints[13].position,result.keypoints[15].position);
            if ( result.keypoints[11].score>minConfidencescore && result.keypoints[13].score>minConfidencescore && result.keypoints[15].score>minConfidencescore){
                angle.innerHTML=angle_measure;
            }
            else{
                angle.innerHTML="..";
            }
                
            
            // console.log(result);
            
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.save();
            ctx.scale(-1, 1);
            ctx.translate(-600, 0);
            ctx.drawImage(webcamElement, 0, 0, 600, 500);
            ctx.restore();
            
            if(fnstate){
                
                    if ( result.keypoints[11].score>minConfidencescore && result.keypoints[13].score>minConfidencescore && result.keypoints[15].score>minConfidencescore){
                        if(angle_measure<90 ){
                            colour='green'

                            if (squat_state==0){
                                squat_state=1;
                                count+=1;
                                squat_count.innerHTML=count;
                            }
                    }
                    else{
                        colour='blue';
                        squat_state=0;
                    }
                }
                
            }
            
            drawKeypoints(result.keypoints, 0.4, ctx,1,colour);
                    
            drawSkeleton(result.keypoints, 0.4, ctx,1,colour);
            

        requestAnimationFrame(drawpose);
        }
        drawpose();
    }
    draw();

    
}

// ==========================================================================================================


// Angle Function
// ==========================================================================================================
function find_angle(A,B,C) {
    var AB = Math.sqrt(Math.pow(B.x-A.x,2)+ Math.pow(B.y-A.y,2));    
    var BC = Math.sqrt(Math.pow(B.x-C.x,2)+ Math.pow(B.y-C.y,2)); 
    var AC = Math.sqrt(Math.pow(C.x-A.x,2)+ Math.pow(C.y-A.y,2));
    return Math.acos((BC*BC+AB*AB-AC*AC)/(2*BC*AB))*180/Math.PI;
}

// ==========================================================================================================


// Webcam Function
// ==========================================================================================================

async function setupWebcam() {
    return new Promise((resolve, reject) => {
        const navigatorAny = navigator;
        navigator.getUserMedia = navigator.getUserMedia ||
            navigatorAny.webkitGetUserMedia || navigatorAny.mozGetUserMedia ||
            navigatorAny.msGetUserMedia;
        if (navigator.getUserMedia) {
            navigator.getUserMedia({ video: true },
                stream => {
                    webcamElement.srcObject = stream;
                    webcamElement.addEventListener('loadeddata', () => resolve(), false);
                },
                error => reject());
        } else {
            reject();
        }
    });
}

// ==========================================================================================================


// Drawing Functions
// ==========================================================================================================

function toTuple({y, x}) {
    return [y, x];
    }

    function drawPoint(ctx, y, x, r, color) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, 2 * Math.PI);
    ctx.fillStyle = color;
    ctx.fill();
    }

    /**
     * Draws a line on a canvas, i.e. a joint
     */
    function drawSegment([ay, ax], [by, bx], color, scale, ctx) {
    ctx.beginPath();
    ctx.moveTo(ax * scale, ay * scale);
    ctx.lineTo(bx * scale, by * scale);
    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = color;
    ctx.stroke();
    }

    /**
     * Draws a pose skeleton by looking up all adjacent keypoints/joints
     */
    function drawSkeleton(keypoints, minConfidence, ctx, scale = 1,color) {
    const adjacentKeyPoints =
        posenet.getAdjacentKeyPoints(keypoints, minConfidence);

    adjacentKeyPoints.forEach((keypoints) => {
        drawSegment(
            toTuple(keypoints[0].position), toTuple(keypoints[1].position), color,
            scale, ctx);
    });
    }

    /**
     * Draw pose keypoints onto a canvas
     */
    function drawKeypoints(keypoints, minConfidence, ctx, scale = 1,color) {
    for (let i = 0; i < keypoints.length; i++) {
        const keypoint = keypoints[i];

        if (keypoint.score < minConfidence) {
        continue;
        }

        const {y, x} = keypoint.position;
        drawPoint(ctx, y * scale, x * scale, 3, color);
    }
    }

// ==========================================================================================================


// Run main function
// ==========================================================================================================

app();