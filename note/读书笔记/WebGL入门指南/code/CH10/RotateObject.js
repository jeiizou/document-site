//使用鼠标旋转物体
//顶点着色器
let VSHADER_SOURCE = `
attribute vec4 a_Position;
attribute vec2 a_TexCoord;
uniform mat4 u_MvpMatrix;
varying vec2 v_TexCoord;
void main(){
    gl_Position = u_MvpMatrix * a_Position;
    v_TexCoord = a_TexCoord;
}`;
//片元着色器
let FSHADER_SOURCE = `
#ifdef GL_ES
precision mediump float;
#endif
uniform sampler2D u_Sampler;
varying vec2 v_TexCoord;
void main() {
    gl_FragColor = texture2D(u_Sampler, v_TexCoord);
}`;

function main() {
    //获取cavas对象
    let canvas = document.getElementById('webgl');
    //获取webgl上下文
    let gl = getWebGLContext(canvas);
    if (!gl) {
        console.log('Failed to get the rendering context for WebGL');
        return;
    }
    //初始化着色器
    if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
        console.log('Failed to intialize shaders.');
        return;
    }
    //设置顶点信息
    var n = initVertexBuffers(gl);
    if (n < 0) {
        console.log('Failed to set the vertex information');
        return;
    }
    //清除背景并且开启深度检测
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.DEPTH_TEST);

    //获取uniform变量的地址
    var u_MvpMatrix = gl.getUniformLocation(gl.program, 'u_MvpMatrix');
    if (!u_MvpMatrix) {
        console.log('Failed to get the storage location of uniform variable');
        return;
    }

    //设置视角空间
    var viewProjMatrix = new Matrix4();
    viewProjMatrix.setPerspective(30.0, canvas.width / canvas.height, 1.0, 100.0);
    viewProjMatrix.lookAt(3.0, 3.0, 7.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0);

    //注册鼠标事件
    var currentAngle = [0.0, 0.0]; // 当前旋转角度 ([x-axis, y-axis] degrees)
    initEventHandlers(canvas, currentAngle);

    //设置纹理
    if (!initTextures(gl)) {
        console.log('Failed to intialize the texture.');
        return;
    }

    var tick = function () {   // 执行绘制
        draw(gl, n, viewProjMatrix, u_MvpMatrix, currentAngle);
        requestAnimationFrame(tick, canvas);
    };
    tick();
}

function initVertexBuffers(gl) {
    // 立方体的坐标
    //    v6----- v5
    //   /|      /|
    //  v1------v0|
    //  | |     | |
    //  | |v7---|-|v4
    //  |/      |/
    //  v2------v3

    //顶点坐标
    var vertices = new Float32Array([   // Vertex coordinates
        1.0, 1.0, 1.0, -1.0, 1.0, 1.0, -1.0, -1.0, 1.0, 1.0, -1.0, 1.0,    // v0-v1-v2-v3 front
        1.0, 1.0, 1.0, 1.0, -1.0, 1.0, 1.0, -1.0, -1.0, 1.0, 1.0, -1.0,    // v0-v3-v4-v5 right
        1.0, 1.0, 1.0, 1.0, 1.0, -1.0, -1.0, 1.0, -1.0, -1.0, 1.0, 1.0,    // v0-v5-v6-v1 up
        -1.0, 1.0, 1.0, -1.0, 1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, 1.0,    // v1-v6-v7-v2 left
        -1.0, -1.0, -1.0, 1.0, -1.0, -1.0, 1.0, -1.0, 1.0, -1.0, -1.0, 1.0,    // v7-v4-v3-v2 down
        1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, 1.0, -1.0, 1.0, 1.0, -1.0     // v4-v7-v6-v5 back
    ]);

    //纹理坐标
    var texCoords = new Float32Array([   // Texture coordinates
        1.0, 1.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0,    // v0-v1-v2-v3 front
        0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 1.0, 1.0,    // v0-v3-v4-v5 right
        1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 0.0, 0.0,    // v0-v5-v6-v1 up
        1.0, 1.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0,    // v1-v6-v7-v2 left
        0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,    // v7-v4-v3-v2 down
        0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0     // v4-v7-v6-v5 back
    ]);

    //顶点索引
    var indices = new Uint8Array([
        0, 1, 2, 0, 2, 3,    // front
        4, 5, 6, 4, 6, 7,    // right
        8, 9, 10, 8, 10, 11,    // up
        12, 13, 14, 12, 14, 15,    // left
        16, 17, 18, 16, 18, 19,    // down
        20, 21, 22, 20, 22, 23     // back
    ]);

    //创建缓冲区
    var indexBuffer = gl.createBuffer();
    if (!indexBuffer) {
        return -1;
    }

    //写入坐标信息到缓冲区
    if (!initArrayBuffer(gl, vertices, 3, gl.FLOAT, 'a_Position')) return -1; // Vertex coordinates
    if (!initArrayBuffer(gl, texCoords, 2, gl.FLOAT, 'a_TexCoord')) return -1;// Texture coordinates

    //绑定缓冲对象
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    //将索引写入缓冲对象
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

    return indices.length;
}

