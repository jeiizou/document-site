function main() {
  /** @type {HTMLCanvasElement} */
  const canvas = document.querySelector('#canvas');
  const gl = canvas.getContext('webgl');
  if (!gl) {
    return;
  }

  // setup GLSL programs
  // compiles shaders, links program, looks up locations
  const programInfo = webglUtils.createProgramInfo(gl, ['vertex-shader-3d', 'fragment-shader-3d']);

  // 创建我们需要的几何体的顶点信息
  const bufferInfos = [
    primitives.createCubeBufferInfo(
      gl,
      1, // width
      1, // height
      1, // depth
    ),
    primitives.createSphereBufferInfo(
      gl,
      0.5, // radius
      8, // subdivisions around
      6, // subdivisions down
    ),
    primitives.createTruncatedConeBufferInfo(
      gl,
      0.5, // bottom radius
      0, // top radius
      1, // height
      6, // subdivisions around
      1, // subdivisions down
    ),
  ];

  function createElem(type, parent, className) {
    const elem = document.createElement(type);
    parent.appendChild(elem);
    if (className) {
      elem.className = className;
    }
    return elem;
  }

  function randArrayElement(array) {
    return array[(Math.random() * array.length) | 0];
  }

  function rand(min, max) {
    if (max === undefined) {
      max = min;
      min = 0;
    }
    return Math.random() * (max - min) + min;
  }

  // 循环创建div以及对应的顶点信息
  const contentElem = document.querySelector('#content');
  const items = [];
  const numItems = 100;
  for (let i = 0; i < numItems; ++i) {
    const outerElem = createElem('div', contentElem, 'item');
    const viewElem = createElem('div', outerElem, 'view');
    const labelElem = createElem('div', outerElem, 'label');
    labelElem.textContent = `Item ${i + 1}`;
    const bufferInfo = randArrayElement(bufferInfos);
    const color = [rand(1), rand(1), rand(1), 1];
    items.push({
      bufferInfo,
      color,
      element: viewElem,
    });
  }

  function degToRad(d) {
    return (d * Math.PI) / 180;
  }

  const fieldOfViewRadians = degToRad(60);

  function drawScene(projectionMatrix, cameraMatrix, worldMatrix, bufferInfo) {
    // Clear the canvas AND the depth buffer.
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Make a view matrix from the camera matrix.
    const viewMatrix = m4.inverse(cameraMatrix);

    let mat = m4.multiply(projectionMatrix, viewMatrix);
    mat = m4.multiply(mat, worldMatrix);

    gl.useProgram(programInfo.program);

    // ------ Draw the bufferInfo --------

    // Setup all the needed attributes.
    webglUtils.setBuffersAndAttributes(gl, programInfo, bufferInfo);

    // Set the uniform
    webglUtils.setUniforms(programInfo, {
      u_matrix: mat,
    });

    webglUtils.drawBufferInfo(gl, bufferInfo);
  }

  function render(time) {
    time *= 0.001; // 转换为秒

    webglUtils.resizeCanvasToDisplaySize(gl.canvas);

    gl.enable(gl.CULL_FACE);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.SCISSOR_TEST);

    // 将画布移动到当前滚动位置的顶部
    gl.canvas.style.transform = `translateX(${window.scrollX}px) translateY(${window.scrollY}px)`;

    for (const { bufferInfo, element, color } of items) {
      const rect = element.getBoundingClientRect();
      if (
        rect.bottom < 0 ||
        rect.top > gl.canvas.clientHeight ||
        rect.right < 0 ||
        rect.left > gl.canvas.clientWidth
      ) {
        continue; // 它在屏幕的外面
      }

      const width = rect.right - rect.left;
      const height = rect.bottom - rect.top;
      const left = rect.left;
      const bottom = gl.canvas.clientHeight - rect.bottom;

      gl.viewport(left, bottom, width, height);
      gl.scissor(left, bottom, width, height);
      gl.clearColor(...color);

      const aspect = width / height;
      const near = 1;
      const far = 2000;

      // 计算透视投影矩阵
      const perspectiveProjectionMatrix = m4.perspective(fieldOfViewRadians, aspect, near, far);

      // 计算相机位置
      const cameraPosition = [0, 0, -2];
      const target = [0, 0, 0];
      const up = [0, 1, 0];
      const cameraMatrix = m4.lookAt(cameraPosition, target, up);

      // rotate the item
      const rTime = time * 0.2;
      const worldMatrix = m4.xRotate(m4.yRotation(rTime), rTime);

      drawScene(perspectiveProjectionMatrix, cameraMatrix, worldMatrix, bufferInfo);
    }
    requestAnimationFrame(render);
  }
  requestAnimationFrame(render);
}

main();
