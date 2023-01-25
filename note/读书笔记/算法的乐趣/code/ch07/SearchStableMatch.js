//搜索所有完美匹配

//数据准备
let boys_origin = [
    ['吕布', -1, 5, ['貂蝉', '大乔', '小乔', '阿丑', '尚香']],
    ['刘备', -1, 5, ['貂蝉', '小乔', '大乔', '尚香', '阿丑']],
    ['孔明', -1, 5, ['阿丑', '貂蝉', '小乔', '大乔', '尚香']],
    ['周瑜', -1, 5, ['小乔', '大乔', '尚香', '貂蝉', '阿丑']],
    ['曹操', -1, 5, ['小乔', '貂蝉', '大乔', '尚香', '阿丑']],
]

let girls_origin = [
    ['貂蝉', -1, 5, ['曹操', '吕布', '刘备', '周瑜', '孔明']],
    ['大乔', -1, 5, ['周瑜', '刘备', '孔明', '吕布', '曹操']],
    ['小乔', -1, 5, ['周瑜', '孔明', '刘备', '曹操', '吕布']],
    ['尚香', -1, 5, ['吕布', '刘备', '周瑜', '孔明', '曹操']],
    ['阿丑', -1, 5, ['孔明', '周瑜', '曹操', '刘备', '吕布']],
]

const UNIT_COUNT = 5;

//数据结构
function tagPartner(name, current, pCount, perfect) {
    this.name = name;//名字
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

//搜索算法主体
function SearchStableMatch(index, boys, girls) {
    if (index == UNIT_COUNT) {
        if (IsStableMatch(boys, girls)) {
            //如果是稳定的就输出这一组的完美稳定匹配
            PrintResult(boys, girls, UNIT_COUNT);
        }
        return;
    }

    for (let i = 0; i < boys[index].pCount; i++) {
        let gname = boys[index].perfect[i];
        let gid = -1;
        girls.forEach((item, index) => {
            if (item.name == gname)
                gid = index;
        });
        if (!IsPartnerAssigned(girls[gid]) && IsFavoritePartner(girls[gid], index, boys)) {
            boys[index].current = gid;
            girls[gid].current = index;
            SearchStableMatch(index + 1, boys, girls);
            boys[index].current = -1;
            girls[gid].current = -1;
        }
    }
}

//判断是否稳定匹配
function IsStableMatch(boys, girls) {
    for (let i = 0; i < UNIT_COUNT; i++) {
        //找到男孩当前舞伴在自己的偏好列表中位置
        let gpos = GetPerfectPosition(boys[i], boys[i].current, girls);
        //在position位置之前的舞伴, 男孩喜欢她们胜过current
        for (let k = 0; k < gpos; k++) {
            let gname = boys[i].perfect[k];
            let gid = -1;
            girls.forEach((item, index) => {
                if (item.name == gname)
                    gid = index;
            });
            //找到男孩在这个女孩的偏好列表中的位置
            let bpos = GetPerfectPosition(girls[gid], i, boys);
            //找到女孩的当前舞伴在这个女孩的偏好列表中的位置
            let cpos = GetPerfectPosition(girls[gid], girls[gid].current, boys);
            if (bpos < cpos) {
                //女孩也是喜欢这个那还胜过喜欢自己当前的舞伴, 这是不稳定因素
                return false;
            }
        }
    }
    return true;
}

function GetPerfectPosition(partner, current, perfect) {
    let girlIndex = -1;
    let gname = partner.perfect[current]
    perfect.forEach((item, index) => {
        if (item.name == gname)
            girlIndex = index;
    });

    return girlIndex;
}

function IsPartnerAssigned(partner) {
    return (partner.current != -1);
}

function IsFavoritePartner(partner, bid, perfect) {
    for (let i = 0; i < partner.pCount; i++) {
        let bindex = -1;
        perfect.forEach((item, index) => {
            if (item.name == partner.perfect[i]) {
                bindex = index;
            }
        });
        if (bindex == bid) {
            return true;
        }
    }
    return false;
}

let waysIndex = 1;
function PrintResult(boys, girls, UNIT_COUNT) {
    console.log(`第${waysIndex}种稳定匹配`);
    for (let i = 0; i < UNIT_COUNT; i++) {
        let bname = boys[i].name;
        let gname = girls[boys[i].current].name;
        console.log(`第${i + 1}对: ${bname} <==> ${gname}`);
    }
    waysIndex++;
}



(function main() {
    //生成数据
    let boys = productData(boys_origin);
    let girls = productData(girls_origin);

    SearchStableMatch(0, boys, girls);
})()