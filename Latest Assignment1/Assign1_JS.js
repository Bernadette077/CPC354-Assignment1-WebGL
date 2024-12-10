// Common variables
var canvas, gl, program;
var posBuffer, colBuffer, texBuffer, vPosition, vColor, vTexCoord;
let colorPickers;
var modelViewMatrixLoc, projectionMatrixLoc, texCoordLoc;
var modelViewMatrix, projectionMatrix, texture;

// Variables referencing HTML elements
// theta = [x, y, z]
var subdivSlider, widthSlider, heightSlider; 
var subdivText, widthText, heightText, startBtn, stopBtn;
var checkTex1, checkTex2, checkTex3, tex1, tex2, tex3;
var theta = [0, 0, 0], move = [0, 0, 0];
var subdivNum = 2, scaleNum = 1, scaleVector; 
var animSeq = 0, iterTemp = 0, animFrame = 0, animFlag = false, speed = 1; // Default animation speed; 

// Variables for the 3D Sierpinski gasket
var points = [], colors = [], textures = [];

// Vertices for the 3D gasket (x-axis, y-axis, z-axis, W)
var vertices = [
    vec4( 0.0000,  0.0000, -1.0000, 1.0000),
    vec4( 0.0000,  0.9428,  0.3333, 1.0000),
    vec4(-0.8165, -0.4714,  0.3333, 1.0000),
    vec4( 0.8165, -0.4714,  0.3333, 1.0000)
];

// Base Colors for the 4 sides
var baseColors = [
    vec4(1.0, 0.0, 0.0, 1.0), // Red (Side 1)
    vec4(0.0, 1.0, 0.0, 1.0), // Green (Side 2)
    vec4(0.0, 0.0, 1.0, 1.0), // Blue (Side 3)
    vec4(1.0, 1.0, 0.0, 1.0)  // Yellow (Side 4)
];

// Helper function to convert hex color to vec4
function hexToVec4(hex) {
    const r = parseInt(hex.slice(1, 3), 16) / 255.0;
    const g = parseInt(hex.slice(3, 5), 16) / 255.0;
    const b = parseInt(hex.slice(5, 7), 16) / 255.0;
    return vec4(r, g, b, 1.0);
}

// Update the base colors with the selected color
function updateBaseColors() {
    baseColors = colorPickers.map(picker => hexToVec4(picker.value));
}

// Define texture coordinates for texture mapping onto a shape or surface
var texCoord = 
[
    vec2(0, 0), // Bottom-left corner of the texture
    vec2(0, 1), // Top-left corner of the texture
    vec2(1, 1), // Top-right corner of the texture
    vec2(1, 0)  // Bottom-right corner of the texture
];

// WebGL utilities
// Execute the init() function when the web page has fully loaded
window.onload = function init()
{
    // Primitive (geometric shape) initialization
    divideTetra(vertices[0], vertices[1], vertices[2], vertices[3], subdivNum);

    // WebGL setups
    getUIElement();
    configWebGL();
    configureTexture(tex1);
    render();
}

