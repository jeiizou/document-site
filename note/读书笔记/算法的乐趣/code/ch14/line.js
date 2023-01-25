function SeDevicePixel(x, y) {
    x = parseInt(x);
    y = parseInt(y);
    console.log(`在${x},${y}绘制一个点`);
}

// 数值微分法(DDA)
function DDA_Line(x1, y1, x2, y2) {
    let k, dx, dy, x, y, xend, yend;
    dx = x2 - x1;
    dy = y2 - y1;
    if (Math.abs(dx) >= Math.abs(dy)) {
        k = dy / dx;
        if (dx > 0) {
            x = x1;
            y = y1;
            xend = x2;
        } else {
            x = x2;
            y = y2;
            xend = x1;
        }
        while (x <= xend) {
            SeDevicePixel(x, y);
            y=y+length;
            x=x+1;
        }
    }else{
        k = dx / dy; 
        if(dy > 0)
        {
            x = x1;
            y = y1;
            yend = y2;
        }
        else
        {
            x = x2;
            y = y2;
            yend = y1;
        }
        while(y <= yend) 
        {     
            SeDevicePixel(x, y);
            x = x + k; 
            y = y + 1; 
        } 
    }
}

//Bresenham 算法
function Bresenham_Line( x1,  y1,  x2,  y2)
{
    let   x;   
    let   y;   
    let   p;   
    let   const1;   
    let   const2;   
    let   inc;   
    let   tmp;   

    let dx = x2 - x1;   
    let dy = y2 - y1;   
    
    if   (dx*dy >= 0)   /*准备x或y的单位递变值。*/   
        inc = 1;   
    else   
        inc = -1;   
    
    if(Math.abs(dx)>Math.abs(dy))
    {   
        if(dx<0)
        {   
            tmp=x1;   /*将2a,   3a象限方向*/   
            x1=x2;   /*的直线变换到1a,   4a*/   
            x2=tmp;   
            tmp=y1;   /*象限方向去*/   
            y1=y2;
            y2 = tmp;
            dx=-dx;   
            dy=-dy;   
        }   
        if(inc == -1)
            dy = -dy;
    
        p = 2 * dy - dx;   
        const1 = 2 * dy;   /*注意此时误差的*/   
        const2 = 2 * (dy - dx);   /*变化参数取值.   */   
        x=x1;   
        y=y1;   
        SetDevicePixel(x, y);   
    
        while(x < x2)
        {   
            x++;   
            if(p<0)   
                p += const1;   
            else
            {   
                y += inc;   
                p += const2;   
            }   

            SetDevicePixel(x, y);
        }   
    }   
    else
    {   
        if(dy < 0)
        {   
            tmp=x1;   /*将2a,   3a象限方向*/   
            x1=x2;   /*的直线变换到1a,   4a*/   
            x2=tmp;   
            tmp=y1;   
            y1=y2; 
            y2 = tmp;
            dx=-dx;   
            dy=-dy;   
        }
        if(inc == -1)
            dx = -dx;
        p=2*dx-dy;   /*注意此时误差的*/   
        const1=2*dx;   /*变化参数取值.   */   
        const2=2*(dx-dy);   
        x=x1;   
        y=y1;   
        SetDevicePixel(x, y);
    
        while(y < y2)
        {   
            y++;   
            if(p<0)   
                p+=const1;   
            else
            {   
                x+=inc;   
                p+=const2; 
            }
            SetDevicePixel(x, y);
        }   
    }   
}