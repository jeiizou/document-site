# 基础-Virtualdomdiff


## 第一步: 使用 JS 对象模拟 DOM 对象

```js
export default class Element {
    /**
     *
     * @param {String} tag 'div'
     * @param {Object} props {class:'item'}
     * @param {Array} children [Element1,'text']
     * @param {String} key option
     */
    constructor(tag, props, children, key) {
        this.tag = tag;
        this.props = props;
        if (Array.isArray(children)) {
            this.children = children;
        } else if (isString(children)) {
            this.key = children;
            this.children = null;
        }
        if (key) this.key = key;
    }

    //渲染
    render() {
        let root = this._createElement(this.tag, this.props, this.children, this.key);
        document.body.appendChild(root);
        return root;
    }
    create() {
        return this._createElement(this.tag, this.props, this.children, this.key);
    }
    //创建节点
    _createElement(tag, props, child, key) {
        //通过tag创建节点
        let el = document.createElement(tag);
        //设置节点属性
        for (const key in props) {
            if (props.hasOwnProperty(key)) {
                const value = props[key];
                el.setAttribute(key, value);
            }
        }
        if (key) {
            el.setAttribute('key', key);
        }
        //递归创建子节点
        if (child) {
            child.forEach(element => {
                let child;
                if (element instanceof Element) {
                    child = this._createElement(element.tag, element.props, element.children, element.key);
                } else {
                    chidl = document.createTextNode(element);
                }
                el.appendChild(child);
            });
        }
        return el;
    }
}
```

一个 DOM 节点主要由标签名称, 属性, 子节点, 以及 key 值四个主要的属性.

## 第二步: 实现 diff 算法

### 2.1 两个节点的比较

首先考虑两个节点对比的几种情况:

1. 新的节点`tagName` 或者`key`和旧的不同, 这种情况代表需要替换旧的节点, 并且也不在需要遍历新旧节点的子元素了, 因为整个旧的节点都被删除
2. 新的节点的`tagName`和`key`(或者都没有)和旧的相同, 开始遍历子树
3. 没有新的节点, 什么都不用做.

```js
export default function diff(oldDomTree, newDomTree) {
    //用于记录差异
    let pathchs = {};
    //一开始索引为0
    dfs(oldDomTree, newDomTree, 0, pathchs);
    return pathchs;
}

function dfs(oldNode, newNode, index, pathchs) {
    //用于保存子树的更改
    let curPatches = [];
    /**
     * 需要判断三种情况
     * 1. 没有新的节点, 那么什么都不用做
     * 2. 新的节点的 tagName 和 key 和旧的不同, 就替换
     * 3. 新的节点的 tagName 和 key(可能都没有) 和旧的相同, 开始遍历子树
     */
    if (!newNode) {
    } else if (newNode.tag === oldNode.tag && newNode.key === oldNode.key) {
        //判断属性是否变更
        let props = diffProps(oldNode.props, newNode.props);
        if (props.length) curPatches.push({ type: StateEnums.ChangeProps, props });
        //遍历子树
        diffChildren(oldNode.children, newNode.children, index, pathchs);
    } else {
        //节点不同,需要替换
        curPatches.push({ type: StateEnums.Replace, node: newNode });
    }

    if (curPatches.length) {
        if (pathchs[index]) {
            patches[index] = patches[index].concat(curPatches);
        } else {
            pathchs[index] = curPatches;
        }
    }
}
```

### 2.2 判断属性的更改

判断属性的更改:

1. 遍历旧的属性列表，查看每个属性是否还存在于新的属性列表中
2. 遍历新的属性列表，判断两个列表中都存在的属性的值是否有变化
3. 在第二步中同时查看是否有属性不存在与旧的属性列列表中

```js
function diffProps(oldProps, newProps) {
    // 判断 Props 分以下三步骤
    // 先遍历 oldProps 查看是否存在删除的属性
    // 然后遍历 newProps 查看是否有属性值被修改
    // 最后查看是否有属性新增
    let change = [];
    for (const key in oldProps) {
        if (oldProps.hasOwnProperty(key) && !newProps[key]) {
            change.push({
                prop: key
            });
        }
    }
    for (const key in newProps) {
        if (newProps.hasOwnProperty(key)) {
            const prop = newProps[key];
            if (oldProps[key] && oldProps[key] !== newProps[key]) {
                change.push({
                    prop: key,
                    value: newProps[key]
                });
            } else if (!oldProps[key]) {
                change.push({
                    prop: key,
                    value: newProps[key]
                });
            }
        }
    }
    return change;
}
```

### 2.3 判断列表差异

判断列表差异算法实现(该算法只对有`key`的节点做处理):

1. 遍历旧的节点列表，查看每个节点是否还存在于新的节点列表中
2. 遍历新的节点列表，判断是否有新的节点
3. 在第二步中同时判断节点是否有移动

