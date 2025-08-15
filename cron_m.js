const forever = require('forever-monitor');
child = new (forever.Monitor)(__dirname+'/cron.js', {args: process.argv.slice(2),execArgs: ['--expose-gc'],});
child.start();
