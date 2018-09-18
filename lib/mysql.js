const mysql=require('mysql');

var pool=mysql.createPool({
    host:'localhost',
    port:3399,
    user:'dev',
    password:'dev123',
    database:'base',
});
module.exports= pool;

//pool.escape(variable) secure-char
