const xlsx=require('node-xlsx');
const sheets=xlsx.parse('./../July.xlsx');

for (let sheet of sheets)
	console.log(sheet.name);

