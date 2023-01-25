//关键路径算法

const MAX_VERTEXTNODE = 20;

//数据结构
function EDGE_NODE(vertexIndex, name, duty) {
  this.vertexIndex = vertexIndex; //活动边终点顶点索引
  this.name = name; //活动边的名称
  this.duty = duty; //活动边的时间(权重)
}

function VERTEX_NODE(sTime, eTime, inCount, edges) {
  this.sTime = sTime; //事件最早开始时间
  this.eTime = eTime; //事件最晚开始时间
  this.inCount = inCount; //活动的前驱节点个数
  this.edges = edges; //相邻边表
}

function GRAPH(count, vertexs) {
  this.count = count;
  this.vertexs = vertexs;
}

function InitGraph(g, vertex) {
  g.count = vertex;
  g.vertexs = [];
  for (let i = 0; i < vertex; i++) {
    g.vertexs[i] = new VERTEX_NODE(0, Infinity, 0, []);
  }
}

function AddGraphEdge(g, name, u, v, weight) {
  if (u >= g.count || v >= g.count) {
    return false;
  }
  let edge = new EDGE_NODE(v, name, weight);
  g.vertexs[u].edges.push(edge);
  g.vertexs[v].inCount++;
  return true;
}

function TopologicalSorting(g, sortedNode) {
  let nodeQueue = [];
  for (let i = 0; i < g.count; i++) {
    if (g.vertexs[i].inCount == 0) {
      nodeQueue.push(i);
    }
  }

  while (nodeQueue.length != 0) {
    let u = nodeQueue.pop();
    sortedNode.push(u);
    for (let j = 0; j < g.vertexs[u].edges.length; j++) {
      let v = g.vertexs[u].edges[j].vertexIndex;
      g.vertexs[v].inCount--;
      if (g.vertexs[v].inCount == 0) {
        nodeQueue.push(v);
      }
    }
  }
  return sortedNode.length == g.count;
}

function CalcESTime(g, sortedNode) {
  g.vertexs[0].sTime = 0; //est[0]=0

  for (let i = 0; i < sortedNode.length; i++) {
    let u = sortedNode[i];
    let eit = g.vertexs[u].edges;
    //遍历u发出的所有有向边
    for (let j = 0; j < eit.length; j++) {
      let v = eit[j].vertexIndex;
      let uvst = g.vertexs[u].sTime + eit[j].duty;
      if (uvst > g.vertexs[v].sTime) {
        g.vertexs[v].sTime = uvst;
      }
    }
  }
}

function CalcLSTime(g, sortedNode) {
  //最后一个节点的最晚开始时间等于最早开始时间
  g.vertexs[g.count - 1].eTime = g.vertexs[g.count - 1].sTime;
  for (let i = sortedNode.length - 1; i >= 0; i--) {
    let u = sortedNode[i];
    let eit = g.vertexs[u].edges;
    for (let j = 0; j < eit.length; j++) {
      let v = eit[j].vertexIndex;
      let uvet = g.vertexs[v].eTime - eit[j].duty;
      if (uvet < g.vertexs[u].eTime) {
        g.vertexs[u].eTime = uvet;
      }
    }
  }
}

function PrintSorting(g, sortedNode) {
  for (let i = 0; i < sortedNode.length; i++) {
    const el = sortedNode[i];
    console.log(el);
  }
}

function CriticalPath(g) {
  let sortedNode = [];
  if (!TopologicalSorting(g, sortedNode)) {
    //步骤1
    return false;
  }
  CalcESTime(g, sortedNode); //步骤2
  CalcLSTime(g, sortedNode); //步骤3
  // console.log(sortedNode);
  // console.log(g);
  //步骤4： 输出关键路径上的活动名称
  for (let i = 0; i < sortedNode.length; i++) {
    const u = sortedNode[i];
    let eit = g.vertexs[u].edges;
    for (let j = 0; j < eit.length; j++) {
      const v = eit[j].vertexIndex;
      //是否是关键活动？
      // console.log(g.vertexs[u].sTime,g.vertexs[v].eTime - eit[j].duty);
      if (g.vertexs[u].sTime == g.vertexs[v].eTime - eit[j].duty) {
        if (eit[j].name) {
          //过滤连接事件顶点的虚拟活动边
          console.log(eit[j].name);
        }
      }
    }
  }
  return true;
}

function main() {
  let graph = new GRAPH();
  InitGraph(graph, 10);
  AddGraphEdge(graph, "P1", 0, 1, 8);
  AddGraphEdge(graph, "P2", 0, 2, 5);
  AddGraphEdge(graph, "", 1, 3, 0);
  AddGraphEdge(graph, "", 2, 3, 0);
  AddGraphEdge(graph, "P7", 1, 6, 4);
  AddGraphEdge(graph, "P5", 2, 5, 7);
  AddGraphEdge(graph, "P3", 3, 4, 6);
  AddGraphEdge(graph, "P4", 4, 8, 4);
  AddGraphEdge(graph, "P8", 6, 7, 3);
  AddGraphEdge(graph, "", 8, 7, 0);
  AddGraphEdge(graph, "", 8, 5, 0);
  AddGraphEdge(graph, "P9", 7, 9, 4);
  AddGraphEdge(graph, "P6", 5, 9, 7);

  // console.log(graph);
  CriticalPath(graph);
  return 0;
}

main();
