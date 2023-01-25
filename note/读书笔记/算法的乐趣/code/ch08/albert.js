// 爱因斯坦的思考题

//数据准备

const GROUPS_ITEMS = 5;
const GROUPS_COUNT = 5;

const COLOR_BLUE = 0;
const COLOR_RED = 1;
const COLOR_GREEN = 2;
const COLOR_YELLOW = 3;
const COLOR_WHITE = 4;

const NATION_NORWAY = 0;
const NATION_DANMARK = 1;
const NATION_SWEDEND = 2;
const NATION_ENGLAND = 3;
const NATION_GERMANY = 4;

const DRINK_TEA = 0;
const DRINK_WATER = 1;
const DRINK_COFFEE = 2;
const DRINK_BEER = 3;
const DRINK_MILK = 4;

const PET_HORSE = 0;
const PET_CAT = 1;
const PET_BIRD = 2;
const PET_FISH = 3;
const PET_DOG = 4;

const CIGARET_BLENDS = 0;
const CIGARET_DUNHILL = 1;
const CIGARET_PRINCE = 2;
const CIGARET_PALLMALL = 3;
const CIGARET_BLUEMASTER = 4;

let itemName = ["房子", "国家", "饮料", "宠物", "烟"];
let valueName = [
  ["蓝色", "红色", "绿色", "黄色", "白色"],
  ["挪威", "丹麦", "瑞士", "英国", "德国"],
  ["茶", "水", "咖啡", "啤酒", "牛奶"],
  ["马", "猫", "鸟", "鱼", "狗"],
  ["Blends", "Dunhill", "Prince", "PallMall", "BlueMaster"]
];

let type_house = 0,
  type_nation = 1,
  type_drink = 2,
  type_pet = 3,
  type_cigaret = 4;

//数据结构
function tagItem(type, value) {
  this.type = type;
  this.value = value;
}

function tagBind(first_type, first_val, second_type, second_val) {
  this.first_type = first_type;
  this.first_val = first_val;
  this.second_type = second_type;
  this.second_val = second_val;
}

let binds = [
  new tagBind(type_house, COLOR_RED, type_nation, NATION_ENGLAND),
  new tagBind(type_nation, NATION_SWEDEND, type_pet, PET_DOG),
  new tagBind(type_nation, NATION_DANMARK, type_drink, DRINK_TEA),
  new tagBind(type_house, COLOR_GREEN, type_drink, DRINK_COFFEE),
  new tagBind(type_cigaret, CIGARET_PALLMALL, type_pet, PET_BIRD),
  new tagBind(type_house, COLOR_YELLOW, type_cigaret, CIGARET_DUNHILL),
  new tagBind(type_cigaret, CIGARET_BLUEMASTER, type_drink, DRINK_BEER),
  new tagBind(type_nation, NATION_GERMANY, type_cigaret, CIGARET_PRINCE)
];

const BINDS_COUNT = binds.length;

function tagRelation(type, val, relation_type, relation_val) {
  this.type = type;
  this.val = val;
  this.relation_type = relation_type;
  this.relation_val = relation_val;
}

let relations = [
  new tagRelation(type_cigaret, CIGARET_BLENDS, type_pet, PET_CAT),
  new tagRelation(type_pet, PET_HORSE, type_cigaret, CIGARET_DUNHILL),
  new tagRelation(type_nation, NATION_NORWAY, type_house, COLOR_BLUE),
  new tagRelation(type_cigaret, CIGARET_BLENDS, type_drink, DRINK_WATER)
];

const RELATIONS_COUNT = relations.length;

function tagGroup(itemValue) {
  this.itemValue = itemValue; //length: GROUPS_ITEMS
}

function GetGroupItemValue(group, type) {
  return group.itemValue[type];
}

function FindGroupIdxByItem(groups, type, value) {
  for (let i = 0; i < GROUPS_COUNT; i++) {
    if (GetGroupItemValue(groups[i], type) == value) {
      return i;
    }
  }
  return -1;
}

function CheckGroupBind(groups, groupIdx, type, value) {
  if (GetGroupItemValue(groups[groupIdx], type) != value) {
    return false;
  }
  return true;
}

function CheckAllGroupsBind(groups, binds) {
  for (let i = 0; i < BINDS_COUNT; i++) {
    let grpIds = FindGroupIdxByItem(
      groups,
      binds[i].first_type,
      binds[i].first_val
    );
    if (grpIds != -1) {
      if (
        !CheckGroupBind(
          groups,
          grpIds,
          binds[i].second_type,
          binds[i].second_val
        )
      ) {
        return false;
      }
    }
  }
  return true;
}

function CheckGroupRelation(groups, group, type, value) {
  if (groupIdx == 0) {
    if (GetGroupItemValue(groups[groupIdx + 1], type) != value) {
      return false;
    }
  } else if (groupIdx == GROUPS_COUNT - 1) {
    if (GetGroupItemValue(groups[groupIdx - 1], type) != value) {
      return false;
    }
  } else {
    if (
      GetGroupItemValue(groups[groupIdx - 1], type) != value &&
      GetGroupItemValue(groups[groupIdx + 1], type) != value
    ) {
      return false;
    }
  }
  return true;
}

function CheckAllGroupsRelation(groups, relations) {
  for (let i = 0; i < RELATIONS_COUNT; i++) {
    let grpIdx = FindGroupIdxByItem(
      groups,
      relations[i].type,
      relations[i].val
    );
    if (
      !CheckAllGroupsRelation(
        groups,
        grpIdx,
        relations[i].relation_type,
        relations[i].relation_val
      )
    ) {
      if (
        !CheckGroupRelation(
          groups,
          grpIdx,
          relations[i].relation_type,
          relations[i].relation_val
        )
      ) {
        return false;
      }
    }
  }
  return true;
}