// Retrieve all elements from HTML and store in the corresponding variables
function getUIElement() {
    canvas = document.getElementById("gl-canvas");
    subdivSlider = document.getElementById("subdiv-slider");
    subdivText = document.getElementById("subdiv-text");
    widthSlider = document.getElementById("width-slider");
    widthText = document.getElementById("width-text");
    heightSlider = document.getElementById("height-slider");
    heightText = document.getElementById("height-text");
    speedSlider = document.getElementById("speed-slider");
    speedText = document.getElementById("speed-text");
    checkTex1 = document.getElementById("check-texture-1");
    checkTex2 = document.getElementById("check-texture-2");
    checkTex3 = document.getElementById("check-texture-3");
    tex1 = document.getElementById("texture-1");
    tex2 = document.getElementById("texture-2");
    tex3 = document.getElementById("texture-3");
    startBtn = document.getElementById("start-btn");
    stopBtn = document.getElementById('stop-btn');

    colorPickers = [
        document.getElementById("color-picker-1"),
        document.getElementById("color-picker-2"),
        document.getElementById("color-picker-3"),
        document.getElementById("color-picker-4")
    ];
    colorPickers.forEach(picker => {
        picker.oninput = function() {
            updateBaseColors();
            recompute();
        };
    });

    subdivSlider.onchange = function(event) {
        subdivNum = event.target.value;
        subdivText.innerHTML = subdivNum;
        recompute();
    };
    widthSlider.onchange = function(event) {
        const newWidth = event.target.value;
        document.getElementById("width-text").innerText = newWidth;
        updateRatioHeight(newWidth);  // Update height based on new width
        resizeCanvas(newWidth, heightSlider.value);
    };
    heightSlider.onchange = function(event) {
        const newHeight = event.target.value;
        document.getElementById("height-text").innerText = newHeight;
        updateRatioWidth(newHeight);  // Update width based on new height
        resizeCanvas(widthSlider.value, newHeight);
    };
    checkTex1.onchange = function() {
        if (checkTex1.checked) {
            configureTexture(tex1);
            recompute();
        }
    };
    checkTex2.onchange = function() {
        if (checkTex2.checked) {
            configureTexture(tex2);
            recompute();
        }
    };
    checkTex3.onchange = function() {
        if (checkTex3.checked) {
            configureTexture(tex3);
            recompute();
        }
    };
    startBtn.onclick = function() {
        animFlag = true;
        disableUI();
        resetValue();
        animUpdate();
    };
    stopBtn.onclick = function() {
        animFlag = true;
        render();
        enableUI();
    };
    ratio = [
        document.getElementById("ratio-1"),
        document.getElementById("ratio-2"),
        document.getElementById("ratio-3"),
        document.getElementById("ratio-4")
    ];

    // Event listener for aspect ratio selection
    const aspectRatioRadios = document.getElementsByName("aspect-ratio");
    aspectRatioRadios.forEach(function(radio) {
        radio.onchange = function() {
            updateCanvasSize();
        };
    });

    window.addEventListener('resize', function() {
        resizeCanvas(widthSlider.value, heightSlider.value);
    });

    // Bind the slider input to control speed
    document.getElementById('speed-slider').addEventListener('input', function() {
        speed = parseFloat(this.value); // Update speed with the slider value
        document.getElementById('speed-text').textContent = this.value; // Display the current speed value
    });
    
}

// Resize the canvas while maintaining the aspect ratio
function resizeCanvas(width, height) {
    // Set the canvas dimensions based on the slider values
    canvas.width = width;
    canvas.height = height;

    // Set the viewport to match the new canvas size
    gl.viewport(0, 0, canvas.width, canvas.height);
    render();
}

// Update the canvas size based on the selected aspect ratio
function updateCanvasSize() {
    const selectedRatio = document.querySelector('input[name="aspect-ratio"]:checked').value;
    let newWidth = widthSlider.value;
    let newHeight = heightSlider.value;

    // Calculate new dimensions based on the selected aspect ratio
    switch (selectedRatio) {
        case "1/1":
            newHeight = Math.ceil(newWidth); // 1:1
            break;
        case "3/2":
            newHeight = Math.ceil(newWidth * (2 / 3)); // 3:2
            break;
        case "4/3":
            newHeight = Math.ceil(newWidth * (3 / 4)); // 4:3
            break;
        case "16/9":
            newHeight = Math.ceil(newWidth * (9 / 16)); // 16:9
            break;
    }
    // Update the height slider and resize the canvas
    heightSlider.value = newHeight;
    document.getElementById("height-text").innerText = newHeight;
    resizeCanvas(newWidth, newHeight);
}

