//拓扑排序

//定义图的顶点
function tagVertexNode(name, days, sTime, inCount, adjacentNode, adjacent) {
  this.name = name; //活动名称
  this.days = days; //完成活动所需要的时间
  this.sTime = sTime; //活动最早开始时间
  this.inCount = inCount; //活动的前驱节点个数
  this.adjacentNode = adjacentNode; //相邻活动列表(节点索引)
  this.adjacent = adjacent; //相邻活动的个数
}

//图的定义
function tagGraph(count, vertexs) {
  this.count = count; //图的顶点个数
  this.vertexs = vertexs; //图的顶点列表
}

//图的点
function QUEUE_ITEM(node, sTime) {
  this.node = node;
  this.sTime = sTime;
}

//入队
function EnQueue(q, node, sTime) {
  let item = new QUEUE_ITEM(node, sTime);
  q.push(item);
  q.sort(function(a, b) {
    return b.sTime - a.sTime;
  });
}

//出队
function DeQueue(q) {
  let node = q.pop().node;
  return node;
}

let graph = new tagGraph(9, [
  new tagVertexNode("P1", 8, 0, 0, [2, 6], 2),
  new tagVertexNode("P2", 5, 0, 0, [2, 4], 2),
  new tagVertexNode("P3", 6, 8, 2, [3], 1),
  new tagVertexNode("P4", 4, 14, 2, [5, 8], 2),
  new tagVertexNode("P5", 7, 5, 1, [3, 5], 2),
  new tagVertexNode("P6", 7, 18, 2, [], 0),
  new tagVertexNode("P7", 4, 8, 1, [7], 1),
  new tagVertexNode("P8", 3, 12, 1, [8], 1),
  new tagVertexNode("P9", 4, 18, 2, [], 0)
]);

function PrintSorting(graph, sortedNode) {
  for (let i = 0; i < sortedNode.length; i++) {
    const el = sortedNode[i];
    let index = 0;
    for (let j = 0; j < g.vertexs.length; j++) {
      if (el.node.name == g.vertexs[j].name) {
        index = j;
        break;
      }
    }
    console.log(g.vertexs[index].name);
  }
}

//拓扑排序算法主题
function TopologicalSorting(g, sortedNode) {
  let nodeQueue = [];
  for (let i = 0; i < g.count; i++) {
    if (g.vertexs[i].inCount == 0) {
      EnQueue(nodeQueue, i, g.vertexs[i].sTime);
    }
  }
  while (nodeQueue.length != 0) {
    let node = DeQueue(nodeQueue); //按照开始时间优先级出队
    sortedNode.push(node); //输出当前节点
    //遍历节点node的所有邻接点, 将表示有向边的inCount值减1
    for (let j = 0; j < g.vertexs[node].adjacent; j++) {
      const adjNode = g.vertexs[node].adjacentNode[j];
      g.vertexsp[adjNode].inCount--;
      //如果inCount值为0, 则该节点入队列
      if (g.vertexs[adjNode].inCount == 0) {
        EnQueue(nodeQueue, adjNode, g.vertexs[adjNode], sTime);
      }
    }
  }
  return sortedNode.length == g.count;
}

(function main() {
  let sortedNode = [];
  if (!TopologicalSorting(graph, sortedNode)) {
    console.log("Graph has circle!");
    return -1;
  }
  PrintSorting(graph, sortedNode);
  return 0;
})();
