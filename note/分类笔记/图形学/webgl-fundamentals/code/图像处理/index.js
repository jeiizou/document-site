'use strict';
let gl;

// 各种效果的卷积内核矩阵
let kernels = {
  normal: [0, 0, 0, 0, 1, 0, 0, 0, 0],
  gaussianBlur: [0.045, 0.122, 0.045, 0.122, 0.332, 0.122, 0.045, 0.122, 0.045],
  gaussianBlur2: [1, 2, 1, 2, 4, 2, 1, 2, 1],
  gaussianBlur3: [0, 1, 0, 1, 1, 1, 0, 1, 0],
  unsharpen: [-1, -1, -1, -1, 9, -1, -1, -1, -1],
  sharpness: [0, -1, 0, -1, 5, -1, 0, -1, 0],
  sharpen: [-1, -1, -1, -1, 16, -1, -1, -1, -1],
  edgeDetect: [-0.125, -0.125, -0.125, -0.125, 1, -0.125, -0.125, -0.125, -0.125],
  edgeDetect2: [-1, -1, -1, -1, 8, -1, -1, -1, -1],
  edgeDetect3: [-5, 0, 0, 0, 0, 0, 0, 0, 5],
  edgeDetect4: [-1, -1, -1, 0, 0, 0, 1, 1, 1],
  edgeDetect5: [-1, -1, -1, 2, 2, 2, -1, -1, -1],
  edgeDetect6: [-5, -5, -5, -5, 39, -5, -5, -5, -5],
  sobelHorizontal: [1, 2, 1, 0, 0, 0, -1, -2, -1],
  sobelVertical: [1, 0, -1, 2, 0, -2, 1, 0, -1],
  previtHorizontal: [1, 1, 1, 0, 0, 0, -1, -1, -1],
  previtVertical: [1, 0, -1, 1, 0, -1, 1, 0, -1],
  boxBlur: [0.111, 0.111, 0.111, 0.111, 0.111, 0.111, 0.111, 0.111, 0.111],
  triangleBlur: [0.0625, 0.125, 0.0625, 0.125, 0.25, 0.125, 0.0625, 0.125, 0.0625],
  emboss: [-2, -1, 0, -1, 1, 1, 0, 1, 2],
};

// 是否开启对应的效果
let effects = [
  // 高斯模糊
  { name: 'gaussianBlur3', on: true },
  { name: 'gaussianBlur3', on: true },
  { name: 'gaussianBlur3', on: true },
  { name: 'sharpness', on: true },
  { name: 'sharpness' },
  { name: 'sharpness' },
  { name: 'sharpen' },
  { name: 'sharpen' },
  { name: 'sharpen' },
  { name: 'unsharpen' },
  { name: 'unsharpen' },
  { name: 'unsharpen' },
  { name: 'emboss', on: true },
  { name: 'edgeDetect' },
  { name: 'edgeDetect' },
  { name: 'edgeDetect3' },
  { name: 'edgeDetect3' },
];

// 主函数
function main() {
  let image = new Image();
  image.src = '../assets/leaves.jpeg';
  image.onload = function () {
    render(image);
  };
}

// 初始化上下文和着色器
function init() {
  let canvas = document.querySelector('#canvas');
  gl = canvas.getContext('webgl');
  if (!gl) {
    throw Error('not support webgl');
  }

  let program = webglUtils.createProgramFromScripts(gl, ['vertex-shader-2d', 'fragment-shader-2d']);

  gl.program = program;

  // 使用当前的着色器程序
  gl.useProgram(gl.program);

  // 设置视窗口位置
  webglUtils.resizeCanvasToDisplaySize(gl.canvas);
  // 设置视口
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
}

// 清理画布
function clear() {
  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT);
}

// 设置一个属性
function setAttributes(name, data, { size, type = gl.FLOAT, normalize = false, stride = 0, offset = 0 }) {
  // 获取位置
  let location = gl.getAttribLocation(gl.program, name);
  // 创建buffer
  let buffer = gl.createBuffer();
  // 绑定buffer
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  // 给 buffer 写入数据
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
  // 激活属性
  gl.enableVertexAttribArray(location);
  // 设定读取数据的格式
  gl.vertexAttribPointer(location, size, type, normalize, stride, offset);
}

