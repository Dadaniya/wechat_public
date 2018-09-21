const wechat = require('wechat');
const express = require('express');
const app = express();
const xls = require('node-xlsx');
const fs = require('fs');
const multiparty = require('multiparty');

const config = require('./config.js');
const findSh = require('./find.js')

const user = new Map();
setInterval(() => user.clear(), 60000 * 60 * 8); //every 8 h clear;

const pool = require('./lib/mysql.js');

const sheets = {};
fs.readdir('./xls', function(err, filename) {
    filename.forEach(file => {
        name = file.split('.')[0];
        sheets[name] || (sheets[name] = xls.parse('./xls/' + file)[0].data);
    });
})
// fs.watch('./xls/', function(event, filename) {
//     setTimeout(function() {
//         if (event == 'rename') {
//         	if(filename.length>20) return;
//         	else        	sheets[filename.split('.')[0]] ? (delete sheets[filename.split('.')[0]]) : (sheets[filename.split('.')[0]] = xls.parse('./xls/' + filename)[0].data);
//         }
//         else sheets[filename.split('.')[0]] = xls.parse('./xls/' + filename)[0].data;
//         console.log(sheets[filename.split('.')[0]]);
//     }, 1000 * 30);
// })


app.listen(5050);

app.use(express.query());
app.use(express.static('public'));

app.post('/upload', (req, res, next) => {
    let form = new multiparty.Form();
    form.uploadDir = './xls/';
    form.maxFileSize = 10 * 1024 * 1024;

    form.parse(req, (err, fields, files) => {
 
    	if(fields.pwd[0]=='nz'){
    		 fs.rename(files.content[0].path, './xls/' + files.content[0].originalFilename, (err) => {
            if (err) console.log(err);
            else {
                sheets[files.content[0].originalFilename.split('.')[0]] = xls.parse('./xls/' + files.content[0].originalFilename)[0].data;

            }
        });
    	}else{
    		fs.unlink(files.content[0].path,err=>null);
    	}

       
        res.writeHead(200, { 'content-type': 'text/plain' });
        if (err) res.end('upload failed');
        res.end('upload success');
    });


});
app.use('/wechat', wechat(config, function(req, res, next) {
    //console.log(req.weixin);
    let type = req.weixin.MsgType;
    switch (type) {
        case 'event':
            {
                const subText = '欢迎订阅本公号\n回复支局查看经营信息，例如：洋河';
                const unsubText = '欢迎下次再来！！/::\'(';
                req.weixin.Event == 'subscribe' ? res.reply(subText) : res.reply(unsubText);
                break;
            }
        case 'text':
            {
                try {
                    let sql = `insert logs(openid,content) values ("${req.weixin.FromUserName}","${pool.escape(req.weixin.Content)}")`;
                    pool.query(sql, (err, result) => {
                        if (err) console.log(err);
                    });

                    req.weixin.Content = req.weixin.Content.trim();
                    let funame = req.weixin.FromUserName;
                    if (req.weixin.Content == new Date().getHours()) user.set(funame, 0);
                    else user.set(funame, user.has(funame) ? user.get(funame) + 1 : 1);
                    if (user.get(funame) > 3) res.reply('查看次数太多/::P');
                    else {
                        findSh(sheets, req, res);

                    }
                } catch (e) {
                    console.log(e);
                    res.reply('出错了，请重试/::~');
                }
                break;
            }
        default:
            { res.reply('消息类型不支持'); }
    }

}));
console.log('app start');