function IsGroupItemValueUsed(groups, groupAsd, type, value) {
  for (let i = 0; i < groupAsd; i++) {
    if (groups[i].itemValue[type] == value) {
      return true;
    }
  }
  return false;
}

function PrintSingleLineGroup(group) {
  for (let i = type_house; i <= type_cigaret; i++) {
    console.log(valueName[i][group.itemValue[i]]);
  }
}

function PrintAllGroupsResult(groups, groupCount) {
  PrintGroupsNameTitle();
  for (let i = 0; i < groupCount; i++) {
    PrintSingleLineGroup(groups[i]);
  }
}

let cnt = 0;
function DoGroupsfinalCheck(groups) {
  cnt++;
  if (cnt % 1000000 == 0) {
    console.log(cnt);
  }
  if (
    CheckAllGroupsBind(groups, binds) &&
    CheckAllGroupsRelation(groups, relations)
  ) {
    PrintAllGroupsResult(groups, GROUPS_COUNT);
  }
}

function EnumPeopleCigerts(groups, groupIdx) {
  if (groupIdx == GROUPS_COUNT) {
    /*递归终止条件*/
    DoGroupsfinalCheck(groups);
    return;
  }

  for (let i = CIGARET_BLENDS; i <= CIGARET_BLUEMASTER; i++) {
    if (!IsGroupItemValueUsed(groups, groupIdx, type_cigaret, i)) {
      groups[groupIdx].itemValue[type_cigaret] = i;

      EnumPeopleCigerts(groups, groupIdx + 1);
    }
  }
}

function ArrangePeopleCigert(groups) {
  EnumPeopleCigerts(groups, 0);
}

function EnumPeoplePats(groups, groupIdx) {
  if (groupIdx == GROUPS_COUNT) {
    /*递归终止条件*/
    ArrangePeopleCigert(groups);
    return;
  }

  for (let i = PET_HORSE; i <= PET_DOG; i++) {
    if (!IsGroupItemValueUsed(groups, groupIdx, type_pet, i)) {
      groups[groupIdx].itemValue[type_pet] = i;

      EnumPeoplePats(groups, groupIdx + 1);
    }
  }
}

function ArrangePeoplePet(groups) {
  /*这里没有可用规则*/
  EnumPeoplePats(groups, 0);
}

function EnumPeopleDrinks(groups, groupIdx) {
  if (groupIdx == GROUPS_COUNT) {
    /*递归终止条件*/
    /*应用规则(8)：住在中间那个房子里的人喝牛奶；*/
    if (groups[2].itemValue[type_drink] == DRINK_MILK) {
      ArrangePeoplePet(groups);
    }
    return;
  }

  for (let i = DRINK_TEA; i <= DRINK_MILK; i++) {
    if (!IsGroupItemValueUsed(groups, groupIdx, type_drink, i)) {
      groups[groupIdx].itemValue[type_drink] = i;
      EnumPeopleDrinks(groups, groupIdx + 1);
    }
  }
}

function ArrangePeopleDrinks(groups) {
  /*这里没有可用规则*/
  EnumPeopleDrinks(groups, 0);
}

/*遍历国家*/
function EnumHouseNations(groups, groupIdx) {
  if (groupIdx == GROUPS_COUNT) {
    /*递归终止条件*/
    ArrangePeopleDrinks(groups);
    return;
  }

  for (let i = NATION_NORWAY; i <= NATION_GERMANY; i++) {
    if (!IsGroupItemValueUsed(groups, groupIdx, type_nation, i)) {
      groups[groupIdx].itemValue[type_nation] = i;

      EnumHouseNations(groups, groupIdx + 1);
    }
  }
}

function ArrangeHouseNations(groups) {
  /*应用规则(9)：挪威人住在第一个房子里面；*/
  groups[0].itemValue[type_nation] = NATION_NORWAY;
  EnumHouseNations(groups, 1); /*从第二个房子开始*/
}

function CheckAllGroupBind(groups,binds){
    for (let i = 0; i < BINDS_COUNT; i++) {
       let grpIdx=FindGroupIdxByItem(groups,binds[i].first_type,binds[i].first_val);
       if(grpIdx != -1){
           if(!CheckGroupBind(groups,grpIdx,binds[i].second_type,binds[i].second_val)){
               return false;
           }
       }
    }

    return true;
}

function CheckGroupRelation(groups,groupIdx,type,value){
    if(groupIdx==0){
        if(GetGroupItemValue(groups[groupIdx+1],type)!=value){
            return false;
        }
    }else if(groupIdx==(GROUPS_COUNT-1)){
        
    }
}
/* 遍历房子颜色*/
function EnumHouseColors(groups, groupIdx) {
  if (groupIdx == GROUPS_COUNT) {
    /*递归终止条件*/
    ArrangeHouseNations(groups);
    return;
  }

  for (let i = COLOR_BLUE; i <= COLOR_YELLOW; i++) {
    if (!IsGroupItemValueUsed(groups, groupIdx, type_house, i)) {
      groups[groupIdx].itemValue[type_house] = i;
      if (i == COLOR_GREEN) {
        //应用线索(4)：绿房子紧挨着白房子，在白房子的左边；
        groups[++groupIdx].itemValue[type_house] = COLOR_WHITE;
      }

      EnumHouseColors(groups, groupIdx + 1);
      if (i == COLOR_GREEN) {
        groupIdx--;
      }
    }
  }
}

(function main(){
    let groups=new tagGroup([]);

    EnumHouseColors(groups, 0);

	return 0;
})();
