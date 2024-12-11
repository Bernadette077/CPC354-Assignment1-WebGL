# 🎨 3D TV Ident Program 
Welcome to the 3D TV Ident Program! This project leverages WebGL technology to create and manipulate dynamic 3D animations directly within your web browser. Specifically, the program showcases a 3D gasket that you can interact with through a variety of transformations and color customizations. 

This assignment extends the 3D gasket program from Angel’s Interactive Computer Graphics (7th Edition) to create an interactive animated logo with transformations and user-controlled parameters.

---

## 🌟 Features 
#### Animation of the TV Ident:
  - `Right Rotation`: 180 degrees, returning to the original position.
  - `Left Rotation`: 180 degrees, returning to the original position.
  - `Enlarge`: Gradually enlarge the gasket to a suitable size.
  - `Random Movement`: Gasket is move within a loop until stop button is pressed.
  - `Color Rotation`: Occurs every time gasket hits boundary of canvas
#### Properties
  - `Color Customization`: Use a color picker to choose 4 colors for each of the gasket's face.
  - `Subdivision Control`: Modify the number of gasket subdivisions from 1 - 5.
  - `Speed Control`: Has speed range from 1 - 10 (slowest - fastest)
  - `Canvas Resizing`: Adjust the canvas size based on the selected aspect ratio, 1:1, 4:3, 16:9
  - `Texture Overlay`: Apply textures to the gasket for added visual detail. We have the 
  - `Disabling Feature`: Lock gasket properties during animation.

---

## 🛠️ Repository Structure
- **`Common Folder`**:

   Contains all the code for the vertex shader and fragment shader. It is responsible for handling 3D object transformations and rendering. It includes shared functions and resources used across the project.
- **`Assign1_CSS`**:

  Holds the stylesheets for customizing the appearance of the gasket customization panel, such as sliders, ratio buttons, color pickers and font design.
- **`Assign1_HTML`**:

  Contains the HTML files that define the structure and elements inside the webpage. This includes canvas for rendering the 3D gasket animation, color picker, speed slider, canvas radio selectors, and texture selectors
- **`Assign1_JS`**:

  Includes the JavaScript code for controlling rotation, scaling and translation of 3D animation, handles dynamic changes to gasket properties such as color customization and speed controls.

---

## 🚀 How to use
   
1. **Download XAMPP from official Apache Friends Website:**

   - [Install XAMPP](https://www.apachefriends.org/download.html)

2. **Run HTML File:**
   - Download `Latest Assignment1` folder
   - Start the Apache server in the XAMPP control panel.
   - Navigate to the project directory where the Assign1_HTML folder is located.
   - Open the Assign1_HTML file (index.html) in a web browser 



## 💻 Technology Used 
- **`WebGL`**: For rendering interactive 3D graphics in the browser.
- **`JavaScript & HTML5`**: To handle user interactions and control animations.

---
