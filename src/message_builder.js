const crypto = require('crypto');

class TikTokMessageBuilder {
    constructor() {
        this.seqId = 1;
    }

    // Encode varint (protobuf encoding) - hỗ trợ BigInt
    encodeVarint(value) {
        // Convert to BigInt if needed
        if (typeof value === 'string') {
            value = BigInt(value);
        } else if (typeof value === 'number') {
            value = BigInt(value);
        }
        
        const result = [];
        while (value >= 0x80n) {
            result.push(Number(value & 0xFFn) | 0x80);
            value >>= 7n;
        }
        result.push(Number(value & 0xFFn));
        return Buffer.from(result);
    }

    // Encode string with length prefix
    encodeString(str) {
        const strBuf = Buffer.from(str, 'utf8');
        return Buffer.concat([this.encodeVarint(strBuf.length), strBuf]);
    }

    // Tạo HeartbeatMessage theo protobuf structure (roomId as varint)
    createHeartbeatPayload(roomId) {
        // console.log('Creating HeartbeatMessage payload for room:', roomId);
        
        // HeartbeatMessage { roomId: int64 }
        // Field 1: roomId (tag 1, wire type 0 - varint)
        const roomIdField = Buffer.concat([
            Buffer.from([0x08]), // tag 1, wire type 0
            this.encodeVarint(roomId) // Pass as string, encodeVarint will handle BigInt conversion
        ]);
        
        return roomIdField;
    }

    // Tạo WebcastImEnterRoomMessage theo protobuf structure  
    createEnterRoomPayload(roomId, options = {}) {
        // console.log('Creating WebcastImEnterRoomMessage payload for room:', roomId);
        
        const {
            liveId = '12',
            identity = 'audience', 
            cursor = '',
            accountType = '0',
            roomTag = '',
            liveRegion = '',
            enterUniqueId = '',
            filterWelcomeMsg = '0',
            isAnchorContinueKeepMsg = false
        } = options;

        let fields = [];

        // Field 1: roomId (tag 1, wire type 0 - varint int64)
        fields.push(Buffer.concat([
            Buffer.from([0x08]), // tag 1, wire type 0
            this.encodeVarint(roomId)
        ]));

        // Field 2: roomTag (tag 2, wire type 2 - string) - if not empty
        if (roomTag) {
            fields.push(Buffer.concat([
                Buffer.from([0x12]), // tag 2, wire type 2
                this.encodeString(roomTag)
            ]));
        }

        // Field 3: liveRegion (tag 3, wire type 2 - string) - if not empty
        if (liveRegion) {
            fields.push(Buffer.concat([
                Buffer.from([0x1a]), // tag 3, wire type 2
                this.encodeString(liveRegion)
            ]));
        }

        // Field 4: liveId (tag 4, wire type 0 - varint int64)
        fields.push(Buffer.concat([
            Buffer.from([0x20]), // tag 4, wire type 0
            this.encodeVarint(liveId)
        ]));

        // Field 5: identity (tag 5, wire type 2 - string)
        fields.push(Buffer.concat([
            Buffer.from([0x2a]), // tag 5, wire type 2
            this.encodeString(identity)
        ]));

        // Field 6: cursor (tag 6, wire type 2 - string) - if not empty
        if (cursor) {
            fields.push(Buffer.concat([
                Buffer.from([0x32]), // tag 6, wire type 2
                this.encodeString(cursor)
            ]));
        }

        // Field 7: accountType (tag 7, wire type 0 - varint int64)
        fields.push(Buffer.concat([
            Buffer.from([0x38]), // tag 7, wire type 0
            this.encodeVarint(accountType)
        ]));

        // Field 8: enterUniqueId (tag 8, wire type 0 - varint int64) - if not "0"
        if (enterUniqueId && enterUniqueId !== '0') {
            fields.push(Buffer.concat([
                Buffer.from([0x40]), // tag 8, wire type 0
                this.encodeVarint(enterUniqueId)
            ]));
        }

        // Field 9: filterWelcomeMsg (tag 9, wire type 2 - string)
        fields.push(Buffer.concat([
            Buffer.from([0x4a]), // tag 9, wire type 2
            this.encodeString(filterWelcomeMsg)
        ]));

        // Field 10: isAnchorContinueKeepMsg (tag 10, wire type 0 - bool)
        if (isAnchorContinueKeepMsg) {
            fields.push(Buffer.concat([
                Buffer.from([0x50]), // tag 10, wire type 0
                this.encodeVarint(isAnchorContinueKeepMsg ? 1 : 0)
            ]));
        }

        return Buffer.concat(fields);
    }

