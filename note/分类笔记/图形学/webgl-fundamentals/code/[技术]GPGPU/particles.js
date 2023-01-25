'use strict';

/* eslint no-alert: 0 */

function main() {
  const updatePositionVS = `
  attribute vec4 position;
  void main() {
    gl_Position = position;
  }
  `;

  const updatePositionFS = `
  precision highp float;

  uniform sampler2D positionTex;
  uniform sampler2D velocityTex;
  uniform vec2 texDimensions;
  uniform vec2 canvasDimensions;
  uniform float deltaTime;

  vec2 euclideanModulo(vec2 n, vec2 m) {
  	return mod(mod(n, m) + m, m);
  }

  void main() {
    // there will be one velocity per position
    // so the velocity texture and position texture
    // are the same size.

    // further, we're generating new positions
    // so we know our destination is the same size
    // as our source so we only need one set of 
    // shared texture dimensions

    // 从gl_FragCoord 计算 texcoord
    vec2 texcoord = gl_FragCoord.xy / texDimensions;
    
    vec2 position = texture2D(positionTex, texcoord).xy;
    vec2 velocity = texture2D(velocityTex, texcoord).xy;
    vec2 newPosition = euclideanModulo(position + velocity * deltaTime, canvasDimensions);

    gl_FragColor = vec4(newPosition, 0, 1);
  }
  `;

  const drawParticlesVS = `
  attribute float id;
  uniform sampler2D positionTex;
  uniform vec2 texDimensions;
  uniform mat4 matrix;

  vec4 getValueFrom2DTextureAs1DArray(sampler2D tex, vec2 dimensions, float index) {
    float y = floor(index / dimensions.x);
    float x = mod(index, dimensions.x);
    vec2 texcoord = (vec2(x, y) + 0.5) / dimensions;
    return texture2D(tex, texcoord);
  }

  void main() {
    // 从纹理中提取出位置
    vec4 position = getValueFrom2DTextureAs1DArray(positionTex, texDimensions, id);

    // 做公共矩阵计算
    gl_Position = matrix * vec4(position.xy, 0, 1);
    gl_PointSize = 10.0;
  }
  `;

  const drawParticlesFS = `
  precision highp float;
  void main() {
    gl_FragColor = vec4(1, 0, 0, 1);
  }
  `;

  // Get A WebGL context
  /** @type {HTMLCanvasElement} */
  const canvas = document.querySelector('#canvas');
  const gl = canvas.getContext('webgl');
  if (!gl) {
    return;
  }
  // 检查我们是否可以使用浮点纹理
  const ext1 = gl.getExtension('OES_texture_float');
  if (!ext1) {
    alert('Need OES_texture_float');
    return;
  }
  // 检查我们是否可以渲染到浮点纹理
  const ext2 = gl.getExtension('WEBGL_color_buffer_float');
  if (!ext2) {
    alert('Need WEBGL_color_buffer_float');
    return;
  }
  // 检查我们是否可以在顶点着色器中使用纹理
  if (gl.getParameter(gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS) < 1) {
    alert('Can not use textures in vertex shaders');
    return;
  }

  const updatePositionProgram = webglUtils.createProgramFromSources(gl, [updatePositionVS, updatePositionFS]);
  const drawParticlesProgram = webglUtils.createProgramFromSources(gl, [drawParticlesVS, drawParticlesFS]);

  const updatePositionPrgLocs = {
    position: gl.getAttribLocation(updatePositionProgram, 'position'),
    positionTex: gl.getUniformLocation(updatePositionProgram, 'positionTex'),
    velocityTex: gl.getUniformLocation(updatePositionProgram, 'velocityTex'),
    texDimensions: gl.getUniformLocation(updatePositionProgram, 'texDimensions'),
    canvasDimensions: gl.getUniformLocation(updatePositionProgram, 'canvasDimensions'),
    deltaTime: gl.getUniformLocation(updatePositionProgram, 'deltaTime'),
  };

  const drawParticlesProgLocs = {
    id: gl.getAttribLocation(drawParticlesProgram, 'id'),
    positionTex: gl.getUniformLocation(drawParticlesProgram, 'positionTex'),
    texDimensions: gl.getUniformLocation(drawParticlesProgram, 'texDimensions'),
    matrix: gl.getUniformLocation(drawParticlesProgram, 'matrix'),
  };

  // setup a full canvas clip space quad
  const updatePositionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, updatePositionBuffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
    gl.STATIC_DRAW,
  );

  // 设置一个缓冲区
  const particleTexWidth = 20;
  const particleTexHeight = 10;
  const numParticles = particleTexWidth * particleTexHeight;
  const ids = new Array(numParticles).fill(0).map((_, i) => i);
  const idBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, idBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(ids), gl.STATIC_DRAW);

  // we're going to base the initial positions on the size
  // of the canvas so lets update the size of the canvas
  // to the initial size we want
  webglUtils.resizeCanvasToDisplaySize(gl.canvas);

  //  创建随机的位置和速度
  const rand = (min, max) => {
    if (max === undefined) {
      max = min;
      min = 0;
    }
    return Math.random() * (max - min) + min;
  };
  const positions = new Float32Array(ids.map((_) => [rand(canvas.width), rand(canvas.height), 0, 0]).flat());
  const velocities = new Float32Array(ids.map((_) => [rand(-300, 300), rand(-300, 300), 0, 0]).flat());

  function createTexture(gl, data, width, height) {
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0, // mip level
      gl.RGBA, // internal format
      width,
      height,
      0, // border
      gl.RGBA, // format
      gl.FLOAT, // type
      data,
    );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return tex;
  }

  // 为速度创建一个纹理, 为位置创建2个纹理
  const velocityTex = createTexture(gl, velocities, particleTexWidth, particleTexHeight);
  const positionTex1 = createTexture(gl, positions, particleTexWidth, particleTexHeight);
  const positionTex2 = createTexture(gl, null, particleTexWidth, particleTexHeight);

  function createFramebuffer(gl, tex) {
    const fb = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    return fb;
  }

  // 创建2个帧缓冲, 一个渲染到positionTex1, 另一个渲染到positionTex2

  const positionsFB1 = createFramebuffer(gl, positionTex1);
  const positionsFB2 = createFramebuffer(gl, positionTex2);

  let oldPositionsInfo = {
    fb: positionsFB1,
    tex: positionTex1,
  };
  let newPositionsInfo = {
    fb: positionsFB2,
    tex: positionTex2,
  };

  let then = 0;
  function render(time) {
    // 转换为秒
    time *= 0.001;
    // 从当前时间减去前一个时间
    const deltaTime = time - then;
    // 记住下一帧的当前时间
    then = time;

    webglUtils.resizeCanvasToDisplaySize(gl.canvas);

    // 渲染到新的位置
    gl.bindFramebuffer(gl.FRAMEBUFFER, newPositionsInfo.fb);
    gl.viewport(0, 0, particleTexWidth, particleTexHeight);

    // 设置我们的属性来高速WebGL如何设置缓冲区的数据到位置属性
    // 这个缓冲区只包含一个-1到+1的四边形用于渲染到每个像素
    gl.bindBuffer(gl.ARRAY_BUFFER, updatePositionBuffer);
    gl.enableVertexAttribArray(updatePositionPrgLocs.position);
    gl.vertexAttribPointer(
      updatePositionPrgLocs.position,
      2, // size (num components)
      gl.FLOAT, // type of data in buffer
      false, // normalize
      0, // stride (0 = auto)
      0, // offset
    );

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, oldPositionsInfo.tex);
    gl.activeTexture(gl.TEXTURE0 + 1);
    gl.bindTexture(gl.TEXTURE_2D, velocityTex);

    gl.useProgram(updatePositionProgram);
    gl.uniform1i(updatePositionPrgLocs.positionTex, 0); // tell the shader the position texture is on texture unit 0
    gl.uniform1i(updatePositionPrgLocs.velocityTex, 1); // tell the shader the position texture is on texture unit 1
    gl.uniform2f(updatePositionPrgLocs.texDimensions, particleTexWidth, particleTexHeight);
    gl.uniform2f(updatePositionPrgLocs.canvasDimensions, gl.canvas.width, gl.canvas.height);
    gl.uniform1f(updatePositionPrgLocs.deltaTime, deltaTime);

    gl.drawArrays(gl.TRIANGLES, 0, 6); // draw 2 triangles (6 vertices)

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    // setup our attributes to tell WebGL how to pull
    // the data from the buffer above to the id attribute
    gl.bindBuffer(gl.ARRAY_BUFFER, idBuffer);
    gl.enableVertexAttribArray(drawParticlesProgLocs.id);
    gl.vertexAttribPointer(
      drawParticlesProgLocs.id,
      1, // size (num components)
      gl.FLOAT, // type of data in buffer
      false, // normalize
      0, // stride (0 = auto)
      0, // offset
    );

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, newPositionsInfo.tex);

    gl.useProgram(drawParticlesProgram);
    gl.uniform2f(drawParticlesProgLocs.texDimensions, particleTexWidth, particleTexWidth);
    gl.uniform1i(drawParticlesProgLocs.positionTex, 0); // tell the shader the position texture is on texture unit 0
    gl.uniformMatrix4fv(
      drawParticlesProgLocs.matrix,
      false,
      m4.orthographic(0, gl.canvas.width, 0, gl.canvas.height, -1, 1),
    );

    gl.drawArrays(gl.POINTS, 0, numParticles);

    // swap which texture we will read from
    // and which one we will write to
    {
      const temp = oldPositionsInfo;
      oldPositionsInfo = newPositionsInfo;
      newPositionsInfo = temp;
    }

    requestAnimationFrame(render);
  }
  requestAnimationFrame(render);
}

main();
