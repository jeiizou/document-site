function getExtents(positions) {
  const min = positions.slice(0, 3);
  const max = positions.slice(0, 3);
  for (let i = 3; i < positions.length; i += 3) {
    for (let j = 0; j < 3; ++j) {
      const v = positions[i + j];
      min[j] = Math.min(v, min[j]);
      max[j] = Math.max(v, max[j]);
    }
  }
  return { min, max };
}

function getGeometriesExtents(geometries) {
  return geometries.reduce(
    ({ min, max }, { data }) => {
      const minMax = getExtents(data.position);
      return {
        min: min.map((min, ndx) => Math.min(minMax.min[ndx], min)),
        max: max.map((max, ndx) => Math.max(minMax.max[ndx], max)),
      };
    },
    {
      min: Array(3).fill(Number.POSITIVE_INFINITY),
      max: Array(3).fill(Number.NEGATIVE_INFINITY),
    },
  );
}

function parseOBJ(text) {
  // because indices are base 1 let's just fill in the 0th data
  const objPositions = [[0, 0, 0]]; // 顶点
  const objTexcoords = [[0, 0]]; // 纹理
  const objNormals = [[0, 0, 0]]; // 法向量

  const objVertexData = [objPositions, objTexcoords, objNormals];

  // 索引
  let webglVertexData = [
    [], // positions
    [], // texcoords
    [], // normals
  ];

  const geometries = [];
  let geometry;
  let material = 'default';
  let object = 'default';
  let groups = ['default'];

  function newGeometry() {
    // 如果有存在的几何体并且不是空的，销毁
    if (geometry && geometry.data.position.length) {
      geometry = undefined;
    }
  }

  function setGeometry() {
    if (!geometry) {
      const position = [];
      const texcoord = [];
      const normal = [];
      webglVertexData = [position, texcoord, normal];
      geometry = {
        object,
        material,
        groups,
        data: {
          position,
          texcoord,
          normal,
        },
      };
      geometries.push(geometry);
    }
  }

  // 解析索引
  function addVertex(vert) {
    const ptn = vert.split('/');
    ptn.forEach((objIndexStr, i) => {
      if (!objIndexStr) {
        return;
      }
      const objIndex = parseInt(objIndexStr);
      const index = objIndex + (objIndex >= 0 ? 0 : objVertexData[i].length);
      webglVertexData[i].push(...objVertexData[i][index]);
    });
  }

  const materialLibs = [];
  const noop = () => {};

  const keywords = {
    s: noop,
    mtllib(parts, unparsedArgs) {
      materialLibs.push(unparsedArgs);
    },
    v(parts) {
      objPositions.push(parts.map(parseFloat));
    },
    vn(parts) {
      objNormals.push(parts.map(parseFloat));
    },
    vt(parts) {
      // should check for missing v and extra w?
      objTexcoords.push(parts.map(parseFloat));
    },
    o(parts, unparsedArgs) {
      object = unparsedArgs;
      newGeometry();
    },
    g(parts) {
      groups = parts;
      newGeometry();
    },
    f(parts) {
      setGeometry();

      const numTriangles = parts.length - 2;
      for (let tri = 0; tri < numTriangles; ++tri) {
        addVertex(parts[0]);
        addVertex(parts[tri + 1]);
        addVertex(parts[tri + 2]);
      }
    },
    usemtl(parts, unparsedArgs) {
      material = unparsedArgs;
      newGeometry();
    },
  };

  const keywordRE = /(\w*)(?: )*(.*)/;
  const lines = text.split('\n');

  for (let lineNo = 0; lineNo < lines.length; ++lineNo) {
    const line = lines[lineNo].trim();
    if (line === '' || line.startsWith('#')) {
      continue;
    }
    const m = keywordRE.exec(line);
    if (!m) {
      continue;
    }
    const [, keyword, unparsedArgs] = m;
    const parts = line.split(/\s+/).slice(1);
    const handler = keywords[keyword];
    if (!handler) {
      console.warn('unhandled keyword:', keyword); // eslint-disable-line no-console
      continue;
    }
    handler(parts, unparsedArgs);
  }

  // 移除空数组
  for (const geometry of geometries) {
    geometry.data = Object.fromEntries(Object.entries(geometry.data).filter(([, array]) => array.length > 0));
  }

  return {
    materialLibs,
    geometries,
  };
}

