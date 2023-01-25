'use strict';

//顶点着色器
let VSHADER_SOURCE = `
attribute vec4 a_Position;
void main(){
    gl_Position=a_Position;
    gl_PointSize=10.0;
}
`;

//片元着色器
let FSHADER_SOURCE = `
precision mediump float;
uniform vec4 u_FragColor;
void main(){
gl_FragColor=u_FragColor;
}`; //设置颜色

function main() {
    let canvas = document.getElementById('canvas-example');
    if (!canvas) {
        console.log('Fail to retrieve the <canvas> element');
        return;
    }

    //获取WebGL绘图的上下文
    let gl = getWebGLContext(canvas);
    if (!gl) {
        console.log('Failed to get the rendering context for WebGL');
        return;
    }

    //初始化着色器
    if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
        console.log('Failed to initialize shaders');
        return;
    }

    //获取attribute变量的存储位置
    let a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    if (a_Position < 0) {
        console.log('Failed to get the storage location of a_Position');
        return;
    }

    let u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
    if (u_FragColor < 0) {
        console.log('Failed to get the storage location of u_FragColor');
        return;
    }

    canvas.onmousedown = function(ev) {
        click(ev, gl, canvas, a_Position, u_FragColor);
    };

    var g_points = []; //鼠标点击位置数组
    var g_colors = []; //存储点颜色的数组
    function click(ev, gl, canvas, a_Position, u_FragColor) {
        //鼠标点击位置
        let x = ev.clientX;
        let y = ev.clientY;
        let rect = ev.target.getBoundingClientRect();

        x = (x - rect.left - canvas.height / 2) / (canvas.height / 2);
        y = (canvas.width / 2 - (y - rect.top)) / (canvas.width / 2);

        //将坐标存储到g_points数组中
        g_points.push([x, y]);
        console.log(`点坐标: [${x},${y}]`);
        //将点的颜色存储到g_colors数组中
        if (x >= 0.0 && y >= 0.0) {
            console.log('红色');
            g_colors.push([1.0, 0.0, 0.0, 1.0]); //红色
        } else if (x < 0.0 && y < 0.0) {
            console.log('绿色');
            g_colors.push([0.0, 1.0, 0.0, 1.0]); //绿色
        } else {
            console.log('白色');
            g_colors.push([1.0, 1.0, 1.0, 1.0]); //白色
        }

        //清除<canvas>
        gl.clear(gl.COLOR_BUFFER_BIT);

        let len = g_points.length;
        for (let i = 0; i < len; i++) {
            let xy = g_points[i];
            let rgba = g_colors[i];

            //将点的位置传递到变量a_Position中
            gl.vertexAttrib3f(a_Position, xy[0], xy[1], 0.0);
            //将点的颜色传输到u_FragColor变量中
            gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
            //绘制点
            gl.drawArrays(gl.POINTS, 0, 1);
        }
    }
}

main();