    // Tạo WebcastPushFrame wrapper (đúng theo TikTok-Live-Connector-2025)
    createWebcastPushFrame(payloadType, payload, options = {}) {
        // console.log(`Creating WebcastPushFrame for type: ${payloadType}`);
        
        const {
            seqId = '0',
            logId = '0',
            service = '0',
            method = '0',
            headers = {}
        } = options;

        let fields = [];

        // Field 1: seqId (tag 1, wire type 0 - varint) - only if not "0"
        if (seqId !== '0') {
            fields.push(Buffer.concat([
                Buffer.from([0x08]), // tag 1, wire type 0 
                this.encodeVarint(parseInt(seqId))
            ]));
        }

        // Field 2: logId (tag 2, wire type 0 - varint) - only if not "0"
        if (logId !== '0') {
            fields.push(Buffer.concat([
                Buffer.from([0x10]), // tag 2, wire type 0
                this.encodeVarint(parseInt(logId))
            ]));
        }

        // Field 3: service (tag 3, wire type 0 - varint) - only if not "0"
        if (service !== '0') {
            fields.push(Buffer.concat([
                Buffer.from([0x18]), // tag 3, wire type 0
                this.encodeVarint(parseInt(service))
            ]));
        }

        // Field 4: method (tag 4, wire type 0 - varint) - only if not "0"
        if (method !== '0') {
            fields.push(Buffer.concat([
                Buffer.from([0x20]), // tag 4, wire type 0
                this.encodeVarint(parseInt(method))
            ]));
        }

        // Field 5: headers (tag 5, wire type 2) - skip for now as usually empty

        // Field 6: payloadEncoding (tag 6, wire type 2)
        fields.push(Buffer.concat([
            Buffer.from([0x32]), // tag 6, wire type 2
            this.encodeString('pb')
        ]));

        // Field 7: payloadType (tag 7, wire type 2)  
        fields.push(Buffer.concat([
            Buffer.from([0x3a]), // tag 7, wire type 2
            this.encodeString(payloadType)
        ]));

        // Field 8: payload (tag 8, wire type 2)
        if (payload && payload.length > 0) {
            fields.push(Buffer.concat([
                Buffer.from([0x42]), // tag 8, wire type 2
                this.encodeVarint(payload.length),
                payload
            ]));
        }

        return Buffer.concat(fields);
    }

    // Tạo heartbeat message hoàn chỉnh
    createHeartbeatMessage(roomId) {
        // console.log('Creating complete heartbeat message for room:', roomId);
        
        // 1. Tạo HeartbeatMessage payload
        const heartbeatPayload = this.createHeartbeatPayload(roomId);
        
        // 2. Wrap trong WebcastPushFrame
        const webcastFrame = this.createWebcastPushFrame('hb', heartbeatPayload);
        
        // console.log('Heartbeat message created');
        return webcastFrame;
    }

    // Tạo enter room message hoàn chỉnh
    createEnterRoomMessage(roomId, options = {}) {
        // console.log('Creating complete enter room message for room:', roomId);
        
        // 1. Tạo WebcastImEnterRoomMessage payload
        const enterRoomPayload = this.createEnterRoomPayload(roomId, options);
        
        // 2. Wrap trong WebcastPushFrame
        const webcastFrame = this.createWebcastPushFrame('im_enter_room', enterRoomPayload);
        
        // console.log('Enter room message created');
        return webcastFrame;
    }

    // Tạo switch room message (experimental)
    createSwitchRoomMessage(roomId, options = {}) {
        // console.log('Creating switch room message for room:', roomId);
        
        // Tương tự enter room nhưng có thể có options khác
        return this.createEnterRoomMessage(roomId, options);
    }

    // Tạo ACK message theo đúng WebcastPushFrame structure
    createAckMessage(logId, internalExt = '-') {
        if (!logId) return null;
        
        // console.log('Creating ACK message for logId:', logId);
        
        // ACK payload chỉ là internalExt string
        const ackPayload = Buffer.from(internalExt, 'utf8');
        
        // Wrap trong WebcastPushFrame với logId
        const ackFrame = this.createWebcastPushFrame('ack', ackPayload, {
            logId: logId
        });
        
        // console.log('ACK message created');
        return ackFrame;
    }

    // Tạo ping/pong message
    createPingMessage() {
        // console.log('Creating ping message');
        
        // Simple ping message - chỉ có WebcastPushFrame với payload rỗng
        const pingFrame = this.createWebcastPushFrame('ping', Buffer.alloc(0));
        
        // console.log('Ping message created');
        return pingFrame;
    }

    // Tạo pong response
    createPongMessage() {
        // console.log('Creating pong message');
        
        const pongFrame = this.createWebcastPushFrame('pong', Buffer.alloc(0));
        
        // console.log('Pong message created');
        return pongFrame;
    }

    // Tạo message cho chat/comment
    createChatMessage(content, roomId) {
        // console.log('Creating chat message:', content);
        
        // WebcastChatMessage structure - tạm thời đơn giản
        const chatPayload = Buffer.concat([
            Buffer.from([0x0a]), // tag 1 - content string
            this.encodeString(content),
            Buffer.from([0x10]), // tag 2 - roomId varint  
            this.encodeVarint(roomId)
        ]);
        
        const chatFrame = this.createWebcastPushFrame('chat', chatPayload);
        
        // console.log('Chat message created');
        return chatFrame;
    }

    // Tạo message leave room
    createLeaveRoomMessage(roomId) {
        // console.log('Creating leave room message for room:', roomId);
        
        // WebcastLeaveRoomMessage - đơn giản chỉ có roomId
        const leavePayload = Buffer.concat([
            Buffer.from([0x08]), // tag 1, wire type 0
            this.encodeVarint(roomId)
        ]);
        
        const leaveFrame = this.createWebcastPushFrame('im_leave_room', leavePayload);
        
        // console.log('Leave room message created');
        return leaveFrame;
    }
}

module.exports = { TikTokMessageBuilder }; 