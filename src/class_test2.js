const Demo = require('./class_demo.js');
async function runLeakTest(count = 100) {
  if (global.gc) global.gc();
  const before = process.memoryUsage().rss;
  
  for (let i = 0; i < count; i++) {
    let demo = new Demo('leakTest', i);
    await demo.start();
    await demo.executeTask('test');
    demo = await demo.destroy();
  }
  
  if (global.gc) {
    global.gc();
    await new Promise(r => setTimeout(r, 200));
  }
  const after = process.memoryUsage().rss;
  console.log(`LEAK TEST: RSS tăng ${(after - before)/1024/1024} MB`);
}
runLeakTest(100)