```js
function listDiff(oldList, newList, index, patches) {
    // 为了遍历方便，先取出两个 list 的所有 keys
    let oldKeys = getKeys(oldList);
    let newKeys = getKeys(newList);
    let changes = [];

    // 用于保存变更后的节点数据
    // 使用该数组保存有以下好处
    // 1.可以正确获得被删除节点索引
    // 2.交换节点位置只需要操作一遍 DOM
    // 3.用于 `diffChildren` 函数中的判断，只需要遍历
    // 两个树中都存在的节点，而对于新增或者删除的节点来说，完全没必要
    // 再去判断一遍
    let list = [];
    oldList &&
        oldList.forEach(item => {
            let key = item.key;
            if (isString(item)) {
                key = item;
            }
            // 寻找新的 children 中是否含有当前节点
            // 没有的话需要删除
            let index = newKeys.indexOf(key);
            if (index === -1) {
                list.push(null);
            } else list.push(key);
        });
    // 遍历变更后的数组
    let length = list.length;
    // 因为删除数组元素是会更改索引的
    // 所有从后往前删可以保证索引不变
    for (let i = length - 1; i >= 0; i--) {
        // 判断当前元素是否为空，为空表示需要删除
        if (!list[i]) {
            list.splice(i, 1);
            changes.push({
                type: StateEnums.Remove,
                index: i
            });
        }
    }
    // 遍历新的 list，判断是否有节点新增或移动
    // 同时也对 `list` 做节点新增和移动节点的操作
    newList &&
        newList.forEach((item, i) => {
            let key = item.key;
            if (isString(item)) {
                key = item;
            }
            // 寻找旧的 children 中是否含有当前节点
            let index = list.indexOf(key);
            // 没找到代表新节点，需要插入
            if (index === -1 || key == null) {
                changes.push({
                    type: StateEnums.Insert,
                    node: item,
                    index: i
                });
                list.splice(i, 0, key);
            } else {
                // 找到了，需要判断是否需要移动
                if (index !== i) {
                    changes.push({
                        type: StateEnums.Move,
                        from: index,
                        to: i
                    });
                    move(list, index, i);
                }
            }
        });
    return { changes, list };
}

function getKeys(list) {
    let keys = [];
    let text;
    list &&
        list.forEach(item => {
            let key;
            if (isString(item)) {
                key = [item];
            } else if (item instanceof Element) {
                key = item.key;
            }
            keys.push(key);
        });
    return keys;
}
```

### 2.4 遍历子元素打标识

对于这个函数来说，主要功能就两个

1. 判断两个列表差异
2. 给节点打上标记

总体来说，该函数实现的功能很简单

```js
function diffChildren(oldChild, newChild, index, patches) {
    let { changes, list } = listDiff(oldChild, newChild, index, patches);
    if (changes.length) {
        if (patches[index]) {
            patches[index] = patches[index].concat(changes);
        } else {
            patches[index] = changes;
        }
    }
    // 记录上一个遍历过的节点
    let last = null;
    oldChild &&
        oldChild.forEach((item, i) => {
            let child = item && item.children;
            if (child) {
                index = last && last.children ? index + last.children.length + 1 : index + 1;
                let keyIndex = list.indexOf(item.key);
                let node = newChild[keyIndex];
                // 只遍历新旧中都存在的节点，其他新增或者删除的没必要遍历
                if (node) {
                    dfs(item, node, index, patches);
                }
            } else index += 1;
            last = item;
        });
}
```

## 第三步: 渲染差异

这个函数主要两个功能

1. 深度遍历树，将需要做变更操作的取出来
2. 局部更新 DOM

整体来说这部分代码还是很好理解的

```js
let index = 0;
export default function patch(node, patchs) {
    let changes = patchs[index];
    let childNodes = node && node.childNodes;
    // 这里的深度遍历和 diff 中是一样的
    if (!childNodes) index += 1;
    if (changes && changes.length && patchs[index]) {
        changeDom(node, changes);
    }
    let last = null;
    if (childNodes && childNodes.length) {
        childNodes.forEach((item, i) => {
            index = last && last.children ? index + last.children.length + 1 : index + 1;
            patch(item, patchs);
            last = item;
        });
    }
}

function changeDom(node, changes, noChild) {
    changes &&
        changes.forEach(change => {
            let { type } = change;
            switch (type) {
                case StateEnums.ChangeProps:
                    let { props } = change;
                    props.forEach(item => {
                        if (item.value) {
                            node.setAttribute(item.prop, item.value);
                        } else {
                            node.removeAttribute(item.prop);
                        }
                    });
                    break;
                case StateEnums.Remove:
                    node.childNodes[change.index].remove();
                    break;
                case StateEnums.Insert:
                    let dom;
                    if (isString(change.node)) {
                        dom = document.createTextNode(change.node);
                    } else if (change.node instanceof Element) {
                        dom = change.node.create();
                    }
                    node.insertBefore(dom, node.childNodes[change.index]);
                    break;
                case StateEnums.Replace:
                    node.parentNode.replaceChild(change.node.create(), node);
                    break;
                case StateEnums.Move:
                    let fromNode = node.childNodes[change.from];
                    let toNode = node.childNodes[change.to];
                    let cloneFromNode = fromNode.cloneNode(true);
                    let cloenToNode = toNode.cloneNode(true);
                    node.replaceChild(cloneFromNode, toNode);
                    node.replaceChild(cloenToNode, fromNode);
                    break;
                default:
                    break;
            }
        });
}
```

## 总结:

Virtual Dom 算法的实现也就是以下三步

1. 通过 JS 来模拟创建 DOM 对象
2. 判断两个对象的差异
3. 渲染差异

```js
let test4 = new Element('div', { class: 'my-div' }, ['test4']);
let test5 = new Element('ul', { class: 'my-div' }, ['test5']);

let test1 = new Element('div', { class: 'my-div' }, [test4]);

let test2 = new Element('div', { id: '11' }, [test5, test4]);

let root = test1.render();

let pathchs = diff(test1, test2);
console.log(pathchs);

setTimeout(() => {
    console.log('开始更新');
    patch(root, pathchs);
    console.log('结束更新');
}, 1000);
```
