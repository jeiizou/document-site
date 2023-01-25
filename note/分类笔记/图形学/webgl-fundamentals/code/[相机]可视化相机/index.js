// 为一个相机创建几何
function createCameraBufferInfo(gl, scale = 1) {
  // 首先，让我们添加一个立方体。它的范围是 1 到 3，
  // 因为相机看向的是 -Z 方向，所以我们想要相机在 Z = 0 处开始

  // 我们会把一个圆锥放到该立方体的前面，
  // 且该圆锥的开口方向朝 -Z 方向。

  // prettier-ignore
  const positions = [
      -1, -1,  1,  // 立方体的顶点
       1, -1,  1,
      -1,  1,  1,
       1,  1,  1,
      -1, -1,  3,
       1, -1,  3,
      -1,  1,  3,
       1,  1,  3,
       0,  0,  1,  // 圆锥的尖头
    ];

  // prettier-ignore
  const indices = [
      0, 1, 1, 3, 3, 2, 2, 0,  // 立方体的索引
      4, 5, 5, 7, 7, 6, 6, 4,
      0, 4, 1, 5, 3, 7, 2, 6,
    ];

  // 添加圆锥的片段
  const numSegments = 6;
  const coneBaseIndex = positions.length / 3;
  const coneTipIndex = coneBaseIndex - 1;
  for (let i = 0; i < numSegments; ++i) {
    const u = i / numSegments;
    const angle = u * Math.PI * 2;
    const x = Math.cos(angle);
    const y = Math.sin(angle);
    positions.push(x, y, 0);
    // 从圆锥尖头到圆锥边缘的线段
    indices.push(coneTipIndex, coneBaseIndex + i);
    // 从圆锥边缘一点到圆锥边缘下一点的线段
    indices.push(coneBaseIndex + i, coneBaseIndex + ((i + 1) % numSegments));
  }

  // 控制缩放比例
  positions.forEach((v, ndx) => {
    positions[ndx] *= scale;
  });

  return webglUtils.createBufferInfoFromArrays(gl, {
    position: positions,
    indices,
  });
}

function createClipspaceCubeBufferInfo(gl) {
  // 首先，让我们添加一个立方体。它的范围是 1 到 3，
  // 因为相机看向的是 -Z 方向，所以我们想要相机在 Z = 0 处开始。
  // 我们会把一个圆锥放到该立方体的前面，
  // 且该圆锥的开口方向朝 -Z 方向。
  // prettier-ignore
  const positions = [
      -1, -1, -1,  // 立方体的顶点
       1, -1, -1,
      -1,  1, -1,
       1,  1, -1,
      -1, -1,  1,
       1, -1,  1,
      -1,  1,  1,
       1,  1,  1,
    ];
  // prettier-ignore
  const indices = [
      0, 1, 1, 3, 3, 2, 2, 0, // 立方体的索引
      4, 5, 5, 7, 7, 6, 6, 4,
      0, 4, 1, 5, 3, 7, 2, 6,
    ];
  return webglUtils.createBufferInfoFromArrays(gl, {
    position: positions,
    indices,
  });
}

function degToRad(d) {
  return (d * Math.PI) / 180;
}

