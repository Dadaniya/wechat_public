const wechat = require('wechat');
const express = require('express');
const app = express();
const xls = require('node-xlsx');
const fs=require('fs');
const multiparty=require('multiparty');

const user = new Map();
setInterval(() => user.clear(), 60000 * 60 * 8); //every 8 h clear;

const pool = require('./lib/mysql.js');

let sheets={};
fs.readdir('./xls',function(err,filename){
filename.forEach(file=>{
		name=file.split('.')[0];
	sheets[name]||(sheets[name]=xls.parse('./xls/'+file)[0].data);});
})
fs.watch('./xls/',function(event,filename){
	setTimeout(function(){
	if(event=='rename') sheets[filename.split('.')[0]]?(delete sheets[filename.split('.')[0]]):(sheets[filename.split('.')[0]]=xls.parse('./xls/'+filename)[0].data);
	else sheets[filename.split('.')[0]]=xls.parse('./xls/'+filename)[0].data;
	console.log(sheets[filename.split('.')[0]]);},1000*30);
})


app.listen(5050);
const config = {
	token: 'yixiu',
	appid: 'wx1ecf555a9e24b915',
	encodingAESKey: 'CLBN4WKjcWeg0jYzDmLwfUvpP2MmJpUlVnkRjv9qHfk',
	checkSignature: true // 可选，默认为true。由于微信公众平台接口调试工具在明文模式下不发送签名，所以如要使用该测试工具，请将其设置为false
};
const subText = '欢迎订阅本公号\n回复支局查看经营信息，例如：洋河';
const unsubText = '欢迎下次再来！！/::\'(';
app.use(express.query());
app.use(express.static('public'));
// app.get('/upload',(req,res,next)=>{
// 	res.end();
// })
app.post('/upload',(req,res,next)=>{
	let form=new multiparty.Form();
	form.uploadDir='./xls/';
	form.maxFileSize=10*1024*1024;
	form.parse(req,(err,fields,files)=>{
		// console.log(files);
		// console.log(fields);
		fs.rename(files.content[0].path,'./xls/'+files.content[0].originalFilename,()=>null);
		res.writeHead(200,{'content-type':'text/plain'});
		if(err) res.end('upload failed');
		res.end('upload success');
	});
});
app.use('/wechat', wechat(config, function (req, res, next) {
		console.log(req.weixin);
//		res.reply({
//type:'image',
//content:{
//mediaId: '6600519871358307064',
//		}});
		if (req.weixin.MsgType == 'event') {
		req.weixin.Event == 'subscribe' ? res.reply(subText) : res.reply(unsubText);
	}
	// 微信输入信息都在req.weixin上
	else if (req.weixin.MsgType == 'text') {
		try {
			let sql = `insert logs(openid,content) values ("${req.weixin.FromUserName}","${pool.escape(req.weixin.Content)}")`;
			pool.query(sql, (err, result) => {
				if (err) console.log(err);
					req.weixin.Content=req.weixin.Content.trim();
				let funame = req.weixin.FromUserName;
				if (req.weixin.Content == new Date().getHours()) user.set(funame, 0);
				else user.set(funame, user.has(funame) ? user.get(funame) + 1 : 1);
				//if (funame != 'oEj8TwYQpDEBHDQu8rYTJiRPvIvE') user.set(funame, user.has(funame) ? user.get(funame) + 1 : 1);
				if (user.get(funame) > 3) res.reply('查看次数太多/::P');
				else {
					let month=new Date().getMonth();					
					let msg = req.weixin.Content;
					month=msg.replace(/[^0-9]/g,'')||(sheets[month]?month:month-1);
					console.log(Object.keys(sheets));
					console.log(month);
					if(Object.keys(sheets).indexOf(month+'')==-1) return res.reply('浪费一次机会，请输入正确名称！');
					msg=msg.replace(/[0-9]/g,'');
					let data = sheets[month].filter(val => {
						return val[2] && val[2].includes(msg);
					});
					if (data.length < 1 || data.length > 2) {
						res.reply(`Err:${data.length} 请回复正确的名称/::|`);
					} else {
						let text = '';
						for (let j = 0; j < data.length; j++) {
							text += `【${data[j][1]+data[j][3]}】${data[j][4]} \n\n`;
							text += '----收入'.padEnd(16, '-');
							text += `\nT0:${parseFloat(data[j][5]).toFixed(1)}万 目标:${parseFloat(data[j][6]).toFixed(1)}万\n累计:${parseFloat(data[j][7]).toFixed(1)}万 进度:${parseFloat(data[j][8]).toFixed(1)}%\n增幅:${parseFloat(data[j][9]).toFixed(2)}% 增幅排名:${data[j][10]}\n\n`;

							text += '----市场竞争'.padEnd(16, '-');
							text += `\n天翼到达份额:${parseFloat(data[j][15]).toFixed(1)} 提升:${parseFloat(data[j][17]).toFixed(1)}\n宽带渗透:${parseFloat(data[j][19]).toFixed(1)} 提升:${parseFloat(data[j][20]).toFixed(1)}\n\n`;

							text += '----今年发展质态'.padEnd(16, '-');
							text += `\n天翼活跃:${parseFloat(data[j][21]).toFixed(1)}% 宽带活跃:${parseFloat(data[j][22]).toFixed(1)}%\n\n`;

							text += '----存量离网率'.padEnd(16, '-');
							text += `\n天翼:${parseFloat(data[j][23]).toFixed(1)}% 宽带:${parseFloat(data[j][24]).toFixed(1)}%`;

						}
						res.reply(text);
					}

				}
			});
		} catch (e) {
			console.log(e);
			res.reply('出错了，请重试/::~');
		}
	} else res.reply('消息类型不支持');
}));
console.log('app start');
