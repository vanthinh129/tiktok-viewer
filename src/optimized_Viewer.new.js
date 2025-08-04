/**
 * File: optimized_Viewer.new.js
 * Phiên bản tối ưu của Viewer.new.js
 * Giải quyết vấn đề rò rỉ bộ nhớ và cải thiện hiệu suất
 */

const helper = require("./helper.js");
const OptimizedClone = require("./optimized_Clone.fetch4.js"); // Sử dụng phiên bản tối ưu
const path = require('path');
const RabbitMQ = require(path.resolve("RabbitMQ.lib"));

// Tối ưu quản lý bộ nhớ với WeakMap
const viewerData = new Map(); // Lưu trữ dữ liệu task
let data_local = {};
let is_running = true;

// Giới hạn kích thước danh sách để tránh tràn bộ nhớ
const MAX_LIST_SIZE = 1000;
let list_403_total = [];
let list_die_total = [];

// Quyết định thời gian kiểm tra viewer
const CHECK_VIEWER_INTERVAL = 20000; // 20 giây

// Kiểm soát RabbitMQ
let rabbitServiceInstance = null;
const getRabbitService = async () => {
  if (!rabbitServiceInstance) {
    try {
      rabbitServiceInstance = await RabbitMQ.getInstance({
        url: "amqp://bupmat:bupmat@185.190.140.88:5672/" + data_local.server_site + "?heartbeat=60"
      });
    } catch (err) {
      console.error("Error creating RabbitMQ instance:", err);
      throw err;
    }
  }
  return rabbitServiceInstance;
};

/**
 * Giới hạn kích thước của danh sách
 * @param {Array} list - Danh sách cần giới hạn
 * @param {number} maxSize - Kích thước tối đa
 * @returns {Array} - Danh sách sau khi giới hạn
 */
const limitListSize = (list, maxSize = MAX_LIST_SIZE) => {
  if (list && list.length > maxSize) {
    return list.slice(-maxSize);
  }
  return list;
};

/**
 * Class quản lý nhóm viewers
 */
class OptimizedGroupView {
  constructor() {
    this.monitoringTasks = new Set(); // Theo dõi task đang được giám sát
    this.viewerCheckRunning = false;
  }
  
  /**
   * Lưu trữ dữ liệu local
   * @param {string} key - Khóa dữ liệu
   * @param {any} value - Giá trị cần lưu
   */
  static setdatelocal(key, value) {
    data_local[key] = value;
  }
  
  /**
   * Lấy dữ liệu local
   * @param {string} key - Khóa dữ liệu
   * @returns {any} Giá trị được lưu trữ
   */
  static getdatelocal(key) {
    return data_local[key];
  }
  
  /**
   * Kiểm tra định kỳ viewers bị 403
   */
  static async checkViewer403() {
    // Tránh chạy nhiều instance cùng lúc
    if (this.viewerCheckRunning) return;
    this.viewerCheckRunning = true;
    
    while (is_running) {
      try {
        await helper.delay(CHECK_VIEWER_INTERVAL);
        
        let total = 0;
        let fetch_403 = 0;
        let list_403 = [];
        let list_die = [];
        
        // Thu thập thông tin từ tất cả task
        for (const [task_id, taskData] of viewerData.entries()) {
          const sockets = taskData.sockets || [];
          
          for (const item of sockets) {
            total++;
            
            // Kiểm tra viewer 403
            if (item.status_viewer === 4 && !list_403_total.includes(item.session_id)) {
              list_403.push(item.session_id);
              list_403_total.push(item.session_id);
              fetch_403++;
            }
            
            // Kiểm tra viewer die
            if (item.status_viewer === 3 && !list_die_total.includes(item.session_id)) {
              list_die.push(item.session_id);
              list_die_total.push(item.session_id);
            }
          }
        }
        
        // Giới hạn kích thước danh sách để tránh tràn bộ nhớ
        list_403_total = limitListSize(list_403_total);
        list_die_total = limitListSize(list_die_total);
        
        // Gửi thông báo nếu có account 403
        if (list_403.length > 0) {
          console.log("list_403", list_403.length);
          await OptimizedGroupView.send403Rabbit(list_403, "update_account_403");
        }
        
        // Gửi thông báo nếu có account die
        if (list_die.length > 0) {
          console.log("list_die", list_die.length);
          await OptimizedGroupView.send403Rabbit(list_die, "update_account_die");
        }
        
        // Force garbage collection định kỳ nếu có thể
        if (global.gc && total > 100) {
          try {
            global.gc();
          } catch (e) {}
        }
        
      } catch (e) {
        console.error("checkViewer403 error", e);
        await helper.delay(5000); // Đợi 5 giây trước khi thử lại nếu có lỗi
      }
    }
    
    this.viewerCheckRunning = false;
  }
  
