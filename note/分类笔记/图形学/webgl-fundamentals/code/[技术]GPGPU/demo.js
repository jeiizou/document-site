let gl_FragColor, gl_FragCoord;

function multBy2(src, across) {
  return function () {
    gl_FragColor = src[gl_FragCoord.y * across + gl_FragCoord.x] * 2;
  };
}

function mapDst(dst, across, up, fn) {
  for (let y = 0; y < up; ++y) {
    for (let x = 0; x < across; ++x) {
      gl_FragCoord = { x, y };
      fn();
      dst[y * across + x] = gl_FragColor;
    }
  }
}

const src = [1, 2, 3, 4, 5, 6];

const dst = new Array(6); // 为了模拟在 WebGL 中，我们必须分配一个纹理
mapDst(dst, 3, 2, multBy2(src, 3));

// dst 现在是 [2, 4, 6, 8, 10, 12];
console.log(dst);
