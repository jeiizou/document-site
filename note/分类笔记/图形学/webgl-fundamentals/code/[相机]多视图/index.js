function main() {
  /** @type {HTMLCanvasElement} */
  const canvas = document.querySelector('#canvas');
  const gl = canvas.getContext('webgl');
  if (!gl) {
    return;
  }

  // 设置着色器语言
  const programInfo = webglUtils.createProgramInfo(gl, ['vertex-shader-3d', 'fragment-shader-3d']);

  // 创建一个3D的 F 字母
  const bufferInfo = primitives.create3DFBufferInfo(gl);

  function degToRad(d) {
    return (d * Math.PI) / 180;
  }

  const settings = {
    rotation: 150, // in degrees
  };

  const fieldOfViewRadians = degToRad(120);

  // 绘制 F 字母
  function drawScene(projectionMatrix, cameraMatrix, worldMatrix) {
    // 清除画布和深度缓冲区。
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    const viewMatrix = m4.inverse(cameraMatrix);

    let mat = m4.multiply(projectionMatrix, viewMatrix);
    mat = m4.multiply(mat, worldMatrix);

    gl.useProgram(programInfo.program);

    // ------ Draw the F --------

    // 设置所有需要的属性
    webglUtils.setBuffersAndAttributes(gl, programInfo, bufferInfo);

    // 设置所有的全局变量
    webglUtils.setUniforms(programInfo, {
      u_matrix: mat,
    });

    // 绘制数据
    webglUtils.drawBufferInfo(gl, bufferInfo);
  }

  function render() {
    webglUtils.resizeCanvasToDisplaySize(gl.canvas);

    gl.enable(gl.CULL_FACE);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.SCISSOR_TEST);

    // 现在我们要将视图一分为二
    const effectiveWidth = gl.canvas.clientWidth / 2;
    const aspect = effectiveWidth / gl.canvas.clientHeight;
    const near = 1;
    const far = 2000;

    // 获取透视投影矩阵
    const perspectiveProjectionMatrix = m4.perspective(fieldOfViewRadians, aspect, near, far);

    // 计算正交投影矩阵
    const halfHeightUnits = 120;
    const orthographicProjectionMatrix = m4.orthographic(
      -halfHeightUnits * aspect, // 剩下
      halfHeightUnits * aspect, // 正确的
      -halfHeightUnits, // 底部
      halfHeightUnits, // 顶部
      -75, // 靠近
      2000, // 远的
    );

    // 获取相机矩阵
    const cameraPosition = [0, 0, -75];
    const target = [0, 0, 0];
    const up = [0, 1, 0];
    const cameraMatrix = m4.lookAt(cameraPosition, target, up);

    // 世界矩阵(叠加变换矩阵)
    let worldMatrix = m4.yRotation(degToRad(settings.rotation));
    worldMatrix = m4.xRotate(worldMatrix, degToRad(settings.rotation));
    worldMatrix = m4.translate(worldMatrix, -35, -75, -5);

    // 计算视图
    const { width, height } = gl.canvas;
    const leftWidth = (width / 2) | 0;

    // 使用正交相机在左侧绘制
    gl.viewport(0, 0, leftWidth, height);
    gl.scissor(0, 0, leftWidth, height);
    gl.clearColor(1, 0, 0, 1); // 红色的

    drawScene(orthographicProjectionMatrix, cameraMatrix, worldMatrix);

    // 使用透视相机在右侧绘制
    const rightWidth = width - leftWidth;
    gl.viewport(leftWidth, 0, rightWidth, height);
    gl.scissor(leftWidth, 0, rightWidth, height);
    gl.clearColor(0, 0, 1, 1); // 蓝色的

    drawScene(perspectiveProjectionMatrix, cameraMatrix, worldMatrix);
  }
  render();
}

main();