  /**
   * Khởi động các viewer với proxy cho một group
   */
  static startProxyGroupViewers({ accounts, task_id, proxy, room_id }) {
    try {
      accounts.forEach(async (cookie_string, index) => {
        // Xử lý proxy trong cookie
        let p = helper.getString(cookie_string + ";", "proxy=", ";");
        if (p && proxy) {
          cookie_string = cookie_string.replace("proxy=" + p, "");
          cookie_string += ";proxy=" + proxy;
        }
        
        const proxy_list = [p];
        
        // Tạo clone và khởi động
        const clone = new OptimizedClone({
          cookie_string,
          room_id,
          proxy: proxy || p,
          proxy_list
        });
        
        clone.run();
        
        // Thêm vào danh sách sockets
        if (!viewerData.has(task_id)) {
          viewerData.set(task_id, { sockets: [] });
        }
        
        viewerData.get(task_id).sockets.push(clone);
      });
    } catch (e) {
      console.error("startProxyGroupViewers error", e, (new Date().toLocaleString()));
    }
    
    // Khởi động giám sát viewers 403
    if (!this.viewerCheckRunning) {
      OptimizedGroupView.checkViewer403();
    }
  }
  
  /**
   * Khởi động viewers cho một task
   */
  static async startViewers({ accounts, task_id, proxy, room_id }) {
    try {
      console.log("Start task_id:", task_id, " room:", room_id, " accounts:", accounts.length);
      
      // Tạo mới hoặc reset task data
      if (viewerData.has(task_id)) {
        // Hủy các sockets cũ nếu có
        const oldSockets = viewerData.get(task_id).sockets || [];
        for (const socket of oldSockets) {
          await socket.cancel();
        }
      }
      
      viewerData.set(task_id, { sockets: [] });
      
      // Nhóm accounts theo proxy
      const grouped_proxy = accounts.reduce((pre, cur) => {
        const p = helper.getString(cur + ";", "proxy=", ";");
        return { ...pre, [p]: pre[p] ? [...pre[p], cur] : [cur] };
      }, {});
      
      // Khởi động từng nhóm
      for (const proxy_key in grouped_proxy) {
        OptimizedGroupView.startProxyGroupViewers({
          accounts: grouped_proxy[proxy_key],
          task_id,
          proxy,
          room_id
        });
      }
      
      // Đảm bảo giám sát viewers
      OptimizedGroupView.monitorMemoryUsage();
      
    } catch (e) {
      console.error("startViewers error", e, (new Date().toLocaleString()));
    }
  }
  
  /**
   * Giám sát sử dụng bộ nhớ
   * @private
   */
  static monitorMemoryUsage() {
    // Chỉ chạy một lần
    if (this.memoryMonitorRunning) return;
    this.memoryMonitorRunning = true;
    
    const MEMORY_CHECK_INTERVAL = 60000; // 1 phút
    
    setInterval(() => {
      try {
        if (global.gc) {
          const before = process.memoryUsage();
          global.gc();
          const after = process.memoryUsage();
          
          console.log(`Memory usage: ${Math.round(after.heapUsed / 1024 / 1024)} MB, freed: ${Math.round((before.heapUsed - after.heapUsed) / 1024 / 1024)} MB`);
          
          // Kiểm tra rò rỉ bộ nhớ
          if (after.heapUsed > 800 * 1024 * 1024) { // 800MB
            console.warn("High memory usage detected, cleaning up resources");
            this.emergencyCleanup();
          }
        }
      } catch (e) {
        console.error("Memory monitoring error:", e);
      }
    }, MEMORY_CHECK_INTERVAL);
  }
  
  /**
   * Thực hiện dọn dẹp khẩn cấp khi sử dụng bộ nhớ cao
   * @private
   */
  static emergencyCleanup() {
    try {
      // Đếm số lượng task và sockets
      let totalSockets = 0;
      const taskIds = [];
      
      for (const [task_id, taskData] of viewerData.entries()) {
        taskIds.push(task_id);
        totalSockets += (taskData.sockets ? taskData.sockets.length : 0);
      }
      
      console.log(`Emergency cleanup: ${taskIds.length} tasks, ${totalSockets} sockets`);
      
      // Giới hạn các danh sách
      list_403_total = limitListSize(list_403_total, MAX_LIST_SIZE / 2);
      list_die_total = limitListSize(list_die_total, MAX_LIST_SIZE / 2);
      
      // Force GC
      if (global.gc) {
        global.gc();
      }
    } catch (e) {
      console.error("Error in emergency cleanup:", e);
    }
  }
  