// Update the height based on the selected aspect ratio when width changes
function updateRatioHeight(width) {
    const selectedRatio = document.querySelector('input[name="aspect-ratio"]:checked').value;
    let newHeight;
    // Calculate new height based on the selected aspect ratio
    switch (selectedRatio) {
        case "1/1":
            newHeight = Math.ceil(width); // 1:1
            break;
        case "3/2":
            newHeight = Math.ceil(width * (2 / 3)); // 3:2
            break;
        case "4/3":
            newHeight = Math.ceil(width * (3 / 4)); // 4:3
            break;
        case "16/9":
            newHeight = Math.ceil(width * (9 / 16)); // 16:9
            break;
    }
    // Update the height slider and text
    heightSlider.value = newHeight;
    document.getElementById("height-text").innerText = newHeight;
}

// Update the width based on the selected aspect ratio when height changes
function updateRatioWidth(height) {
    const selectedRatio = document.querySelector('input[name="aspect-ratio"]:checked').value;
    let newWidth;
    // Calculate new width based on the selected aspect ratio
    switch (selectedRatio) {
        case "1/1":
            newWidth = Math.ceil(height); // 1:1
            break;
        case "3/2":
            newWidth = Math.ceil(height * (3 / 2)); // 3:2
            break;
        case "4/3":
            newWidth = Math.ceil(height * (4 / 3)); // 4:3
            break;
        case "16/9":
            newWidth = Math.ceil(height * (16 / 9)); // 16:9
            break;
    }
    // Update the width slider and text
    widthSlider.value = newWidth;
    document.getElementById("width-text").innerText = newWidth;
}

// Configure WebGL Settings
function configWebGL()
{
    // Initialize the WebGL context
    gl = WebGLUtils.setupWebGL(canvas);
    
    if(!gl){
        alert("WebGL isn't available");
    }

    // Set the viewport and clear the color
    resizeCanvas(widthSlider.value, heightSlider.value);
    gl.clearColor(1.0, 1.0, 1.0, 1.0);

    // Enable hidden-surface removal
    gl.enable(gl.DEPTH_TEST);

    // Compile the vertex and fragment shaders and link to WebGL
    program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    // Create buffers and link them to the corresponding attribute variables in vertex and fragment shaders
    // Buffer for positions
    posBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);

    vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    // Buffer for colors
    colBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW);
    
    vColor = gl.getAttribLocation(program, "vColor");
    gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vColor);

    // Buffer for textures
    texBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, texBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(textures), gl.STATIC_DRAW);
    
    vTexCoord = gl.getAttribLocation(program, "vTexCoord");
    gl.vertexAttribPointer(vTexCoord, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vTexCoord);

    // Get the location of the uniform variables within a compiled shader program
    modelViewMatrixLoc = gl.getUniformLocation(program, "modelViewMatrix");
    projectionMatrixLoc = gl.getUniformLocation(program, "projectionMatrix");
    texCoordLoc = gl.getUniformLocation(program, "texture");
}

// Render the graphics for viewing
function render()
{
    // Cancel the animation frame before performing any graphic rendering
    if(animFlag)
    {
        animFlag = false;
        window.cancelAnimationFrame(animFrame);
    }
    
    // Clear the color buffer and the depth buffer before rendering a new frame
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Pass a 4x4 projection matrix from JavaScript to the GPU for use in shader
    // ortho(left, right, bottom, top, near, far)
    projectionMatrix = ortho(-4, 4, -2.25, 2.25, 2, -2);
	gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));

    // Pass a 4x4 model view matrix from JavaScript to the GPU for use in shader
    // Use translation to readjust the position of the primitive (if needed)
    modelViewMatrix = mat4();
    modelViewMatrix = mult(modelViewMatrix, translate(0, -0.2357, 0));
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));

    // Draw the primitive / geometric shape
    gl.drawArrays(gl.TRIANGLES, 0, points.length);

}

// Recompute points and colors, followed by reconfiguring WebGL for rendering
function recompute()
{
    // Reset points and colors for render update
    points = [];
	colors = [];
    textures = [];
    
    console.log("Updated baseColors:", baseColors);
    divideTetra(vertices[0], vertices[1], vertices[2], vertices[3], subdivNum);
    
    // Update position buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatten(points));
    
    // Update color buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, colBuffer);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatten(colors));
    configWebGL();
    render();

}

