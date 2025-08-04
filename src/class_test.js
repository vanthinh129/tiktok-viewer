const v8 = require('v8');
console.log(v8.getHeapStatistics());
const Demo = require('./class_demo.js');
// Ví dụ cách sử dụng class
async function demoDemoClass() {
//   console.log(`Phiên bản Demo: ${Demo.VERSION}`);
  
  // Khởi tạo đối tượng
  let demo = new Demo('DemoObject', 123);
  
  // Khởi động đối tượng
  demo.start();
  
  try {
    // Truy cập thông tin đối tượng
    // console.log('Thông tin đối tượng:', demo.info);
    
    // Thực thi một công việc
    const result = await demo.executeTask('Xử lý dữ liệu');
    // console.log('Kết quả:', result);
    
    // Tạm dừng đối tượng
    demo.pause();
    
    // Tiếp tục đối tượng
    demo.resume();
    
    // Thực thi một công việc khác
    await demo.executeTask('Gửi thông báo');
  } catch (error) {
    console.error('Lỗi trong quá trình thực thi:', error);
  } finally {
    // Hủy đối tượng khi hoàn thành hoặc lỗi
    demo.destroy();
    demo = null

  }
}

function checkMemory() {
    let lastUsed = 0;
    
    const memoryInterval = setInterval(function() {
        try {
            const used = process.memoryUsage();
            const currentRss = Math.round(used.rss / 1024 / 1024 * 100) / 100;
            const heapUsed = Math.round(used.heapUsed / 1024 / 1024 * 100) / 100;
            const heapTotal = Math.round(used.heapTotal / 1024 / 1024 * 100) / 100;
            
            // Tính toán mức tăng bộ nhớ
            const increase = currentRss - lastUsed;
            lastUsed = currentRss;
            
            // console.log(`Memory: ${currentRss} MB | Heap: ${heapUsed}/${heapTotal} MB | Change: ${increase.toFixed(2)} MB`);
            
            // Giảm ngưỡng xuống 400MB để chủ động giải phóng bộ nhớ sớm hơn
            if (used.rss > 400 * 1024 * 1024 || increase > 50) { // Nếu tăng đột biến hoặc vượt ngưỡng
                console.log('Memory usage high, forcing garbage collection', used.rss);
                if (global.gc) {
                    global.gc();
                    
                    // Kiểm tra hiệu quả của GC
                    setTimeout(() => {
                        const afterGC = process.memoryUsage();
                        console.log(`After GC: ${Math.round(afterGC.rss / 1024 / 1024 * 100) / 100} MB | Freed: ${Math.round((used.rss - afterGC.rss) / 1024 / 1024 * 100) / 100} MB`);
                    }, 100);
                }
            }
        } catch(e) {
            console.log("error check memory", e);
        }
    }, 10000);
    
    // Trả về handler để có thể hủy checker nếu cần
    return () => clearInterval(memoryInterval);
}