  /**
   * Cập nhật proxy cho các viewers
   */
  static async updateProxy({ data_proxy }) {
    try {
      for (const [task_id, taskData] of viewerData.entries()) {
        const sockets = taskData.sockets || [];
        
        for (let i = 0; i < sockets.length; i++) {
          if (sockets[i].status === "running") {
            const p = helper.getString(sockets[i].cookie_string + ";", "proxy=", ";");
            
            if (p && data_proxy[p]) {
              sockets[i].proxy = data_proxy[p];
              sockets[i].proxy_list = [data_proxy[p]];
            }
          }
        }
      }
    } catch (e) {
      console.error("updateProxy error", e, (new Date().toLocaleString()));
    }
  }
  
  /**
   * Dừng viewers cho một task
   */
  static async stopViewers({ task_id }) {
    console.log("Stop -- task_id:", task_id);
    
    try {
      if (viewerData.has(task_id)) {
        const sockets = viewerData.get(task_id).sockets || [];
        
        // Dừng từng socket
        for (let i = 0; i < sockets.length; i++) {
          await sockets[i].cancel();
        }
        
        // Xóa dữ liệu task
        viewerData.get(task_id).sockets = [];
        viewerData.delete(task_id);
        
        // Force GC nếu có
        if (global.gc) {
          try {
            global.gc();
            console.log(`Memory freed after stopping task ${task_id}`);
          } catch (e) {}
        }
      }
    } catch (e) {
      console.error("stopViewers error", e, (new Date().toLocaleString()));
    }
  }
  
  /**
   * Gửi thông tin account 403/die qua RabbitMQ
   */
  static async send403Rabbit(list_403, action = "update_account_403") {
    try {
      const rabbitService = await getRabbitService();
      
      if (list_403 && list_403.length) {
        const message = {
          "action": action,
          "accounts": list_403,
          time_now: Date.now()
        };
        
        await rabbitService.sendMessage("rabbit_cron", message);
      }
    } catch (error) {
      console.error("error handleSendRabbit", error);
    }
  }
  
  /**
   * Dọn dẹp tất cả tài nguyên
   */
  static cleanup() {
    is_running = false;
    
    return new Promise(async (resolve) => {
      try {
        // Dừng tất cả tasks
        const taskIds = [...viewerData.keys()];
        
        for (const task_id of taskIds) {
          await OptimizedGroupView.stopViewers({ task_id });
        }
        
        // Xóa tất cả dữ liệu
        viewerData.clear();
        list_403_total = [];
        list_die_total = [];
        
        // Force GC
        if (global.gc) {
          global.gc();
        }
        
        resolve(true);
      } catch (err) {
        console.error("Error during cleanup:", err);
        resolve(false);
      }
    });
  }
  
  /**
   * Lấy danh sách tất cả sockets trong một task
   * @param {string} task_id - ID của task
   * @returns {Array} Danh sách sockets
   */
  static getTaskSockets(task_id) {
    if (viewerData.has(task_id)) {
      return viewerData.get(task_id).sockets || [];
    }
    return [];
  }
  
  /**
   * Lấy tất cả tasks hiện tại
   * @returns {Array} Danh sách task IDs
   */
  static getAllTasks() {
    return [...viewerData.keys()];
  }
  
  /**
   * Lấy thống kê về viewer
   * @returns {Object} Thống kê các viewers
   */
  static getStats() {
    let totalViewers = 0;
    let activeViewers = 0;
    let dieViewers = 0;
    let errorViewers = 0;
    let tasks = 0;
    
    for (const [task_id, taskData] of viewerData.entries()) {
      tasks++;
      const sockets = taskData.sockets || [];
      
      for (const socket of sockets) {
        totalViewers++;
        
        if (socket.status === "running") activeViewers++;
        if (socket.status_viewer === 3) dieViewers++;
        if (socket.status_viewer === 2 || socket.status_viewer === 4) errorViewers++;
      }
    }
    
    return {
      totalViewers,
      activeViewers,
      dieViewers,
      errorViewers,
      tasks,
      list_403_count: list_403_total.length,
      list_die_count: list_die_total.length
    };
  }
}

module.exports = OptimizedGroupView;