// Function to rotate the colors (shift each color to the next side)
function rotateColors() {
    const temp = baseColors.pop(); // Remove the last color (Side 4)
    baseColors.unshift(temp); // Move it to the front (Side 1 becomes Side 4)
   
    recompute();
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); //To clear the previous frame
}

let pauseFlag = false;
// Update the animation frame
function animUpdate()
{
    // Clear the color buffer and the depth buffer before rendering a new frame
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Set the model view matrix for vertex transformation
    // Use translation to readjust the position of the primitive (if needed)
    modelViewMatrix = mat4();
    modelViewMatrix = mult(modelViewMatrix, translate(0, -0.2357, 0));
 
     // Perform animation based on the animation sequence (animSeq)
     switch (animSeq) {
        case 0: // Rotate clockwise by 180 on z-axis
            theta[2] -= 1 * speed;
            if (theta[2] <= -180) {
                theta[2] = -180;
                animSeq++;
            }
            break;

        case 1: // Rotate counterclockwise by 180 on z-axis (back to original orientation with a pause)
            if (!pauseFlag) { // Ensure this block executes only once per pause
                theta[2] += 1 * speed; 
                if (theta[2] >= 0) {
                    theta[2] = 0;
                    pauseFlag = true; //flag to trigger pause
                    setTimeout(() => {
                        pauseFlag = false; 
                        animSeq++;
                    }, 1000);//Delay 1-second
                }
            }
            break;
        
        case 2: //Rotate counterclockwise by 180 on z-axis
            theta[2] += 1 * speed;
            if (theta[2] >= 180) {
                theta[2] = 180;
                animSeq++;
            }
            break;

        case 3: // Rotate clockwise by 180 on z-axis (Rotate back to orignal orientation)
            theta[2] -= 1 * speed;
            if (theta[2] <= 0) {
                theta[2] = 0;
                    animSeq++;
            }
            break;

        case 4: // Enlarging 3D Gasket
            scaleNum += 0.001 * speed;  // 0.001 (step size for enlarging gasket)            
            if (scaleNum >= 1.3) {
                scaleNum = 1.3; // Enlarge until scale of 1.3
                animSeq++;
            }
            break;

        case 5: //Rotate around Y-axis and X-axis
            theta[1] += 1*speed; // rotation on Y-axis 
            theta[0] += 1*speed; // rotation on X-axis
            if(theta[1]>=360) // Value of Y-axis >= 360
            {
                theta[1] = 0;
                theta[0] = 0;
                animSeq++;
            }
            break;

        case 6: // Random movement
            if (typeof direction === "undefined") {
             // Restrict initial direction to only diagonal options
                const diagonalOptions = [
                    [1, 1],    // Diagonal up-right
                    [-1, 1],   // Diagonal up-left
                    [1, -1],   // Diagonal down-right
                    [-1, -1]   // Diagonal down-left
                ];
                direction = diagonalOptions[Math.floor(Math.random() * diagonalOptions.length)]; // Pick random diagonal direction
            }
    
            // Update position based on direction and speed
            move[0] += direction[0] * 0.05 * (speed/5); // Horizontal movement
            move[1] += direction[1] * 0.05 * (speed/5); // Vertical movement
    
            // Check for boundary collisions and reverse direction if needed
            if (move[0] >= 2.2 || move[0] <= -2.2) {
                direction[0] = -direction[0]; // Reverse horizontal direction
                rotateColors();
            }
            if (move[1] >= 1.0 || move[1] <= -1.0) {
                direction[1] = -direction[1]; // Reverse vertical direction
                rotateColors();
            } 

    }
    
    // Perform vertex transformation
    scaleVector = vec4(scaleNum, scaleNum, 1, 1);
    modelViewMatrix = mult(modelViewMatrix, rotateX(theta[0])); // Apply rotation around X-axis
    modelViewMatrix = mult(modelViewMatrix, rotateY(theta[1])); // Apply rotation around Y-axis
    modelViewMatrix = mult(modelViewMatrix, rotateZ(theta[2]));
    modelViewMatrix = mult(modelViewMatrix, scalem(scaleNum, scaleNum, 1));
    modelViewMatrix = mult(modelViewMatrix, translate(move[0], move[1], move[2]));

    // Pass the matrix to the GPU for use in shader
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));

    // Draw the primitive / geometric shape
    gl.drawArrays(gl.TRIANGLES, 0, points.length);

    // Schedule the next frame for a looped animation (60fps)
    animFrame = window.requestAnimationFrame(animUpdate);
}