function main() {
  /** @type {HTMLCanvasElement} */
  const canvas = document.querySelector('#canvas');
  const gl = canvas.getContext('webgl');
  if (!gl) {
    return;
  }

  // 构建我们需要的着色器程序
  const vertexColorProgramInfo = webglUtils.createProgramInfo(gl, ['vertex-shader-3d', 'fragment-shader-3d']);
  const solidColorProgramInfo = webglUtils.createProgramInfo(gl, [
    'solid-color-vertex-shader',
    'solid-color-fragment-shader',
  ]);

  // 创建F模型相关的数据
  const fBufferInfo = primitives.create3DFBufferInfo(gl);

  // 设置相机的缩放比例
  const cameraScale = 20;
  // 创建相机模型相关的数据
  const cameraBufferInfo = createCameraBufferInfo(gl, cameraScale);

  const clipspaceCubeBufferInfo = createClipspaceCubeBufferInfo(gl);

  // 相关视角的参数信息
  const settings = {
    rotation: 150, // in degrees
    cam1FieldOfView: 60, // in degrees
    cam1PosX: 0,
    cam1PosY: 0,
    cam1PosZ: -200,
    cam1Near: 30,
    cam1Far: 500,
    cam1Ortho: true,
    cam1OrthoUnits: 120,
  };

  // 设置UI控制条
  webglLessonsUI.setupUI(document.querySelector('#ui'), settings, [
    {
      type: 'slider',
      key: 'rotation',
      min: 0,
      max: 360,
      change: render,
      precision: 2,
      step: 0.001,
    },
    {
      type: 'slider',
      key: 'cam1FieldOfView',
      min: 1,
      max: 170,
      change: render,
    },
    {
      type: 'slider',
      key: 'cam1PosX',
      min: -200,
      max: 200,
      change: render,
    },
    {
      type: 'slider',
      key: 'cam1PosY',
      min: -200,
      max: 200,
      change: render,
    },
    {
      type: 'slider',
      key: 'cam1PosZ',
      min: -200,
      max: 200,
      change: render,
    },
    { type: 'slider', key: 'cam1Near', min: 1, max: 500, change: render },
    { type: 'slider', key: 'cam1Far', min: 1, max: 500, change: render },
    { type: 'checkbox', key: 'cam1Ortho', change: render },
    {
      type: 'slider',
      key: 'cam1OrthoUnits',
      min: 1,
      max: 150,
      change: render,
    },
  ]);

  // 绘制当前场景
  function drawScene(projectionMatrix, cameraMatrix, worldMatrix) {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // 将相机矩阵转换得到视图矩阵
    const viewMatrix = m4.inverse(cameraMatrix);

    let mat = m4.multiply(projectionMatrix, viewMatrix);
    mat = m4.multiply(mat, worldMatrix);

    // 使用我们的着色器程序
    gl.useProgram(vertexColorProgramInfo.program);

    // ------ 绘制 F 模型 --------

    // 设置所有需要的属性值
    webglUtils.setBuffersAndAttributes(gl, vertexColorProgramInfo, fBufferInfo);

    // 设置所有的变量值
    webglUtils.setUniforms(vertexColorProgramInfo, {
      u_matrix: mat,
    });

    // 绘制模型
    webglUtils.drawBufferInfo(gl, fBufferInfo);
  }

  function render() {
    webglUtils.resizeCanvasToDisplaySize(gl.canvas);

    gl.enable(gl.CULL_FACE);
    gl.enable(gl.DEPTH_TEST);
    // 开启剪刀测试
    gl.enable(gl.SCISSOR_TEST);

    // we're going to split the view in 2
    const effectiveWidth = gl.canvas.clientWidth / 2;
    const aspect = effectiveWidth / gl.canvas.clientHeight;
    const near = 1;
    const far = 2000;

    // 计算透视投影矩阵
    const perspectiveProjectionMatrix = settings.cam1Ortho
      ? m4.orthographic(
          -settings.cam1OrthoUnits * aspect, // left
          settings.cam1OrthoUnits * aspect, // right
          -settings.cam1OrthoUnits, // bottom
          settings.cam1OrthoUnits, // top
          settings.cam1Near,
          settings.cam1Far,
        )
      : m4.perspective(degToRad(settings.cam1FieldOfView), aspect, settings.cam1Near, settings.cam1Far);

    // 计算相机矩阵
    const cameraPosition = [settings.cam1PosX, settings.cam1PosY, settings.cam1PosZ];
    const target = [0, 0, 0];
    const up = [0, 1, 0];
    const cameraMatrix = m4.lookAt(cameraPosition, target, up);

    let worldMatrix = m4.yRotation(degToRad(settings.rotation));
    worldMatrix = m4.xRotate(worldMatrix, degToRad(settings.rotation));
    // 使F绕着原点进行一定的旋转
    worldMatrix = m4.translate(worldMatrix, -35, -75, -5);

    const { width, height } = gl.canvas;
    const leftWidth = (width / 2) | 0;

    // 使用正交相机绘制在坐标
    gl.viewport(0, 0, leftWidth, height);
    gl.scissor(0, 0, leftWidth, height);
    gl.clearColor(1, 0.8, 0.8, 1);

    drawScene(perspectiveProjectionMatrix, cameraMatrix, worldMatrix);

    //使用透视相机绘制在右边
    const rightWidth = width - leftWidth;
    gl.viewport(leftWidth, 0, rightWidth, height);
    gl.scissor(leftWidth, 0, rightWidth, height);
    gl.clearColor(0.8, 0.8, 1, 1);

    // 计算第二个投影矩阵以及第二个相机位置
    const perspectiveProjectionMatrix2 = m4.perspective(degToRad(60), aspect, near, far);

    // 同样的, 使用 look at 计算相机矩阵
    const cameraPosition2 = [-600, 400, -400];
    const target2 = [0, 0, 0];
    const cameraMatrix2 = m4.lookAt(cameraPosition2, target2, up);

    drawScene(perspectiveProjectionMatrix2, cameraMatrix2, worldMatrix);

    // 绘制代表第一个相机的物体
    {
      // 从第 2 个相机矩阵中创建一个视图矩阵
      const viewMatrix = m4.inverse(cameraMatrix2);

      let mat = m4.multiply(perspectiveProjectionMatrix2, viewMatrix);
      // 使用第一个相机的矩阵作为表示相机的物体的世界矩阵
      mat = m4.multiply(mat, cameraMatrix);

      gl.useProgram(solidColorProgramInfo.program);

      // ------ 绘制表示相机的物体 --------

      // 设置所有需要的 attributes
      webglUtils.setBuffersAndAttributes(gl, solidColorProgramInfo, cameraBufferInfo);

      // 设置 uniforms
      webglUtils.setUniforms(solidColorProgramInfo, {
        u_matrix: mat,
        u_color: [0, 0, 0, 1],
      });

      webglUtils.drawBufferInfo(gl, cameraBufferInfo, gl.LINES);

      // ----- 绘制视椎体 -------

      mat = m4.multiply(mat, m4.inverse(perspectiveProjectionMatrix));

      // 设置所有需要的 attributes
      webglUtils.setBuffersAndAttributes(gl, solidColorProgramInfo, clipspaceCubeBufferInfo);

      // 设置 uniforms
      webglUtils.setUniforms(solidColorProgramInfo, {
        u_matrix: mat,
        u_color: [0, 0, 0, 1],
      });

      webglUtils.drawBufferInfo(gl, clipspaceCubeBufferInfo, gl.LINES);
    }
  }
  render();
}

main();
