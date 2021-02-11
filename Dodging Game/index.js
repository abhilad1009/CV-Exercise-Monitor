// Webcam Element
// ==========================================================================================================
const webcamElement = document.getElementById('webcam');
// ==========================================================================================================


// Display Variables and Elements
// ==========================================================================================================
var dodgeCount = document.getElementById('count');
var count = 0;
var inframe = document.getElementById('inframe');
// ==========================================================================================================


// State Control Variables
// ==========================================================================================================
var fnstate = 0;
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
const canvasWidth=600;
const canvasHeight=500;
const flipPoseHorizontal = true;
// ==========================================================================================================


// Game Canvas Variables
// ==========================================================================================================
const canvas2 = document.getElementById('output2');
const ctx2 = canvas2.getContext('2d');
canvas2.width = canvasWidth;
canvas2.height = canvasHeight;
var blockx=-50;
const ylist=[canvasHeight*0.2,canvasHeight*0.8]
var blocky=ylist[Math.floor(Math.random() * 2)];
var speed=20;
// ==========================================================================================================




// HTML Button Functions
// ==========================================================================================================
function resetgame(){
    count=0;
    dodgeCount.innerHTML=count;
    fnstate=0;
    ctbutton.innerHTML='Start';
    blockx=-50;
    ctx2.clearRect(0, 0, canvas2.width, canvas2.height);
}

function startgame(){
    if (fnstate){
        fnstate=0;
        ctbutton.innerHTML='Start';
        blockx=-50;
        ctx2.clearRect(0, 0, canvas2.width, canvas2.height);
    }
    else{

        fnstate=1;
        ctbutton.innerHTML='Stop';

        
    }
}

// ==========================================================================================================




// Game Function
// ==========================================================================================================

function gamemain(){
    async function game(){
        if (fnstate){
        result = await net.estimateSinglePose(webcamElement,{flipHorizontal: flipPoseHorizontal,});
        ctx2.clearRect(0, 0, canvas2.width, canvas2.height);
        hitState= (blocky==canvasHeight*0.8) ? legHit(blockx,blocky) : headHit(blockx,blocky);
        if (blockx>=canvasWidth || hitState){
            if (blockx>=canvasWidth){
                count+=1;
                dodgeCount.innerHTML=count;
            }
            blockx=-50;
            blocky=ylist[Math.floor(Math.random() * 2)];
        }
        ctx2.fillStyle = "yellow";
        ctx2.fillRect(blockx, blocky, 50, 20);
        blockx+=speed;
    }
        requestAnimationFrame(game);
        
    }
    game()
}

// ==========================================================================================================




// Head Hitbox Function
// ==========================================================================================================
//                                                  Hitbox is marked with * 
//      ______
//      |_____|                                                   
//     Dodge this    * *,,,,* *                     Hitbox extends from top of head to bottom of canvas 
//                   * /    \ *                     Width of hitbox is the distance between left and right ear
//                   *| =  = |*
//                   * \ == / *
//                   *  |  |  *
//                   /--    --\
//                  /*        *\
//                   *        *
//                   *        *
// 

function headHit(blockx,blocky){
    if (!(result.keypoints[0].position.y - Math.abs(result.keypoints[3].position.x - result.keypoints[4].position.x) > blocky+20) && ((blockx+50>=result.keypoints[3].position.x && blockx+50<=result.keypoints[4].position.x) || (blockx>=result.keypoints[3].position.x && blockx<=result.keypoints[4].position.x) || (blockx+50>=result.keypoints[4].position.x && blockx<=result.keypoints[3].position.x))){
            return true;
        }
    return false;
}

// ==========================================================================================================




// Leg Hitbox Function
// ==========================================================================================================
//                                                   Hitline is marked with * 
//                          
//                      |         |                  Hitline is the line segment between ankle and knee.
//                      /   /\    |                  We check if rightmost point A and leftmost point B of the 
//                     /   /  /  /                   block are on opposite sides of hitline.
//                    /* /   /* / 
//                    |*|    |*|
//      ______        |*|    |*|
//      A_____B       |*|    |*|
//                  {__*_) {__*_) 
//     Dodge this
// 

function legHit(blockx,blocky){
    if (!(Math.max(result.keypoints[15].position.y , result.keypoints[16].position.y) < blocky)){
            m1=(result.keypoints[15].position.y-result.keypoints[13].position.y)/(result.keypoints[15].position.x-result.keypoints[13].position.x)
            c1=result.keypoints[15].position.y-(m1*result.keypoints[15].position.x)
            p1=blocky-(m1*(blockx+50))-c1
            p2=blocky-(m1*(blockx))-c1
            if (p1>=0 && p2<=0){
                // console.log(p1,p2);
                return true;
            }
            m1=(result.keypoints[14].position.y-result.keypoints[16].position.y)/(result.keypoints[14].position.x-result.keypoints[16].position.x)
            c1=result.keypoints[16].position.y-(m1*result.keypoints[16].position.x)
            p1=blocky-(m1*(blockx+50))-c1
            p2=blocky-(m1*(blockx))-c1
            if (p1>=0 && p2<=0){
                // console.log(p1,p2);
                return true;
            }
        }
    return false;
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
        const canvas1 = document.getElementById('output1');
        const ctx1 = canvas1.getContext('2d');
    
        // since images are being fed from a webcam, we want to feed in the
        // original image and then just flip the keypoints' x coordinates. If instead
        // we flip the image, then correcting left-right keypoint pairs requires a
        // permutation on all the keypoints.
    
        canvas1.width = canvasWidth;
        canvas1.height = canvasHeight;

        async function drawpose(){
            result = await net.estimateSinglePose(webcamElement,{flipHorizontal: flipPoseHorizontal,});

                
            
            // console.log(result);
            
            ctx1.clearRect(0, 0, canvas1.width, canvas1.height);
            ctx1.save();
            ctx1.scale(-1, 1);
            ctx1.translate(-canvasWidth, 0);
            ctx1.drawImage(webcamElement, 0, 0, canvasWidth, canvasHeight);
            ctx1.restore();
            
            ctx1.fillStyle = "blue";
            ctx1.fillRect(0, canvasHeight*0.1, canvasWidth, 5);


            ctx1.fillRect(0, canvasHeight*0.90, canvasWidth, 5);

            if (result.keypoints[0].position.y<canvasHeight*0.1 || result.keypoints[15].position.y>canvasHeight*0.9 || result.keypoints[16].position.y>canvasHeight*0.9){
                inframe.innerHTML='Move back to get between blue lines';
                ctx1.fillStyle = "blue";
            }
            else{
                inframe.innerHTML='Body in frame';
                ctx1.fillStyle = "green";
            }
            ctx1.fillRect(0, canvasHeight*0.1, canvasWidth, 5);


            ctx1.fillRect(0, canvasHeight*0.90, canvasWidth, 5);


        requestAnimationFrame(drawpose);
        }
        drawpose();
    }
    draw();
    gamemain();

    
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



// Run main function
// ==========================================================================================================

app();