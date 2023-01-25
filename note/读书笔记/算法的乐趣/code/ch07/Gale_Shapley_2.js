//稳定匹配算法-男孩优先策略

//数据准备
let boys_origin = [
    ['吕布', 0, -1, 5, ['貂蝉', '大乔', '小乔', '阿丑', '尚香']],
    ['刘备', 0, -1, 5, ['貂蝉', '小乔', '大乔', '尚香', '阿丑']],
    ['孔明', 0, -1, 5, ['阿丑', '貂蝉', '小乔', '大乔', '尚香']],
    ['周瑜', 0, -1, 5, ['小乔', '大乔', '尚香', '貂蝉', '阿丑']],
    ['曹操', 0, -1, 5, ['小乔', '貂蝉', '大乔', '尚香', '阿丑']],
]

let girls_origin = [
    ['貂蝉', 0, -1, 5, ['曹操', '吕布', '刘备', '周瑜', '孔明']],
    ['大乔', 0, -1, 5, ['周瑜', '刘备', '孔明', '吕布', '曹操']],
    ['小乔', 0, -1, 5, ['周瑜', '孔明', '刘备', '曹操', '吕布']],
    ['尚香', 0, -1, 5, ['吕布', '刘备', '周瑜', '孔明', '曹操']],
    ['阿丑', 0, -1, 5, ['孔明', '周瑜', '曹操', '刘备', '吕布']],
]

//数据结构
function tagPartner(name, next, current, pCount, perfect) {
    this.name = name;//名字
    this.next = next;//下一个邀请对象
    this.current = current;//当前舞伴, -1表示没有
    this.pCount = pCount;//偏爱列表中舞伴个数
    this.perfect = perfect;//偏爱列表
}

//生成样例数据
function productData(pArray) {
    let res_array = [];
    for (let i = 0; i < pArray.length; i++) {
        const person = pArray[i];
        let res_person = new tagPartner(...person);
        res_array.push(res_person);
    }
    return res_array;
}

//按照名字搜索序列号
function FindIndexByName(name, datas) {
    for (let i = 0; i < datas.length; i++) {
        if (datas[i].name == name) {
            return i;
        }
    }

    return -1;
}

//算法主体
function Gale_Shapley(boys, girls, count, table) {
    let bid = FindFreePartner(boys, count);
    while (bid >= 0) {
        let girlName = boys[bid].perfect[boys[bid].next];
        let gid = FindIndexByName(girlName, girls);
        if (girls[gid].current == -1) {
            boys[bid].current = gid;
            girls[gid].current = bid;
        } else {
            let bpid = girls[gid].current;

            //女孩更喜欢bid超过当前舞伴pbid
            if (table[gid][bpid] > table[gid][bid]) {
                boys[bpid].current = -1;//当前舞伴恢复自由
                boys[bid].current = gid;//结交新舞伴
                girls[gid].current = bid;
            }
        }
        boys[bid].next++;//无论是否配对成功, 只对同一个女孩邀请一次
        bid = FindFreePartner(boys, count);
    }
    return IsAllPartnerMatch(boys, count);
}

//从男孩列表中找一个还没有舞伴, 并且偏好列表中还没有邀请过女孩的男孩, 返回男孩的索引.
function FindFreePartner(boys, count) {
    for (let i = 0; i < count; i++) {
        if (boys[i].current == -1) {
            return i;
        }
    }
    return -1;
}

//用于判断女孩喜欢一个舞伴的程度, 通过返回舞伴在自己偏爱列表中的位置索引, 索引越小, 程度越高
function GetPerfectPosition(girl, boyName) {
    for (let i = 0; i < girl.pCount; i++) {
        if (girl.perfect[i] == boyName) {
            return i;
        };
    }

    return -1;
}

function IsAllPartnerMatch(boys, count) {
    for (let i = 0; i < count; i++) {
        if (boys[i].current == -1) {
            return false;
        }
    }
    return true;
}

//生成二维表
function produceTable(cCount, boys_origin, girls_origin) {
    let priority = [];
    for (let w = 0; w < cCount; w++) {
        let perfect = girls_origin[w][4];
        let priority_col = [];
        for (let j = 0; j < cCount; j++) {
            let index = perfect.indexOf(boys_origin[j][0]);
            priority_col.push(index);
        }
        priority.push(priority_col);
    }
    return priority;
}


(function main() {
    //生成数据
    let boys = productData(boys_origin);
    let girls = productData(girls_origin);

    //生成关系表
    let table = produceTable(5, boys_origin, girls_origin);

    let res = Gale_Shapley(boys, girls, 5, table);
    if (res) {
        //输出配对情况
        for (let i = 0; i < boys.length; i++) {
            let bname = boys[i].name;
            let gname = girls[boys[i].current].name;
            console.log(`第${i + 1}对: ${bname} <==> ${gname}`);
        }
    } else {
        console.log("NOT SUCCESS");
    }
})()