var forever = require('forever-monitor');
child = new (forever.Monitor)(__dirname+'/get_room.js', {args: process.argv.slice(2)});
child.start();
