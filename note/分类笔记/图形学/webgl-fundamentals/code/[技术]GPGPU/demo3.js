const vs = `
attribute vec4 position;
void main() {
  gl_Position = position;
}
`;

const fs = `
precision highp float;

uniform sampler2D srcTex;
uniform vec2 srcDimensions;
uniform vec2 dstDimensions;

vec4 getValueFrom2DTextureAs1DArray(sampler2D tex, vec2 dimensions, float index) {
  float y = floor(index / dimensions.x);
  float x = mod(index, dimensions.x);
  vec2 texcoord = (vec2(x, y) + 0.5) / dimensions;
  return texture2D(tex, texcoord);
}

void main() {
  // compute a 1D index into dst
  vec2 dstPixel = floor(gl_FragCoord.xy);  // see https://webglfundamentals.org/webgl/lessons/webgl-shadertoy.html#pixel-coords
  float dstIndex = dstPixel.y * dstDimensions.x + dstPixel.x;

  vec4 v1 = getValueFrom2DTextureAs1DArray(srcTex, srcDimensions, dstIndex * 2.0);
  vec4 v2 = getValueFrom2DTextureAs1DArray(srcTex, srcDimensions, dstIndex * 2.0 + 1.0);

  gl_FragColor = v1 + v2;
}
`;

// 定义输出dst的矩阵行列
const dstWidth = 3;
const dstHeight = 1;

const canvas = document.createElement('canvas');
canvas.width = dstWidth;
canvas.height = dstHeight;

const gl = canvas.getContext('webgl');

const program = webglUtils.createProgramFromSources(gl, [vs, fs]);
const positionLoc = gl.getAttribLocation(program, 'position');
const srcTexLoc = gl.getUniformLocation(program, 'srcTex');
const srcDimensionsLoc = gl.getUniformLocation(program, 'srcDimensions');
const dstDimensionsLoc = gl.getUniformLocation(program, 'dstDimensions');

const buffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
// prettier-ignore
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
  -1, -1,
  1, -1,
  -1, 1,
  -1, 1,
  1, -1,
  1, 1,
]), gl.STATIC_DRAW);

gl.enableVertexAttribArray(positionLoc);
gl.vertexAttribPointer(
  positionLoc,
  2, // size (num components)
  gl.FLOAT, // type of data in buffer
  false, // normalize
  0, // stride (0 = auto)
  0, // offset
);

// 元数据的矩阵行列值
const srcWidth = 3;
const srcHeight = 2;
const tex = gl.createTexture();
gl.bindTexture(gl.TEXTURE_2D, tex);
gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1); // see https://webglfundamentals.org/webgl/lessons/webgl-data-textures.html
gl.texImage2D(
  gl.TEXTURE_2D,
  0, // mip level
  gl.LUMINANCE, // internal format
  srcWidth,
  srcHeight,
  0, // border
  gl.LUMINANCE, // format
  gl.UNSIGNED_BYTE, // type
  new Uint8Array([1, 2, 3, 4, 5, 6]),
);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

gl.useProgram(program);
gl.uniform1i(srcTexLoc, 0); // tell the shader the src texture is on texture unit 0
gl.uniform2f(srcDimensionsLoc, srcWidth, srcHeight);
gl.uniform2f(dstDimensionsLoc, dstWidth, dstHeight);

gl.drawArrays(gl.TRIANGLES, 0, 6); // draw 2 triangles (6 vertices)

// get the result
const results = new Uint8Array(dstWidth * dstHeight * 4);
gl.readPixels(0, 0, dstWidth, dstHeight, gl.RGBA, gl.UNSIGNED_BYTE, results);

// print the results
for (let i = 0; i < dstWidth * dstHeight; ++i) {
  log(results[i * 4]);
}

function log(...args) {
  const elem = document.createElement('pre');
  elem.textContent = args.join(' ');
  document.body.appendChild(elem);
}
