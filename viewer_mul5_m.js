var forever = require('forever-monitor');
child = new (forever.Monitor)(__dirname+'/viewer_mul5.js', {args: process.argv.slice(2),execArgs: ['--expose-gc'],});
child.start();