// Disable the UI elements when the animation is ongoing
function disableUI()
{
    subdivSlider.disabled = true;
    widthSlider.disabled = true;
    heightSlider.disabled = true;
    checkTex1.disabled = true;
    checkTex2.disabled = true;
    checkTex3.disabled = true;
    ratio.disabled= true;
    startBtn.disabled = true;

    ratio.forEach(r => r.disabled = true);
}

// Enable the UI elements after the animation is completed
function enableUI()
{
    subdivSlider.disabled = false;
    widthSlider.disabled = false;
    heightSlider.disabled = false;
    checkTex1.disabled = false;
    checkTex2.disabled = false;
    checkTex3.disabled = false;
    ratio.disable = false;
    startBtn.disabled = false;

    ratio.forEach(r => r.disabled = false);
}

// Reset all necessary variables to their default values
function resetValue()
{
    theta = [0, 0, 0];
    move = [0, 0, 0];
    scaleNum = 1;
    animSeq = 0;
    iterTemp = 0; // Infinite loop
}

// Check whether whether a given number value is a power of 2
function isPowerOf2(value) 
{
  return (value & (value - 1)) == 0;
}

// Configure the texture
function configureTexture(tex)
{
    texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, tex);
	if (isPowerOf2(tex.width) && isPowerOf2(tex.height)) 
	{
		gl.generateMipmap(gl.TEXTURE_2D);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        console.log("Width: " + tex.width + ", Height: " + tex.height + " (yes)");
    } 
	
	else 
	{
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        console.log("Width: " + tex.width + ", Height: " + tex.height + " (no)");
    }
}

/*-----------------------------------------------------------------------------------*/
// 3D Sierpinski Gasket
/*-----------------------------------------------------------------------------------*/

// Form a triangle
function triangle(a, b, c, color)
{
    colors.push(baseColors[color]);
    points.push(a);
    textures.push(texCoord[0]);
    colors.push(baseColors[color]);
    points.push(b);
    textures.push(texCoord[1]);
    colors.push(baseColors[color]);
    points.push(c);
    textures.push(texCoord[2]);
}

// Form a tetrahedron with different color for each side
function tetra(a, b, c, d)
{
    triangle(a, c, b, 0);
    triangle(a, c, d, 1);
    triangle(a, b, d, 2);
    triangle(b, c, d, 3);
}

// subdivNum a tetrahedron
function divideTetra(a, b, c, d, count)
{
    // Check for end of recursion
    if(count === 0)
    {
        tetra(a, b, c, d);
    }

    // Find midpoints of sides and divide into four smaller tetrahedra
    else
    {
        var ab = mix(a, b, 0.5);
        var ac = mix(a, c, 0.5);
        var ad = mix(a, d, 0.5);
        var bc = mix(b, c, 0.5);
        var bd = mix(b, d, 0.5);
        var cd = mix(c, d, 0.5);
        --count;

        divideTetra(a, ab, ac, ad, count);
        divideTetra(ab, b, bc, bd, count);
        divideTetra(ac, bc, c, cd, count);
        divideTetra(ad, bd, cd, d, count);
    }
}