// Gọi hàm demo theo batch và đợi mỗi batch hoàn thành
async function runDemo(batchSize = 10, totalObjects = 100, monitorTimeAfterComplete = 60) {
    // Lấy giá trị RSS ban đầu trước khi chạy bất kỳ đối tượng nào
    const initialMemory = getMemoryInfo();
    console.log(`\n=== THÔNG TIN BỘ NHỚ BAN ĐẦU (TRƯỚC KHI CHẠY) ===`);
    console.log(`RSS ban đầu: ${initialMemory.rss}MB, HeapUsed: ${initialMemory.heapUsed}MB, HeapTotal: ${initialMemory.heapTotal}MB\n`);
    
    console.log(`Chạy demo với ${totalObjects} đối tượng, mỗi batch ${batchSize} đối tượng`);
    
    // Khởi động kiểm tra bộ nhớ trong quá trình thực thi
    const stopMemoryCheck = checkMemory();
    
    try {
        // Chạy theo các batch
        for (let i = 0; i < totalObjects; i += batchSize) {
            // console.log(`\n--- Batch ${Math.floor(i/batchSize) + 1} ---`);
            const currentBatchSize = Math.min(batchSize, totalObjects - i);
            const batchPromises = [];
            
            // Tạo batch hiện tại
            for (let j = 0; j < currentBatchSize; j++) {
                batchPromises.push(demoDemoClass());
            }
            
            // Đợi batch hiện tại hoàn thành trước khi chạy batch tiếp theo
            await Promise.all(batchPromises);
            
            // console.log(`Hoàn thành batch ${Math.floor(i/batchSize) + 1}`);
            
            // Chạy GC sau mỗi batch nếu có thể
            if (global.gc) {
                // console.log('Chạy garbage collector sau batch...');
                global.gc();
            }
            
            // Đợi một chút giữa các batch để cho GC có cơ hội chạy
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    } catch (error) {
        console.error('Lỗi trong quá trình chạy demo:', error);
    } finally {
        console.log('Hoàn thành tất cả demo');
        
        // Dừng theo dõi bộ nhớ ban đầu
        stopMemoryCheck();
        
        // Thử chạy GC lần cuối
        if (global.gc) {
            // console.log('Chạy garbage collector lần cuối...');
            global.gc();
        }
        
        // Bắt đầu kiểm tra RAM sau khi hoàn thành tất cả demo so với ban đầu
        console.log(`\n=== BẮT ĐẦU KIỂM TRA RAM SAU KHI HOÀN THÀNH (${monitorTimeAfterComplete} giây) ===\n`);
        monitorMemoryAfterComplete(monitorTimeAfterComplete, initialMemory);
    }
}

/**
 * Lấy thông tin bộ nhớ hiện tại
 * @returns {Object} Thông tin bộ nhớ
 */
function getMemoryInfo() {
    const used = process.memoryUsage();
    return {
        rss: Math.round(used.rss / 1024 / 1024 * 100) / 100,
        heapTotal: Math.round(used.heapTotal / 1024 / 1024 * 100) / 100,
        heapUsed: Math.round(used.heapUsed / 1024 / 1024 * 100) / 100,
        external: Math.round((used.external || 0) / 1024 / 1024 * 100) / 100
    };
}

/**
 * Hàm kiểm tra và ghi log RAM sau khi hoàn thành tất cả demo
 * @param {number} durationInSeconds Thời gian theo dõi (giây)
 * @param {Object} initialMemory Thông tin bộ nhớ ban đầu
 */
function monitorMemoryAfterComplete(durationInSeconds = 60, initialMemory) {
    let monitorStartTime = Date.now();
    let checkCount = 0;
    
    console.log(`Bộ nhớ ban đầu (trước khi chạy): RSS=${initialMemory.rss}MB, HeapUsed=${initialMemory.heapUsed}MB`);
    
    // Bắt đầu kiểm tra RAM định kỳ mỗi 10 giây
    const interval = setInterval(() => {
        try {
            checkCount++;
            const used = process.memoryUsage();
            const currentRss = Math.round(used.rss / 1024 / 1024 * 100) / 100;
            const heapUsed = Math.round(used.heapUsed / 1024 / 1024 * 100) / 100;
            const heapTotal = Math.round(used.heapTotal / 1024 / 1024 * 100) / 100;
            const external = Math.round((used.external || 0) / 1024 / 1024 * 100) / 100;
            
            // Tính toán thời gian đã trôi qua
            const elapsedSeconds = Math.round((Date.now() - monitorStartTime) / 1000);
            
            // Tính toán sự thay đổi so với bộ nhớ ban đầu
            const rssDiff = (currentRss - initialMemory.rss).toFixed(2);
            const heapUsedDiff = (heapUsed - initialMemory.heapUsed).toFixed(2);
            
            console.log(`[Kiểm tra #${checkCount} - ${elapsedSeconds}s] RSS: ${currentRss}MB (${rssDiff}MB), ` +
                        `Heap: ${heapUsed}/${heapTotal}MB (${heapUsedDiff}MB), External: ${external}MB`);
            
            // Chạy GC mỗi 5 lần kiểm tra (50 giây) để xem sự thay đổi
            if (checkCount % 5 === 0 && global.gc) {
                // console.log('>> Chạy GC thủ công để kiểm tra hiệu quả...');
                global.gc();
                
                // Kiểm tra bộ nhớ sau khi chạy GC
                setTimeout(() => {
                    const afterGC = process.memoryUsage();
                    const rssAfterGC = Math.round(afterGC.rss / 1024 / 1024 * 100) / 100;
                    const heapUsedAfterGC = Math.round(afterGC.heapUsed / 1024 / 1024 * 100) / 100;
                    // console.log(`>> Sau GC: RSS=${rssAfterGC}MB (-${(currentRss - rssAfterGC).toFixed(2)}MB), ` +`HeapUsed=${heapUsedAfterGC}MB (-${(heapUsed - heapUsedAfterGC).toFixed(2)}MB)`);
                }, 100);
            }
            
            // Kiểm tra nếu đã quá thời gian theo dõi
            if (elapsedSeconds >= durationInSeconds) {
                clearInterval(interval);
                console.log(`\n=== KẾT THÚC KIỂM TRA RAM (sau ${durationInSeconds} giây) ===`);
                
                // Kiểm tra và hiển thị sự thay đổi cuối cùng
                const finalRssDiff = (currentRss - initialMemory.rss).toFixed(2);
                const finalHeapDiff = (heapUsed - initialMemory.heapUsed).toFixed(2);
                
                console.log(`Thay đổi bộ nhớ sau ${durationInSeconds} giây:`);
                console.log(`- RSS: ${finalRssDiff}MB (${finalRssDiff > 0 ? 'tăng' : 'giảm'})`);
                console.log(`- HeapUsed: ${finalHeapDiff}MB (${finalHeapDiff > 0 ? 'tăng' : 'giảm'})`);
                
                // Chạy GC lần cuối và hiển thị kết quả
                if (global.gc) {
                    console.log('\nChạy GC lần cuối...');
                    global.gc();
                    
                    setTimeout(() => {
                        const finalAfterGC = process.memoryUsage();
                        const finalRss = Math.round(finalAfterGC.rss / 1024 / 1024 * 100) / 100;
                        const finalHeapUsed = Math.round(finalAfterGC.heapUsed / 1024 / 1024 * 100) / 100;
                        
                        console.log(`Bộ nhớ cuối cùng sau GC: RSS=${finalRss}MB, HeapUsed=${finalHeapUsed}MB`);
                        console.log(`So với ban đầu: RSS=${(finalRss - initialMemory.rss).toFixed(2)}MB, HeapUsed=${(finalHeapUsed - initialMemory.heapUsed).toFixed(2)}MB`);
                        
                        if (finalRss > initialMemory.rss) {
                            console.log('\n⚠️ CẢNH BÁO: Có thể có memory leak vì RAM không giảm về mức ban đầu sau khi hoàn thành và chạy GC');
                            console.log('Hãy kiểm tra các tham chiếu vòng (circular references) hoặc các tài nguyên chưa được giải phóng đúng cách');
                        } else {
                            console.log('\n✓ OK: RAM đã giảm về mức ban đầu hoặc thấp hơn, không phát hiện memory leak rõ ràng');
                        }
                        console.log(v8.getHeapStatistics());
                        process.exit(0);
                    }, 500);
                } else {
                    console.log('\n⚠️ Không thể chạy GC thủ công. Hãy chạy Node với flag --expose-gc để kiểm tra hiệu quả hơn');
                    process.exit(0);
                }
            }
        } catch (e) {
            console.error('Lỗi khi kiểm tra bộ nhớ:', e);
        }
    }, 10000); // Kiểm tra mỗi 10 giây
    
    // Trả về hàm để dừng giám sát nếu cần
    return () => clearInterval(interval);
}
runDemo(1000, 50, 60);