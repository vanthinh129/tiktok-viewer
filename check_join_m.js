var forever = require('forever-monitor');
child = new (forever.Monitor)(__dirname+'/check_join.js', {args: process.argv.slice(2)});
child.start();
