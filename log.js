const logfile='./err.txt'
module.exports=function(req,res,next){
	 let sql = `insert logs(openid,content) values ("${req.weixin.FromUserName}","${pool.escape(req.weixin.Content)}")`;
                    pool.query(sql, (err, result) => {
                        if (err) fs.appendFile(logfile,err,(error)=>console.log(err));
                    });
}