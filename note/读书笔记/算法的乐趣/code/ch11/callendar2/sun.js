const DEFINE = require("./calendar_const").DEFINE;
const VSOP87 = require("./VSOP87").VSOP87;

const SUN = {};

//使用公式对coff参数指定的周期项系数表进行计算求和计算
SUN.CalcPeriodicTerm = function(coff, count, dt) {
  let val = 0.0;

  for (let i = 0; i < count; i++)
    val += coff[i].A * cos(coff[i].B + coff[i].C * dt);

  return val;
};

//计算行星日心黄经
SUN.CalcSunEclipticLongitudeEC = function(dt) {
  let L0 = CalcPeriodicTerm(
    VSOP87.Earth_L0,
    DEFINE.COUNT_OF(VSOP87.Earth_L0),
    dt
  );
  let L1 = CalcPeriodicTerm(
    VSOP87.Earth_L1,
    DEFINE.COUNT_OF(VSOP87.Earth_L1),
    dt
  );
  let L2 = CalcPeriodicTerm(
    VSOP87.Earth_L2,
    DEFINE.COUNT_OF(VSOP87.Earth_L2),
    dt
  );
  let L3 = CalcPeriodicTerm(
    VSOP87.Earth_L3,
    DEFINE.COUNT_OF(VSOP87.Earth_L3),
    dt
  );
  let L4 = CalcPeriodicTerm(
    VSOP87.Earth_L4,
    DEFINE.COUNT_OF(VSOP87.Earth_L4),
    dt
  );
  let L5 = CalcPeriodicTerm(
    VSOP87.Earth_L5,
    DEFINE.COUNT_OF(VSOP87.Earth_L5),
    dt
  );

  let L =
    (((((L5 * dt + L4) * dt + L3) * dt + L2) * dt + L1) * dt + L0) /
    100000000.0;

  /*地心黄经 = 日心黄经 + 180度*/
  return Mod360Degree(Mod360Degree(L / DEFINE.RADIAN_PER_ANGLE) + 180.0);
};

//计算行星日薪黄纬
SUN.CalcSunEclipticLatitudeEC = function(dt) {
  let B0 = CalcPeriodicTerm(
    VSOP87.Earth_B0,
    DEFINE.COUNT_OF(VSOP87.Earth_B0),
    dt
  );
  let B1 = CalcPeriodicTerm(
    VSOP87.Earth_B1,
    DEFINE.COUNT_OF(VSOP87.Earth_B1),
    dt
  );
  let B2 = CalcPeriodicTerm(
    VSOP87.Earth_B2,
    DEFINE.COUNT_OF(VSOP87.Earth_B2),
    dt
  );
  let B3 = CalcPeriodicTerm(
    VSOP87.Earth_B3,
    DEFINE.COUNT_OF(VSOP87.Earth_B3),
    dt
  );
  let B4 = CalcPeriodicTerm(
    VSOP87.Earth_B4,
    DEFINE.COUNT_OF(VSOP87.Earth_B4),
    dt
  );

  let B = ((((B4 * dt + B3) * dt + B2) * dt + B1) * dt + B0) / 100000000.0;

  /*地心黄纬 = －日心黄纬*/
  return -(B / DEFINE.RADIAN_PER_ANGLE);
};

/*修正太阳的地心黄经，longitude, latitude 是修正前的太阳地心黄经和地心黄纬(度)，dt是儒略千年数，返回值单位度*/
SUN.AdjustSunEclipticLongitudeEC = function(dt, longitude, latitude) {
  let T = dt * 10; //T是儒略世纪数

  let dbLdash = longitude - 1.397 * T - 0.00031 * T * T;

  // 转换为弧度
  dbLdash *= DEFINE.RADIAN_PER_ANGLE;

  return (
    (-0.09033 +
      0.03916 *
        (Math.cos(dbLdash) + Math.sin(dbLdash)) *
        Math.tan(latitude * DEFINE.RADIAN_PER_ANGLE)) /
    3600.0
  );
};

/*修正太阳的地心黄纬，longitude是修正前的太阳地心黄经(度)，dt是儒略千年数，返回值单位度*/
SUN.AdjustSunEclipticLatitudeEC = function(dt, longitude) {
  let T = dt * 10; //T是儒略世纪数
  let dLdash = longitude - 1.397 * T - 0.00031 * T * T;
  //转换为弧度
  dLdash *= DEFINE.RADIAN_PER_ANGLE;
  return (0.03916 * (Math.cos(dLdash) - Math.sin(dLdash))) / 3600.0;
};

SUN.CalcSunEarthRadius = function(dt) {
  let R0 = CalcPeriodicTerm(
    VSOP87.Earth_R0,
    DEFINE.COUNT_OF(VSOP87.Earth_R0),
    dt
  );
  let R1 = CalcPeriodicTerm(
    VSOP87.Earth_R1,
    DEFINE.COUNT_OF(VSOP87.Earth_R1),
    dt
  );
  let R2 = CalcPeriodicTerm(
    VSOP87.Earth_R2,
    DEFINE.COUNT_OF(VSOP87.Earth_R2),
    dt
  );
  let R3 = CalcPeriodicTerm(
    VSOP87.Earth_R3,
    DEFINE.COUNT_OF(VSOP87.Earth_R3),
    dt
  );
  let R4 = CalcPeriodicTerm(
    VSOP87.Earth_R4,
    DEFINE.COUNT_OF(VSOP87.Earth_R4),
    dt
  );

  let R = ((((R4 * dt + R3) * dt + R2) * dt + R1) * dt + R0) / 100000000.0;

  return R;
};

/*得到某个儒略日的太阳地心黄经(视黄经)，单位度*/
SUN.GetSunEclipticLongitudeEC = function(jde) {
  let dt = (jde - JD2000) / 365250.0; /*儒略千年数*/
  // 计算太阳的地心黄经
  let longitude = CalcSunEclipticLongitudeEC(dt);

  // 计算太阳的地心黄纬
  let latitude = CalcSunEclipticLatitudeEC(dt) * 3600.0;

  // 修正精度
  longitude += AdjustSunEclipticLongitudeEC(dt, longitude, latitude);

  // 修正天体章动
  longitude += CalcEarthLongitudeNutation(dt);

  // 修正光行差
  /*太阳地心黄经光行差修正项是: -20".4898/R*/
  longitude -= 20.4898 / CalcSunEarthRadius(dt) / 3600.0;

  return longitude;
};

/*得到某个儒略日的太阳地心黄纬(视黄纬)，单位度*/
SUN.GetSunEclipticLatitudeEC = function(jde) {
  let dt = (jde - DEFINE.JD2000) / 365250.0; /*儒略千年数*/

  // 计算太阳的地心黄经
  let longitude = CalcSunEclipticLongitudeEC(dt);
  // 计算太阳的地心黄纬
  let latitude = CalcSunEclipticLatitudeEC(dt) * 3600.0;

  // 修正精度
  let delta = AdjustSunEclipticLatitudeEC(dt, longitude);
  latitude += delta * 3600.0;

  return latitude;
};

module.exports.SUN = SUN;
