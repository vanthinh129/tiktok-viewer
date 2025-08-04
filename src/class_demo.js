

/**
 * Lớp Demo - Mẫu minh họa về cách tạo và sử dụng class trong JavaScript
 * Bao gồm: Constructor (khởi tạo), các phương thức thực thi, và phương thức hủy
 */
class Demo {
  /**
   * Thuộc tính tĩnh của class
   */
  static VERSION = '1.0.0';
  
  // Lưu trữ các timers và xử lý bất đồng bộ để có thể hủy khi cần thiết
  #timers = [];
  #eventListeners = [];
  #externalReferences = new WeakMap();
  
  /**
   * Constructor - Phương thức khởi tạo
   * @param {string} name Tên của đối tượng
   * @param {number} id ID của đối tượng
   */
  constructor(name, id) {
    // Các thuộc tính của đối tượng
    this.name = name;
    this.id = id;
    this.createdAt = new Date();
    this.isActive = false;
    this.resources = [];
    
    console.log(`[${this.getCurrentTime()}] - Đối tượng ${this.name} (ID: ${this.id}) đã được khởi tạo`);
  }
  
  /**
   * Getter - Lấy thông tin của đối tượng
   */
  get info() {
    return {
      name: this.name,
      id: this.id,
      createdAt: this.createdAt,
      isActive: this.isActive,
      runningTime: this.isActive ? (new Date() - this.startTime) / 1000 : 0
    };
  }
  
  /**
   * Phương thức lấy thời gian hiện tại
   * @returns {string} Thời gian dạng chuỗi
   */
  getCurrentTime() {
    const now = new Date();
    return now.toLocaleTimeString('vi-VN');
  }
  
  /**
   * Phương thức khởi chạy đối tượng
   */
  start() {
    if (this.isActive) {
      console.log(`[${this.getCurrentTime()}] - Đối tượng ${this.name} đã đang hoạt động`);
      return false;
    }
    
    this.isActive = true;
    this.startTime = new Date();
    console.log(`[${this.getCurrentTime()}] - Đối tượng ${this.name} đã bắt đầu hoạt động`);
    
    // Giả lập cấp phát tài nguyên
    this.allocateResources();
    
    return true;
  }
  
  /**
   * Phương thức cấp phát tài nguyên
   * @private
   */
  allocateResources() {
    // Giả lập việc cấp phát tài nguyên
    this.resources.push({
      type: 'memory',
      size: '100MB',
      allocatedAt: new Date()
    });
    
    console.log(`[${this.getCurrentTime()}] - Đã cấp phát tài nguyên cho đối tượng ${this.name}`);
  }
  
  /**
   * Phương thức thực thi công việc
   * @param {string} task Công việc cần thực hiện
   * @returns {Promise<string>} Kết quả công việc
   */
  async executeTask(task) {
    if (!this.isActive) {
      throw new Error('Đối tượng chưa được khởi động');
    }
    
    console.log(`[${this.getCurrentTime()}] - Đối tượng ${this.name} đang thực hiện: ${task}`);
    
    // Giả lập thời gian thực thi
    await this.delay(2000);
    
    console.log(`[${this.getCurrentTime()}] - Đối tượng ${this.name} đã hoàn thành: ${task}`);
    return `Kết quả của công việc: ${task}`;
  }
  
  /**
   * Phương thức trì hoãn
   * @param {number} ms Thời gian cần trì hoãn (milliseconds)
   * @returns {Promise<void>}
   */
  delay(ms) {
    return new Promise(resolve => {
      const timerId = setTimeout(() => {
        // Loại bỏ timer khỏi danh sách khi hoàn thành
        const index = this.#timers.indexOf(timerId);
        if (index > -1) {
          this.#timers.splice(index, 1);
        }
        resolve();
      }, ms);
      
      // Thêm timerId vào danh sách để có thể hủy nếu cần
      this.#timers.push(timerId);
    });
  }
  
  /**
   * Phương thức tạm dừng
   */
  pause() {
    if (!this.isActive) {
      console.log(`[${this.getCurrentTime()}] - Đối tượng ${this.name} đang không hoạt động`);
      return false;
    }
    
    console.log(`[${this.getCurrentTime()}] - Đối tượng ${this.name} đã tạm dừng`);
    this.pauseTime = new Date();
    this.isActive = false;
    return true;
  }
  
  /**
   * Phương thức tiếp tục
   */
  resume() {
    if (this.isActive) {
      console.log(`[${this.getCurrentTime()}] - Đối tượng ${this.name} đã đang hoạt động`);
      return false;
    }
    
    if (!this.pauseTime) {
      return this.start();
    }
    
    this.isActive = true;
    console.log(`[${this.getCurrentTime()}] - Đối tượng ${this.name} đã tiếp tục hoạt động`);
    this.pauseTime = null;
    return true;
  }
  