function initEventHandlers(canvas, currentAngle) {
    let dragging = false;//拖曳判定
    let lastX = -1, lastY = -1;//上一次鼠标位置

    canvas.onmousedown = function (ev) {
        let x = ev.clientX, y = ev.clientY;
        //鼠标在cavas中时, 开始拖曳
        let rect = ev.target.getBoundingClientRect();
        if (rect.left <= x && x < rect.right && rect.top <= y && y < rect.bottom) {
            lastX = x; lastY = y;
            dragging = true;
        }
    };

    canvas.onmouseup = function (ev) {
        dragging = false;
    }

    canvas.onmousemove = function (ev) {
        var x = ev.clientX, y = ev.clientY;
        if (dragging) {
            var factor = 150 / canvas.height; // 旋转比
            var dx = factor * (x - lastX);
            var dy = factor * (y - lastY);
            // 显示x轴的旋转在正负90度只爱你
            currentAngle[0] = Math.max(Math.min(currentAngle[0] + dy, 90.0), -90.0);
            currentAngle[1] = currentAngle[1] + dx;
        }
        lastX = x, lastY = y;
    };
}

var g_MvpMatrix = new Matrix4();
function draw(gl, n, viewProjMatrix, u_MvpMatrix, currentAngle) {
    g_MvpMatrix.set(viewProjMatrix);
    g_MvpMatrix.rotate(currentAngle[0], 1.0, 0.0, 0.0);//旋转X轴
    g_MvpMatrix.rotate(currentAngle[1], 0.0, 1.0, 0.0);//旋转Y轴

    gl.uniformMatrix4fv(u_MvpMatrix, false, g_MvpMatrix.elements);

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);//清除

    gl.drawElements(gl.TRIANGLES, n, gl.UNSIGNED_BYTE, 0);//绘制
}

function initArrayBuffer(gl, data, num, type, attribute) {
    var buffer = gl.createBuffer();
    if (!buffer) {
        console.log('Failed to create the buffer object');
        return false;
    }
    // 向缓冲区写入数据
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    // 将缓冲区对象分配给属性变量
    var a_attribute = gl.getAttribLocation(gl.program, attribute);
    if (a_attribute < 0) {
        console.log('Failed to get the storage location of ' + attribute);
        return false;
    }
    gl.vertexAttribPointer(a_attribute, num, type, false, 0, 0);

    gl.enableVertexAttribArray(a_attribute);

    return true;
}

function initTextures(gl) {
    // Create a texture object
    var texture = gl.createTexture();
    if (!texture) {
        console.log('Failed to create the texture object');
        return false;
    }

    // Get the storage location of u_Sampler
    var u_Sampler = gl.getUniformLocation(gl.program, 'u_Sampler');
    if (!u_Sampler) {
        console.log('Failed to get the storage location of u_Sampler');
        return false;
    }

    // Create the image object
    var image = new Image();
    if (!image) {
        console.log('Failed to create the image object');
        return false;
    }
    // Register the event handler to be called when image loading is completed
    image.onload = function () { loadTexture(gl, texture, u_Sampler, image); };
    // Tell the browser to load an Image
    image.src = '../resources/sky.jpg';

    return true;
}

function loadTexture(gl, texture, u_Sampler, image) {
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);  // Flip the image Y coordinate
    // Activate texture unit0
    gl.activeTexture(gl.TEXTURE0);
    // Bind the texture object to the target
    gl.bindTexture(gl.TEXTURE_2D, texture);

    // Set texture parameters
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    // Set the image to texture
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);

    // Pass the texure unit 0 to u_Sampler
    gl.uniform1i(u_Sampler, 0);
}