async function main() {
  // 创建上下文
  const canvas = document.querySelector('#canvas');
  const gl = canvas.getContext('webgl');
  if (!gl) {
    return;
  }

  // 创建着色器程序
  const meshProgramInfo = webglUtils.createProgramInfo(gl, ['vertex-shader-3d', 'fragment-shader-3d']);

  // 获取响应数据
  const response = await fetch('../assets/chair.obj');
  const text = await response.text();

  // 解析obj对象
  const obj = parseOBJ(text);

  // 创建缓冲对象
  const parts = obj.geometries.map(({ data }) => {
    // 数据是像这样命名的：
    //
    // {
    //   position: [...],
    //   texcoord: [...],
    //   normal: [...],
    // }
    //
    // 因为这些数组的名称和顶点着色器中的属性对应，所以我们可以将数据直接传进
    // 来自“码少趣多”文章中的 `createBufferInfoFromArrays`。

    // 通过调用 gl.createBuffer, gl.bindBuffer, gl.bufferData 为每个数组创建缓冲
    const bufferInfo = webglUtils.createBufferInfoFromArrays(gl, data);
    return {
      material: {
        u_diffuse: [Math.random(), Math.random(), Math.random(), 1],
      },
      bufferInfo,
    };
  });

  // 设置相机位置
  const extents = getGeometriesExtents(obj.geometries);
  const range = m4.subtractVectors(extents.max, extents.min);
  // 移动物体的距离，使得其中心在原点
  const objOffset = m4.scaleVector(m4.addVectors(extents.min, m4.scaleVector(range, 0.5)), -1);
  const cameraTarget = [0, 0, 0];
  // 计算移动 camera 的距离，以便我们能完全看到物体
  const radius = m4.length(range) * 1.2;
  const cameraPosition = m4.addVectors(cameraTarget, [0, 0, radius]);
  // 设置合适于物体大小的 zNear 和 zFar 值
  const zNear = radius / 100;
  const zFar = radius * 3;

  function degToRad(deg) {
    return (deg * Math.PI) / 180;
  }

  function render(time) {
    time *= 0.001; // convert to seconds

    webglUtils.resizeCanvasToDisplaySize(gl.canvas);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);

    const fieldOfViewRadians = degToRad(60);
    const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    const projection = m4.perspective(fieldOfViewRadians, aspect, zNear, zFar);

    const up = [0, 1, 0];
    // Compute the camera's matrix using look at.
    const camera = m4.lookAt(cameraPosition, cameraTarget, up);

    // Make a view matrix from the camera matrix.
    const view = m4.inverse(camera);

    const sharedUniforms = {
      u_lightDirection: m4.normalize([-1, 3, 5]),
      u_view: view,
      u_projection: projection,
    };

    gl.useProgram(meshProgramInfo.program);

    // calls gl.uniform
    webglUtils.setUniforms(meshProgramInfo, sharedUniforms);

    // 对整个空间矩阵进行一次计算
    let u_world = m4.yRotation(time);
    u_world = m4.translate(u_world, ...objOffset);

    for (const { bufferInfo, material } of parts) {
      // calls gl.bindBuffer, gl.enableVertexAttribArray, gl.vertexAttribPointer
      webglUtils.setBuffersAndAttributes(gl, meshProgramInfo, bufferInfo);

      // calls gl.uniform
      webglUtils.setUniforms(meshProgramInfo, {
        u_world,
        u_diffuse: material.u_diffuse,
      });

      // calls gl.drawArrays or gl.drawElements
      webglUtils.drawBufferInfo(gl, bufferInfo);
    }

    requestAnimationFrame(render);
  }

  requestAnimationFrame(render);
}

main();
