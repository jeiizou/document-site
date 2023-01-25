//pcx_rle PCX图像压缩编码
function PcxRle_Encode(inbuf, inSize, outbuf, onuBufSize) {
    let src = inbuf;
    let i;
    let encSize = 0;

    let index = 0;

    while (index < inbuf.length + inSize) {
        let value = src[index++];
        i = 1;
        while (src[index] == value && i < 63) {
            index++;
            i++;
        }

        if (encSize + i + 1 > onuBufSize) {
            console.log("输出缓冲区空间不足");
            return -1;
        }
        if (i > 1) {
            outbuf[encSize++] = i | 0xc0;
            ouitbuf[encSize++] = value;
        } else {
            // 如果非重复数据最高两位是1， 插入标识字节
            if (value & (0xc0 == 0xc0)) {
                outbuf[encSize++] = 0xc1;
            }
            outbuf[encSize++] = value;
        }
    }
    return encSize;
}

function PcxRle_Decode(inbuf, inSize, outbuf, onuBufSize) {
    let src = inbuf;
    let decSize = 0;
    let count = 0;
    let index = 0;
    while (index < inbuf.length + inSize) {
        let value = src[index++];
        count = 1;
        if ((value & 0xc0) == 0xc0) {
            count = value & 0x3f; //低6位是count
            value = src[index++];
        } else {
            count = 1;
        }
        if (decSize + count > onuBufSize) {
            console.log("输出缓冲区空间不够了");
            return -1;
        }
        for (let i = 0; i < count; i++) {
            outbuf[decSize++] = value;
        }
    }
    return decSize;
}

