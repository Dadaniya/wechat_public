/*
*
*默认标题是第一旬
默认查询第三列,
*最多回复10行数据
*
*/
module.exports = function(sheets,req, res, { row = 0, col = 2 } = {}) {
    let [namesh,findtxt]= req.weixin.Content.replace(/[\s\.，]+/g,' ').split(' ');
 
    let month = namesh.replace(/[^0-9]+/g, '') || (sheets[new Date().getMonth()] ? new Date().getMonth() : new Date().getMonth() - 1);
    let flag=true;
    if(!findtxt) {
    
    	findtxt=namesh.replace(/[0-9]+/g,'');
    	namesh=month;
    	flag=false;
    	}
    if (Object.keys(sheets).indexOf(namesh + '') == -1) return res.reply('浪费一次机会，请输入正确名称！');
    let data = sheets[namesh].filter(val => {
        return val[col] && (''+val[col]).includes(findtxt);
    });
    if (data.length < 1 || data.length > 10) {
        res.reply(`Err:${data.length} 请回复正确的名称/::|`);
    } else {
        let msg = '';
        if (flag) {
            let count = 0;
            for (let j = 0; j < data.length; j++) {
                for (let i = 0; i < data[j].length; i++) {
                    if (data[j][i]) {
                        msg += `${data[row][i]}: ${data[j][i]}	`;
                        count++;
                        if (count % 2 == 0) msg += '\n';
                    }
                }

            }
        } else {
            for (let j = 0; j < data.length; j++) {
                msg += `【${data[j][1]+data[j][3]}】${data[j][4]} \n\n`;
                msg += '----收入'.padEnd(16, '-');
                msg += `\nT0:${parseFloat(data[j][5]).toFixed(1)}万 目标:${parseFloat(data[j][6]).toFixed(1)}万\n累计:${parseFloat(data[j][7]).toFixed(1)}万 进度:${parseFloat(data[j][8]).toFixed(1)}%\n增幅:${parseFloat(data[j][9]).toFixed(2)}% 增幅排名:${data[j][10]}\n\n`;

                msg += '----市场竞争'.padEnd(16, '-');
                msg += `\n天翼到达份额:${parseFloat(data[j][15]).toFixed(1)} 提升:${parseFloat(data[j][17]).toFixed(1)}\n宽带渗透:${parseFloat(data[j][19]).toFixed(1)} 提升:${parseFloat(data[j][20]).toFixed(1)}\n\n`;

                msg += '----今年发展质态'.padEnd(16, '-');
                msg += `\n天翼活跃:${parseFloat(data[j][21]).toFixed(1)}% 宽带活跃:${parseFloat(data[j][22]).toFixed(1)}%\n\n`;

                msg += '----存量离网率'.padEnd(16, '-');
                msg += `\n天翼:${parseFloat(data[j][23]).toFixed(1)}% 宽带:${parseFloat(data[j][24]).toFixed(1)}%`;

            }
        }

        res.reply(msg);
    }
}
