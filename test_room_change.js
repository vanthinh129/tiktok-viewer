const TikTokSocket = require('./src/tiktok.socket.js');
const fs = require('fs');

// Mock clone object 
const mockClone = {
    username: 'test_user',
    browser_platform: 'Win32', 
    last_rtt: '150',
    wrss: 'test_wrss_123',
    internal_ext: 'test_internal_ext',
    cursor: 'test_cursor_456',
    is_cookie_live: true,
    room_id: '7492405931744529173',
    callApi: async (options) => {
        console.log('Mock callApi called with:', options.type, 'for room:', mockClone.room_id);
        return { success: true };
    },
    fetch: async () => {
        console.log('Mock fetch called for room:', mockClone.room_id);
        return { success: true };
    }
};

// Test configuration
const testConfig = {
    cookie_string: 'sessionid=test123; proxy_socket=test.proxy.com:8080',
    proxy_string: null,
    useragent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    isShowComment: true,
    onMessage: (message) => {
        console.log('Message received:', message);
    },
    isShowLog: true,
    reconnect_after_time: 30000,
    task_id: 'test_task_001',
    server_site: 'tt1',
    wrss: 'test_wrss',
    clone: mockClone
};

async function testRoomChange() {
    console.log('=== TESTING ROOM CHANGE FUNCTIONALITY ===\n');
    
    // Create test room change file
    const roomChangeData = {
        "7492405931744529173": "7492405931744529999",
        "1234567890": "9876543210"
    };
    
    fs.writeFileSync('./room_change_check.json', JSON.stringify(roomChangeData, null, 2));
    console.log('✅ Created test room_change_check.json file');
    
    try {
        // Initialize TikTokSocket
        console.log('\n1. Creating TikTokSocket instance...');
        const socket = new TikTokSocket(testConfig);
        console.log('✅ TikTokSocket created successfully');
        
        // Test checkRoomChange method
        console.log('\n2. Testing room change detection...');
        const originalRoom = '7492405931744529173';
        const newRoom = await socket.checkRoomChange(originalRoom);
        
        if(newRoom) {
            console.log(`✅ Room change detected: ${originalRoom} -> ${newRoom}`);
        } else {
            console.log('❌ No room change detected');
        }
        
        // Test with non-existing room
        const noChangeRoom = await socket.checkRoomChange('9999999999');
        if(!noChangeRoom) {
            console.log('✅ Correctly returned null for room with no changes');
        }
        
        // Test switch room message creation
        console.log('\n3. Testing switch room message...');
        const switchRoomMsg = socket.messageBuilder.createSwitchRoomMessage(newRoom || originalRoom, {
            cursor: 'test_switch_cursor',
            identity: 'audience'
        });
        
        console.log('✅ Switch room message created');
        console.log('   Hex:', switchRoomMsg.toString('hex').substring(0, 60) + '...');
        console.log('   Length:', switchRoomMsg.length, 'bytes');
        console.log('   Base64:', switchRoomMsg.toString('base64').substring(0, 60) + '...');
        
        // Test room change monitoring methods
        console.log('\n4. Testing room change monitoring...');
        console.log('✅ Starting room change monitoring (5 second interval)...');
        socket.startRoomChangeMonitoring(originalRoom, 5000);
        
        console.log('✅ Current room ID:', socket.getCurrentRoomId());
        
        // Test manual check
        console.log('✅ Testing manual room change check...');
        const manualCheckResult = await socket.forceCheckRoomChange();
        if(manualCheckResult) {
            console.log(`✅ Manual check detected change to: ${manualCheckResult}`);
        } else {
            console.log('✅ Manual check found no changes');
        }
        
        // Simulate some time passing
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        console.log('✅ Stopping room change monitoring...');
        socket.stopRoomChangeMonitoring();
        
        console.log('✅ Final current room ID:', socket.getCurrentRoomId());
        
        // Test that processed entries are removed from file
        console.log('\n5. Testing processed entry removal...');
        if(fs.existsSync('./room_change_check.json')) {
            const currentData = JSON.parse(fs.readFileSync('./room_change_check.json', 'utf8'));
            console.log('✅ Remaining entries in room_change_check.json:', Object.keys(currentData).length);
            console.log('   Entries:', JSON.stringify(currentData, null, 2));
        } else {
            console.log('✅ room_change_check.json file removed');
        }
        
        console.log('\n=== ROOM CHANGE TEST COMPLETED ===');
        return true;
        
    } catch (error) {
        console.error('❌ Room change test failed:', error.message);
        return false;
    } finally {
        // Cleanup
        if(fs.existsSync('./room_change_check.json')) {
            fs.unlinkSync('./room_change_check.json');
            console.log('🧹 Cleaned up test file');
        }
    }
}

// Create sample room_change_check.json for manual testing
function createSampleRoomChangeFile() {
    const sampleData = {
        "7492405931744529173": "7492405931744529999",
        "1111111111111111111": "2222222222222222222",
        "example_old_room_id": "example_new_room_id"
    };
    
    fs.writeFileSync('./room_change_check_sample.json', JSON.stringify(sampleData, null, 2));
    console.log('📁 Created room_change_check_sample.json for manual testing');
    console.log('   To use: rename to room_change_check.json');
}

// Run test if called directly
if (require.main === module) {
    testRoomChange().then(result => {
        if (result) {
            console.log('\n🎉 Room change test completed successfully!');
            createSampleRoomChangeFile();
        } else {
            console.log('\n💥 Room change test failed!');
        }
    }).catch(console.error);
}

module.exports = { testRoomChange, createSampleRoomChangeFile }; 