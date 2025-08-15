const TikTokSocket = require('./src/tiktok.socket.js');

// Mock clone object để test
const mockClone = {
    username: 'test_user',
    browser_platform: 'Win32',
    last_rtt: '150',
    wrss: 'test_wrss_123',
    internal_ext: 'test_internal_ext',
    cursor: 'test_cursor_456',
    is_cookie_live: true,
    callApi: async (options) => {
        console.log('Mock callApi called with:', options.type);
        return { success: true };
    },
    fetch: async () => {
        console.log('Mock fetch called');
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

async function testTikTokSocket() {
    console.log('=== TESTING TIKTOK SOCKET ===\n');
    
    try {
        // Khởi tạo TikTokSocket
        console.log('1. Creating TikTokSocket instance...');
        const socket = new TikTokSocket(testConfig);
        console.log('✅ TikTokSocket created successfully');
        console.log('Session ID:', socket.sessionid);
        console.log('Message Builder:', socket.messageBuilder ? 'OK' : 'MISSING');
        
        // Test message builder functions
        console.log('\n2. Testing message builder functions...');
        const testRoomId = '7492405931744529173';
        
        // Test heartbeat message (theo chuẩn TikTok-Live-Connector-2025)
        const heartbeat = socket.messageBuilder.createHeartbeatMessage(testRoomId);
        console.log('✅ Heartbeat message (hex):', heartbeat.toString('hex'));
        console.log('   Length:', heartbeat.length, 'bytes');
        console.log('   Base64:', heartbeat.toString('base64'));
        
        // Test enter room message (theo chuẩn TikTok-Live-Connector-2025)
        const enterRoom = socket.messageBuilder.createEnterRoomMessage(testRoomId, {
            cursor: 'test_cursor_123',
            identity: 'audience',
            liveId: '12',
            accountType: '0'
        });
        console.log('✅ Enter room message (hex):', enterRoom.toString('hex'));
        console.log('   Length:', enterRoom.length, 'bytes'); 
        console.log('   Base64:', enterRoom.toString('base64'));
        
        // Test ACK message (theo đúng chuẩn WebcastPushFrame)
        const ack = socket.messageBuilder.createAckMessage('12345', '-');
        console.log('✅ ACK message (hex):', ack.toString('hex'));
        console.log('   Length:', ack.length, 'bytes');
        console.log('   Base64:', ack.toString('base64'));

        // Test Switch Room message
        const switchRoom = socket.messageBuilder.createSwitchRoomMessage(testRoomId, {
            cursor: 'switch_cursor_456',
            identity: 'audience'
        });
        console.log('✅ Switch Room message (hex):', switchRoom.toString('hex').substring(0, 60) + '...');
        console.log('   Length:', switchRoom.length, 'bytes');
        console.log('   Base64:', switchRoom.toString('base64'));

        // Test Ping/Pong messages
        const ping = socket.messageBuilder.createPingMessage();
        console.log('✅ Ping message (hex):', ping.toString('hex'));
        console.log('   Length:', ping.length, 'bytes');
        console.log('   Base64:', ping.toString('base64'));

        const pong = socket.messageBuilder.createPongMessage();
        console.log('✅ Pong message (hex):', pong.toString('hex'));
        console.log('   Length:', pong.length, 'bytes');
        console.log('   Base64:', pong.toString('base64'));

        // Test Chat message
        const chat = socket.messageBuilder.createChatMessage('Hello TikTok!', testRoomId);
        console.log('✅ Chat message (hex):', chat.toString('hex').substring(0, 60) + '...');
        console.log('   Length:', chat.length, 'bytes');
        console.log('   Base64:', chat.toString('base64'));


        // Test Leave Room message
        const leaveRoom = socket.messageBuilder.createLeaveRoomMessage(testRoomId);
        console.log('✅ Leave Room message (hex):', leaveRoom.toString('hex'));
        console.log('   Length:', leaveRoom.length, 'bytes');
        console.log('   Base64:', leaveRoom.toString('base64'));
        // Test URL creation
        console.log('\n3. Testing URL creation...');
        const url = socket.createUrl({ room_id: testRoomId });
        console.log('✅ WebSocket URL created');
        console.log('URL length:', url.length);
        console.log('Contains room_id:', url.includes(testRoomId) ? 'YES' : 'NO');
        console.log('Contains wrss:', url.includes('wrss=') ? 'YES' : 'NO');
        
        // Test proxy parsing
        console.log('\n4. Testing proxy parsing...');
        const proxyString = 'user:pass@proxy.com:8080';
        const proxyData = socket.parseProxy(proxyString);
        console.log('✅ Proxy parsed:', proxyData);
        
        // Test random string generation
        console.log('\n5. Testing utility functions...');
        const randomStr = socket.generateRandomString(43);
        console.log('✅ Random string (43 chars):', randomStr.length === 43 ? 'OK' : 'FAILED');
        
        console.log('\n=== ALL TESTS COMPLETED SUCCESSFULLY ===');
        console.log('TikTokSocket is ready for real connection!');
        
        return {
            success: true,
            socket: socket,
            testResults: {
                heartbeat: heartbeat.length,
                enterRoom: enterRoom.length,
                ack: ack.length,
                switchRoom: switchRoom.length,
                ping: ping.length,
                pong: pong.length,
                chat: chat.length,
                leaveRoom: leaveRoom.length,
                urlCreated: url.length > 0,
                proxyParsed: proxyData.proxy !== undefined
            }
        };
        
    } catch (error) {
        console.error('❌ TEST FAILED:', error.message);
        console.error('Stack:', error.stack);
        return {
            success: false,
            error: error.message
        };
    }
}

// Chạy test nếu file được gọi trực tiếp
if (require.main === module) {
    testTikTokSocket().then(result => {
        if (result.success) {
            console.log('\n🎉 Test completed successfully!');
            process.exit(0);
        } else {
            console.log('\n💥 Test failed!');
            process.exit(1);
        }
    });
}

module.exports = { testTikTokSocket }; 