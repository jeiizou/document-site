var TRS = function () {
  this.translation = [0, 0, 0];
  this.rotation = [0, 0, 0];
  this.scale = [1, 1, 1];
};

TRS.prototype.getMatrix = function (dst) {
  dst = dst || new Float32Array(16);
  var t = this.translation;
  var r = this.rotation;
  var s = this.scale;
  m4.translation(t[0], t[1], t[2], dst);
  m4.xRotate(dst, r[0], dst);
  m4.yRotate(dst, r[1], dst);
  m4.zRotate(dst, r[2], dst);
  m4.scale(dst, s[0], s[1], s[2], dst);
  return dst;
};

var Node = function (source) {
  this.children = [];
  this.localMatrix = m4.identity();
  this.worldMatrix = m4.identity();
  this.source = source;
};

Node.prototype.setParent = function (parent) {
  // remove us from our parent
  if (this.parent) {
    var ndx = this.parent.children.indexOf(this);
    if (ndx >= 0) {
      this.parent.children.splice(ndx, 1);
    }
  }

  // Add us to our new parent
  if (parent) {
    parent.children.push(this);
  }
  this.parent = parent;
};

Node.prototype.updateWorldMatrix = function (parentWorldMatrix) {
  var source = this.source;
  if (source) {
    source.getMatrix(this.localMatrix);
  }

  if (parentWorldMatrix) {
    // a matrix was passed in so do the math
    m4.multiply(parentWorldMatrix, this.localMatrix, this.worldMatrix);
  } else {
    // no matrix was passed in so just copy local to world
    m4.copy(this.localMatrix, this.worldMatrix);
  }

  // now process all the children
  var worldMatrix = this.worldMatrix;
  this.children.forEach(function (child) {
    child.updateWorldMatrix(worldMatrix);
  });
};