  /**
   * Phương thức dừng và hủy đối tượng
   */
  destroy() {
    console.log(`[${this.getCurrentTime()}] - Đang hủy đối tượng ${this.name}...`);
    
    // 1. Hủy tất cả các timers đang chạy
    this.#timers.forEach(timerId => {
      clearTimeout(timerId);
    });
    this.#timers = [];
    
    // 2. Gỡ bỏ tất cả event listeners (nếu có)
    this.#eventListeners.forEach(listener => {
      const { target, event, callback } = listener;
      if (target && typeof target.removeEventListener === 'function') {
        target.removeEventListener(event, callback);
      }
    });
    this.#eventListeners = [];
    
    // 3. Giải phóng tài nguyên
    this.releaseResources();
    
    // 4. Đặt các thuộc tính phức tạp về null
    this.isActive = false;
    this.startTime = null;
    this.pauseTime = null;
    this.resources = null;
    this.createdAt = null;
    
    // 5. Thông báo rác có thể được thu gom
    if (global.gc) {
      console.log(`[${this.getCurrentTime()}] - Yêu cầu garbage collector chạy...`);
      global.gc();
    }
    
    console.log(`[${this.getCurrentTime()}] - Đối tượng ${this.name} đã được hủy thành công`);
    
    // Trả về null để giúp GC dễ dàng thu gom
    return null;
  }
  
  /**
   * Đăng ký sự kiện để có thể gỡ bỏ sau này
   * @param {EventTarget} target Đối tượng nhận sự kiện
   * @param {string} event Tên sự kiện
   * @param {Function} callback Hàm xử lý
   */
  registerEventListener(target, event, callback) {
    if (target && typeof target.addEventListener === 'function') {
      target.addEventListener(event, callback);
      this.#eventListeners.push({ target, event, callback });
    }
  }
  
  /**
   * Phương thức giải phóng tài nguyên
   * @private
   */
  releaseResources() {
    if (this.resources && this.resources.length > 0) {
      console.log(`[${this.getCurrentTime()}] - Đang giải phóng ${this.resources.length} tài nguyên...`);
      
      // Giải phóng từng tài nguyên cụ thể nếu cần
      this.resources.forEach(resource => {
        // Xử lý giải phóng từng loại tài nguyên cụ thể
        if (resource.type === 'memory' && resource.release) {
          resource.release();
        }
        
        // Đánh dấu tài nguyên đã được giải phóng
        resource = null;
      });
      
      this.resources = [];
    }
  }
}

// Ví dụ cách sử dụng class
async function demoDemoClass() {
  console.log(`Phiên bản Demo: ${Demo.VERSION}`);
  
  // Khởi tạo đối tượng
  let demo = new Demo('DemoObject', 123);
  
  // Khởi động đối tượng
  demo.start();
  
  try {
    // Truy cập thông tin đối tượng
    console.log('Thông tin đối tượng:', demo.info);
    
    // Thực thi một công việc
    const result = await demo.executeTask('Xử lý dữ liệu');
    console.log('Kết quả:', result);
    
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
            
            console.log(`Memory: ${currentRss} MB | Heap: ${heapUsed}/${heapTotal} MB | Change: ${increase.toFixed(2)} MB`);
            
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
            console.log(`\n--- Batch ${Math.floor(i/batchSize) + 1} ---`);
            const currentBatchSize = Math.min(batchSize, totalObjects - i);
            const batchPromises = [];
            
            // Tạo batch hiện tại
            for (let j = 0; j < currentBatchSize; j++) {
                batchPromises.push(demoDemoClass());
            }
            
            // Đợi batch hiện tại hoàn thành trước khi chạy batch tiếp theo
            await Promise.all(batchPromises);
            
            console.log(`Hoàn thành batch ${Math.floor(i/batchSize) + 1}`);
            
            // Chạy GC sau mỗi batch nếu có thể
            if (global.gc) {
                console.log('Chạy garbage collector sau batch...');
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
            console.log('Chạy garbage collector lần cuối...');
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
            
            console.log(`[Kiểm tra #${checkCount} - ${elapsedSeconds}s] RSS: ${currentRss}MB (${rssDiff}MB), ` +`Heap: ${heapUsed}/${heapTotal}MB (${heapUsedDiff}MB), External: ${external}MB`);
            
            // Chạy GC mỗi 5 lần kiểm tra (50 giây) để xem sự thay đổi
            if (checkCount % 5 === 0 && global.gc) {
                console.log('>> Chạy GC thủ công để kiểm tra hiệu quả...');
                global.gc();
                
                // Kiểm tra bộ nhớ sau khi chạy GC
                setTimeout(() => {
                    const afterGC = process.memoryUsage();
                    const rssAfterGC = Math.round(afterGC.rss / 1024 / 1024 * 100) / 100;
                    const heapUsedAfterGC = Math.round(afterGC.heapUsed / 1024 / 1024 * 100) / 100;
                    console.log(`>> Sau GC: RSS=${rssAfterGC}MB (-${(currentRss - rssAfterGC).toFixed(2)}MB), ` +`HeapUsed=${heapUsedAfterGC}MB (-${(heapUsed - heapUsedAfterGC).toFixed(2)}MB)`);
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

// Chạy demo
// Để kích hoạt Garbage Collector thủ công, chạy Node với flag: node --expose-gc class_demo.js
if (require.main === module) {
    // runDemo(10, 50, 120);  // 10 objects per batch, 50 objects total, theo dõi thêm 120 giây sau khi hoàn thành
}

// Export class cho các module khác sử dụng
module.exports = Demo;