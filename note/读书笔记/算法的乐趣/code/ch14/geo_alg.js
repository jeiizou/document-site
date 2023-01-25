//预置变量和函数=====================================
const DFP = 1e-10;
const INFINITE = 10000.0;

function IsZeroFloatValue(v) {
    return Math.abs(v - 0.0) <= DFP;
}

function IsSameFloatValue(v1, v2) {
    return math.abs(v1 - v2) <= DFP;
}

function assert() {
    if (!value) throw messgae || 'err';
}
//对象定义===========================================

//点
class Point {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
}
//线
class LineSeg {
    constructor(point1, point2) {
        this.p1 = point1;
        this.p2 = point2;
    }

    IsHorizontal() {
        return IsSameFloatValue(this.p1.y, this.p2.y);
    }

    IsVertical() {
        return IsSameFloatValue(this.p1.x, this.p2.x);
    }
}
//面
class Polygon {
    constructor(p) {
        this.pts = [];
        for (let i = 0; i < p.length; i++) {
            this.pts.push(p.x, p.y);
        }
    }

    IsValid() {
        return this.pts.length >= 3;
    }

    GetPolyCount() {
        return this.pts.length;
    }
}

//圆
class Circle {
    constructor(point, radius) {
        this.point = point;
        this.radius = radius;
    }
}

//矩形
class Rect {
    constructor(x1, y1, x2, y2) {
        this.x1 = x1;
        this.y1 = y1;
        this.x2 = x2;
        this.y2 = y2;
    }
}



//基础函数===========================================

//判断点的x坐标和y坐标是否同时落在矩形的x坐标范围和y坐标范围内
function IsPointInRect(rc, p) {
    let xr = (p.x - rc.p1.x) * (p.x - rc.p2.x);
    let yr = (p.y - rc.p1.y) * (p.y - rc.p2.y);

    return xr <= 0.0 && yr <= 0.0;
}

//矢量叉积
function CrossProduct(x1, y1, x2, y2) {
    return x1 * y2 - x2 * y1;
}

//矢量点积
function DotProduct(x1, y1, x2, y2) {
    return x1 * x2 + y1 * y2;
}

//获取直线的矩阵包围盒
function GetLineSegmentRect(ls) {
    let rc = {};
    rc.p1 = ls.pe;
    rc.p2 = ls.ps;
    return rc;
}

//快速排斥试验
function IsLineSegmentExclusive(ls1, ls2) {
    let rc1 = GetLineSegmentRect(ls1);
    let rc2 = GetLineSegmentRect(ls2);
    return !IsRectIntersect(rc1, rc2);
}

//关系判断==============================================

//判断点与直线的关系
function IsPointOnLineSegment(ls, pt) {
    let rc = GetLineSegmentRect(ls); //获取直线的矩阵包围盒
    let cp = CrossProduct(ls.pe.x - ls.ps.x, ls.pe.y - ls.ps.y, pt.x - ls.ps.x, pt.y - ls.ps.y); //计算叉积

    return (
        IsPointInRect(rc, pt) && IsZeroFloatValue(cp) //排除实验
    ); //1E-8 精度
}

//判断两个矩形是否相交
function IsRectIntersect(rc1, rc2) {
    return (
        Math.max(rc1.p1.x, rc1.p2.x) >= Math.min(rc2.p1.x, rc2.p2.x) &&
        Math.max(rc2.p1.x, rc2.p2.x) >= Math.min(rc1.p1.x, rc1.p2.x) &&
        Math.max(rc1.p1.y, rc1.p2.y) >= Math.min(rc2.p1.y, rc2.p2.y) &&
        Math.max(rc2.p1.y, rc2.p2.y) >= Math.min(rc1.p1.y, rc1.p2.y)
    );
}

//判断两条线段是否相交
function IsLineSegmentIntersect(ls1, ls2) {
    if (IsLineSegmentExclusive(ls1, ls2)) {
        //排斥实验
        return false;
    }
    //( P1 - Q1 ) × ( Q2 - Q1 )
    let p1xq = CrossProduct(ls1.ps.x - ls2.ps.x, ls1.ps.y - ls2.ps.y, ls2.pe.x - ls2.ps.x, ls2.pe.y - ls2.ps.y);
    //( P2 - Q1 ) × ( Q2 - Q1 )
    let p2xq = CrossProduct(ls1.pe.x - ls2.ps.x, ls1.pe.y - ls2.ps.y, ls2.pe.x - ls2.ps.x, ls2.pe.y - ls2.ps.y);

    //( Q1 - P1 ) × ( P2 - P1 )
    let q1xp = CrossProduct(ls2.ps.x - ls1.ps.x, ls2.ps.y - ls1.ps.y, ls1.pe.x - ls1.ps.x, ls1.pe.y - ls1.ps.y);
    //( Q2 - P1 ) × ( P2 - P1 )
    let q2xp = CrossProduct(ls2.pe.x - ls1.ps.x, ls2.pe.y - ls1.ps.y, ls1.pe.x - ls1.ps.x, ls1.pe.y - ls1.ps.y);

    //跨立实验
    return p1xq * p2xq <= 0.0 && q1xp * q2xp <= 0.0;
}

//判断点是否在多边形内
function IsPointInPolygon(py, pt) {
    assert(py.IsValid()); /*只考虑正常的多边形，边数>=3*/

    let count = 0;
    let ll = new LineSeg(pt, Point(-INFINITE, pt.y)); /*射线L*/
    for (let i = 0; i < py.GetPolyCount(); i++) {
        /*当前点和下一个点组成线段P1P2*/
        let pp =new LineSeg(py.pts[i], py.pts[(i + 1) % py.GetPolyCount()]);
        if (IsPointOnLineSegment(pp, pt)) {
            return true;
        }

        if (!pp.IsHorizontal()) {
            if (IsSameFloatValue(pp.ps.y, pt.y) && pp.ps.y > pp.pe.y) {
                count++;
            } else if (IsSameFloatValue(pp.pe.y, pt.y) && pp.pe.y > pp.ps.y) {
                count++;
            } else {
                if (IsLineSegmentIntersect(pp, ll)) {
                    count++;
                }
            }
        }
    }

    return count % 2 == 1;
}