function main() {
  /** @type {HTMLCanvasElement} */
  var canvas = document.querySelector('#canvas');
  var gl = canvas.getContext('webgl');
  if (!gl) {
    return;
  }

  const cubeBufferInfo = primitives.createCubeWithVertexColorsBufferInfo(gl, 1);

  var programInfo = webglUtils.createProgramInfo(gl, ['vertex-shader-3d', 'fragment-shader-3d']);

  function degToRad(d) {
    return (d * Math.PI) / 180;
  }

  var fieldOfViewRadians = degToRad(60);

  var objectsToDraw = [];
  var objects = [];
  var nodeInfosByName = {};

  // 创建所有的节点
  var blockGuyNodeDescriptions = {
    name: 'point between feet',
    draw: false,
    children: [
      {
        // 腰
        name: 'waist',
        translation: [0, 3, 0],
        children: [
          {
            // 躯干
            name: 'torso',
            translation: [0, 2, 0],
            children: [
              {
                // 脖子
                name: 'neck',
                translation: [0, 1, 0],
                children: [
                  {
                    // 头
                    name: 'head',
                    translation: [0, 1, 0],
                  },
                ],
              },
              {
                // 左胳膊
                name: 'left-arm',
                translation: [-1, 0, 0],
                children: [
                  {
                    // 左手臂
                    name: 'left-forearm',
                    translation: [-1, 0, 0],
                    children: [
                      {
                        // 左手
                        name: 'left-hand',
                        translation: [-1, 0, 0],
                      },
                    ],
                  },
                ],
              },
              {
                // 右胳膊
                name: 'right-arm',
                translation: [1, 0, 0],
                children: [
                  {
                    // 右手臂
                    name: 'right-forearm',
                    translation: [1, 0, 0],
                    children: [
                      {
                        // 右手
                        name: 'right-hand',
                        translation: [1, 0, 0],
                      },
                    ],
                  },
                ],
              },
            ],
          },
          {
            // 左腿
            name: 'left-leg',
            translation: [-1, -1, 0],
            children: [
              {
                // 左小腿
                name: 'left-calf',
                translation: [0, -1, 0],
                children: [
                  {
                    // 左脚
                    name: 'left-foot',
                    translation: [0, -1, 0],
                  },
                ],
              },
            ],
          },
          {
            // 右腿
            name: 'right-leg',
            translation: [1, -1, 0],
            children: [
              {
                // 右小腿
                name: 'right-calf',
                translation: [0, -1, 0],
                children: [
                  {
                    // 右脚
                    name: 'right-foot',
                    translation: [0, -1, 0],
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  };

  // 设置所有的节点
  function makeNode(nodeDescription) {
    var trs = new TRS();
    var node = new Node(trs);

    nodeInfosByName[nodeDescription.name] = {
      trs: trs,
      node: node,
    };

    trs.translation = nodeDescription.translation || trs.translation;
    if (nodeDescription.draw !== false) {
      node.drawInfo = {
        uniforms: {
          u_colorOffset: [0, 0, 0.6, 0],
          u_colorMult: [0.4, 0.4, 0.4, 1],
        },
        programInfo: programInfo,
        bufferInfo: cubeBufferInfo,
      };
      objectsToDraw.push(node.drawInfo);
      objects.push(node);
    }

    makeNodes(nodeDescription.children).forEach(function (child) {
      child.setParent(node);
    });
    return node;
  }

  // 对每个节点都使用makeNode
  function makeNodes(nodeDescriptions) {
    return nodeDescriptions ? nodeDescriptions.map(makeNode) : [];
  }

  // 获取最终的场景图
  var scene = makeNode(blockGuyNodeDescriptions);

  requestAnimationFrame(drawScene);

  function drawScene(time) {
    time *= 0.001;

    webglUtils.resizeCanvasToDisplaySize(gl.canvas);

    // Tell WebGL how to convert from clip space to pixels
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    gl.enable(gl.CULL_FACE);
    gl.enable(gl.DEPTH_TEST);

    // Clear the canvas AND the depth buffer.
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    var aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    var projectionMatrix = m4.perspective(fieldOfViewRadians, aspect, 1, 2000);

    // Compute the camera's matrix using look at.
    var cameraPosition = [4, 3.5, 10];
    var target = [0, 3.5, 0];
    var up = [0, 1, 0];
    var cameraMatrix = m4.lookAt(cameraPosition, target, up);

    var viewMatrix = m4.inverse(cameraMatrix);

    // 视图投影矩阵
    var viewProjectionMatrix = m4.multiply(projectionMatrix, viewMatrix);

    // 绘制对象

    // 更新所有在场景图中的世界矩阵
    scene.updateWorldMatrix();

    var adjust;
    var speed = 3;
    var c = time * speed;

    adjust = Math.abs(Math.sin(c));
    nodeInfosByName['point between feet'].trs.translation[1] = adjust;
    adjust = Math.sin(c);
    nodeInfosByName['left-leg'].trs.rotation[0] = adjust;
    nodeInfosByName['right-leg'].trs.rotation[0] = -adjust;
    adjust = Math.sin(c + 0.1) * 0.4;
    nodeInfosByName['left-calf'].trs.rotation[0] = -adjust;
    nodeInfosByName['right-calf'].trs.rotation[0] = adjust;
    adjust = Math.sin(c + 0.1) * 0.4;
    nodeInfosByName['left-foot'].trs.rotation[0] = -adjust;
    nodeInfosByName['right-foot'].trs.rotation[0] = adjust;

    adjust = Math.sin(c) * 0.4;
    nodeInfosByName['left-arm'].trs.rotation[2] = adjust;
    nodeInfosByName['right-arm'].trs.rotation[2] = adjust;
    adjust = Math.sin(c + 0.1) * 0.4;
    nodeInfosByName['left-forearm'].trs.rotation[2] = adjust;
    nodeInfosByName['right-forearm'].trs.rotation[2] = adjust;
    adjust = Math.sin(c - 0.1) * 0.4;
    nodeInfosByName['left-hand'].trs.rotation[2] = adjust;
    nodeInfosByName['right-hand'].trs.rotation[2] = adjust;

    adjust = Math.sin(c) * 0.4;
    nodeInfosByName['waist'].trs.rotation[1] = adjust;
    adjust = Math.sin(c) * 0.4;
    nodeInfosByName['torso'].trs.rotation[1] = adjust;
    adjust = Math.sin(c + 0.25) * 0.4;
    nodeInfosByName['neck'].trs.rotation[1] = adjust;
    adjust = Math.sin(c + 0.5) * 0.4;
    nodeInfosByName['head'].trs.rotation[1] = adjust;
    adjust = Math.cos(c * 2) * 0.4;
    nodeInfosByName['head'].trs.rotation[0] = adjust;

    // Compute all the matrices for rendering
    objects.forEach(function (object) {
      object.drawInfo.uniforms.u_matrix = m4.multiply(viewProjectionMatrix, object.worldMatrix);
    });

    // ------ Draw the objects --------

    var lastUsedProgramInfo = null;
    var lastUsedBufferInfo = null;

    objectsToDraw.forEach(function (object) {
      var programInfo = object.programInfo;
      var bufferInfo = object.bufferInfo;
      var bindBuffers = false;

      if (programInfo !== lastUsedProgramInfo) {
        lastUsedProgramInfo = programInfo;
        gl.useProgram(programInfo.program);

        // We have to rebind buffers when changing programs because we
        // only bind buffers the program uses. So if 2 programs use the same
        // bufferInfo but the 1st one uses only positions the when the
        // we switch to the 2nd one some of the attributes will not be on.
        bindBuffers = true;
      }

      // Setup all the needed attributes.
      if (bindBuffers || bufferInfo !== lastUsedBufferInfo) {
        lastUsedBufferInfo = bufferInfo;
        webglUtils.setBuffersAndAttributes(gl, programInfo, bufferInfo);
      }

      // Set the uniforms.
      webglUtils.setUniforms(programInfo, object.uniforms);

      // Draw
      gl.drawArrays(gl.TRIANGLES, 0, bufferInfo.numElements);
    });

    requestAnimationFrame(drawScene);
  }
}

main();