// 设置一个全局变量
function setUniforms(name, { values, method = 'uniform2f' }) {
  let location = gl.getUniformLocation(gl.program, name);
  gl[method](location, ...values);
}

// 获取矩阵顶点位置矩阵
function setRectangle(x, y, width, height) {
  let x1 = x;
  let x2 = x + width;
  let y1 = y;
  let y2 = y + height;
  return new Float32Array([x1, y1, x2, y1, x1, y2, x1, y2, x2, y1, x2, y2]);
}

function render(image) {
  // 初始化全局变量
  init();

  // 设置绘制矩形的顶点坐标
  let positionsData = setRectangle(0, 0, image.width, image.height);
  setAttributes('a_position', positionsData, {
    size: 2,
  });

  // 设置纹理坐标
  setAttributes(
    'a_texCoord',
    new Float32Array([0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 1.0]),
    {
      size: 2,
    },
  );

  setUniforms('u_textureSize', {
    values: [image.width, image.height],
    method: 'uniform2f',
  });

  // 创建一个纹理对象
  let originalImageTexture = createAndSetupTexture(gl);
  // 写入纹理数据
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

  // 创建两个纹理绑定到帧缓冲
  let textures = [];
  let framebuffers = [];
  for (let ii = 0; ii < 2; ++ii) {
    // 创建一个纹理对象
    let texture = createAndSetupTexture(gl);
    textures.push(texture);

    // 设置纹理大小和图像一致, 写入一个空的纹理数据
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, image.width, image.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

    // 创建一个帧缓冲
    let fbo = gl.createFramebuffer();
    framebuffers.push(fbo);
    // 绑定这个帧缓冲
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);

    // 绑定纹理到帧缓冲
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
  }

  // 从原始的图像开始
  gl.bindTexture(gl.TEXTURE_2D, originalImageTexture);

  // 在渲染纹理的时候不反转Y轴
  setUniforms('u_flipY', {
    values: [1],
    method: 'uniform1f',
  });

  // 依次的施加每一种渲染效果
  let count = 0;
  for (let ii = 0; ii < effects.length; ++ii) {
    if (effects[ii].on) {
      // 使用两个帧缓冲中的一个
      setFramebuffer(framebuffers[count % 2], image.width, image.height);
      drawWithKernel(effects[ii].name);
      // 下次绘制的时候使用刚才的渲染结果
      gl.bindTexture(gl.TEXTURE_2D, textures[count % 2]);

      ++count;
    }
  }

  // 在渲染效果的时候反转Y轴
  setUniforms('u_flipY', {
    values: [-1],
    method: 'uniform1f',
  });

  setFramebuffer(null, gl.canvas.width, gl.canvas.height);
  drawWithKernel('normal');
}

function setFramebuffer(fbo, width, height) {
  // 设定当前使用帧缓冲
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);

  // 告诉着色器分辨率是多少
  setUniforms('u_resolution', {
    values: [width, height],
    method: 'uniform2f',
  });

  // 告诉WebGL帧缓冲需要的视图大小
  gl.viewport(0, 0, width, height);
}

// 计算卷积黔中
function computeKernelWeight(kernel) {
  let weight = kernel.reduce(function (prev, curr) {
    return prev + curr;
  });
  return weight <= 0 ? 1 : weight;
}

function drawWithKernel(name) {
  // 设置卷积核
  setUniforms('u_kernel[0]', {
    values: [kernels[name]],
    method: 'uniform1fv',
  });
  setUniforms('u_kernelWeight', {
    values: [computeKernelWeight(kernels[name])],
    method: 'uniform1f',
  });

  // 画出矩形
  let primitiveType = gl.TRIANGLES;
  let offset = 0;
  let count = 6;
  gl.drawArrays(primitiveType, offset, count);
}

// 创建并且设置纹理
function createAndSetupTexture(gl) {
  // 创建纹理
  let texture = gl.createTexture();
  // 绑定纹理到纹理单元
  gl.bindTexture(gl.TEXTURE_2D, texture);

  // 设置材质，这样我们可以对任意大小的图像进行像素操作
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

  // 返回这个纹理
  return texture;
}

main();
