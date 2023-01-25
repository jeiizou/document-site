function main() {
  let image = new Image();
  image.src = '../assets/leaves.jpeg';
  image.onload = function () {
    render(image);
  };
}

function setAttribute(name, data, opts) {
  let attributeLocation = gl.getAttribLocation(program, name);
  let attributeBuffer = gl.createBuffer();
  gl.enableVertexAttribArray(positionLocation);
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.vertexAttribPointer(...opts);
}

function render(image) {
  // 创建上下文
  let canvas = document.querySelector('#canvas');
  // @types: WebGLRendingContext
  let gl = canvas.getContext('webgl');
  if (!gl) {
    return;
  }

  // 创建着色器程序
  let program = webglUtils.createProgramFromScripts(gl, ['vertex-shader-2d', 'fragment-shader-2d']);

  // 获取变量的地址
  let positionLocation = gl.getAttribLocation(program, 'a_position');
  // 找到纹理的地址
  let texcoordLocation = gl.getAttribLocation(program, 'a_texCoord');

  // 创建缓冲区
  let positionBuffer = gl.createBuffer();
  // 绑定缓冲区到当前程序
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  // 设置一个图片大小的矩形数据
  setRectangle(gl, 0, 0, image.width, image.height);

  // 给矩阵提供纹理走镖
  let texcoordBuffer = gl.createBuffer();
  // 绑定纹理缓存区
  gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);
  // 设置纹理缓冲区的数据
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 1.0]),
    gl.STATIC_DRAW,
  );

  // 创建纹理
  let texture = gl.createTexture();
  // 绑定纹理
  gl.bindTexture(gl.TEXTURE_2D, texture);
  // 设置参数, 让我们可以绘制任何尺寸的图像
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  // 把图片更新到纹理数据上
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

  // 获取全局变量的地址
  let resolutionLocation = gl.getUniformLocation(program, 'u_resolution');
  let textureSizeLocation = gl.getUniformLocation(program, 'u_textureSize');
  //获取卷积内核的地址
  let kernelLocation = gl.getUniformLocation(program, 'u_kernel[0]');
  let kernelWeightLocation = gl.getUniformLocation(program, 'u_kernelWeight');

  // 调整视口的大小
  webglUtils.resizeCanvasToDisplaySize(gl.canvas);
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
  // 清理画布
  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT);

  // 使用着色程序
  gl.useProgram(program);

  // 激活变量地址
  gl.enableVertexAttribArray(positionLocation);
  // 绑定缓冲区
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

  // 告诉程序如何读取这个缓冲区的数据
  let size = 2; // 2 components per iteration
  let type = gl.FLOAT; // the data is 32bit floats
  let normalize = false; // don't normalize the data
  let stride = 0; // 0 = move forward size * sizeof(type) each iteration to get the next position
  let offset = 0; // start at the beginning of the buffer
  gl.vertexAttribPointer(positionLocation, size, type, normalize, stride, offset);

  // 激活纹理变量的地址
  gl.enableVertexAttribArray(texcoordLocation);
  // 绑定对应的缓存区
  gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);
  // 写入数据
  size = 2; // 2 components per iteration
  type = gl.FLOAT; // the data is 32bit floats
  normalize = false; // don't normalize the data
  stride = 0; // 0 = move forward size * sizeof(type) each iteration to get the next position
  offset = 0; // start at the beginning of the buffer
  gl.vertexAttribPointer(texcoordLocation, size, type, normalize, stride, offset);

  // 设置全局变量的地址
  gl.uniform2f(resolutionLocation, gl.canvas.width, gl.canvas.height);
  // set the size of the image
  gl.uniform2f(textureSizeLocation, image.width, image.height);

  // 边缘化卷积内核
  let edgeDetectKernel = [-1, -1, -1, -1, 8, -1, -1, -1, -1];
  gl.uniform1fv(kernelLocation, edgeDetectKernel);
  gl.uniform1f(kernelWeightLocation, computeKernelWeight(edgeDetectKernel));

  // 运行着色器程序
  gl.drawArrays(gl.TRIANGLES, 0, 6);
}

// 设置一个矩形坐标
function setRectangle(gl, x, y, width, height) {
  let x1 = x;
  let x2 = x + width;
  let y1 = y;
  let y2 = y + height;
  // 设置缓冲数据
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([x1, y1, x2, y1, x1, y2, x1, y2, x2, y1, x2, y2]),
    gl.STATIC_DRAW,
  );
}

// 提供权重计算方法
function computeKernelWeight(kernel) {
  var weight = kernel.reduce(function (prev, curr) {
    return prev + curr;
  });
  return weight <= 0 ? 1 : weight;
}

main();
