//通过矩阵进行位置变换

//在三角面不用指定点的大小
let VSHADER_SOURCE =
    'attribute vec4 a_Position;\n' +
    'uniform mat4 u_xformMatrix;\n' +
    'void main() {\n' +
    '  gl_Position = u_xformMatrix * a_Position;\n' +
    '}\n';

let FSHADER_SOURCE = 'void main() {\n' + '  gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);\n' + '}\n';

function main() {
    // Retrieve <canvas> element
    let canvas = document.getElementById('canvas-example');

    // Get the rendering context for WebGL
    let gl = getWebGLContext(canvas);
    if (!gl) {
        console.log('Failed to get the rendering context for WebGL');
        return;
    }

    // Initialize shaders
    if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
        console.log('Failed to intialize shaders.');
        return;
    }

    // Write the positions of vertices to a vertex shader
    let n = initVertexBuffers(gl);
    if (n < 0) {
        console.log('Failed to set the positions of the vertices');
        return;
    }

    //为旋转矩阵穿件Matrix对象
    var xformMatrix = new Matrix4();

    let ANGLE = 60.0;
    let Tx = 0.5;

    xformMatrix.setTranslate(Tx, 0, 0);
    xformMatrix.rotate(ANGLE, 0, 0, 1);

    let u_xformMatrix = gl.getUniformLocation(gl.program, 'u_xformMatrix');

    //将旋转矩阵传输给顶点着色器
    gl.uniformMatrix4fv(u_xformMatrix, false, xformMatrix.elements);

    // Specify the color for clearing <canvas>
    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    // Clear <canvas>
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Draw the rectangle
    // gl.drawArrays(gl.POINTS, 0, n);
    gl.drawArrays(gl.TRIANGLES, 0, n);
}

function initVertexBuffers(gl) {
    let vertices = new Float32Array([0, 0.5, -0.5, -0.5, 0.5, -0.5]);
    let n = 3; // The number of vertices

    // Create a buffer object
    let vertexBuffer = gl.createBuffer();
    if (!vertexBuffer) {
        console.log('Failed to create the buffer object');
        return -1;
    }

    // Bind the buffer object to target
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    // Write date into the buffer object
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    let a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    if (a_Position < 0) {
        console.log('Failed to get the storage location of a_Position');
        return -1;
    }
    // Assign the buffer object to a_Position letiable
    gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);

    // Enable the assignment to a_Position letiable
    gl.enableVertexAttribArray(a_Position);

    return n;
}

main();
