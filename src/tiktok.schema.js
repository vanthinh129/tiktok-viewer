const { BinaryReader, BinaryWriter }  = require("@bufbuild/protobuf/wire")

const WebcastImEnterRoomMessage = {
    encode(message, writer = new BinaryWriter()) {
      if (message.roomId !== "0") {
        writer.uint32(8).int64(message.roomId);
      }
      if (message.roomTag !== "") {
        writer.uint32(18).string(message.roomTag);
      }
      if (message.liveRegion !== "") {
        writer.uint32(26).string(message.liveRegion);
      }
      if (message.liveId !== "0") {
        writer.uint32(32).int64(message.liveId);
      }
      if (message.identity !== "") {
        writer.uint32(42).string(message.identity);
      }
      if (message.cursor !== "") {
        writer.uint32(50).string(message.cursor);
      }
      if (message.accountType !== "0") {
        writer.uint32(56).int64(message.accountType);
      }
      if (message.enterUniqueId !== "0") {
        writer.uint32(64).int64(message.enterUniqueId);
      }
      if (message.filterWelcomeMsg !== "") {
        writer.uint32(74).string(message.filterWelcomeMsg);
      }
      if (message.isAnchorContinueKeepMsg !== false) {
        writer.uint32(80).bool(message.isAnchorContinueKeepMsg);
      }
      return writer;
    },
  
    decode(input, length) {
      const reader = input instanceof BinaryReader ? input : new BinaryReader(input);
      let end = length === undefined ? reader.len : reader.pos + length;
      const message = createBaseWebcastImEnterRoomMessage();
      while (reader.pos < end) {
        const tag = reader.uint32();
        switch (tag >>> 3) {
          case 1: {
            if (tag !== 8) {
              break;
            }
  
            message.roomId = reader.int64().toString();
            continue;
          }
          case 2: {
            if (tag !== 18) {
              break;
            }
  
            message.roomTag = reader.string();
            continue;
          }
          case 3: {
            if (tag !== 26) {
              break;
            }
  
            message.liveRegion = reader.string();
            continue;
          }
          case 4: {
            if (tag !== 32) {
              break;
            }
  
            message.liveId = reader.int64().toString();
            continue;
          }
          case 5: {
            if (tag !== 42) {
              break;
            }
  
            message.identity = reader.string();
            continue;
          }
          case 6: {
            if (tag !== 50) {
              break;
            }
  
            message.cursor = reader.string();
            continue;
          }
          case 7: {
            if (tag !== 56) {
              break;
            }
  
            message.accountType = reader.int64().toString();
            continue;
          }
          case 8: {
            if (tag !== 64) {
              break;
            }
  
            message.enterUniqueId = reader.int64().toString();
            continue;
          }
          case 9: {
            if (tag !== 74) {
              break;
            }
  
            message.filterWelcomeMsg = reader.string();
            continue;
          }
          case 10: {
            if (tag !== 80) {
              break;
            }
  
            message.isAnchorContinueKeepMsg = reader.bool();
            continue;
          }
        }
        if ((tag & 7) === 4 || tag === 0) {
          break;
        }
        reader.skip(tag & 7);
      }
      return message;
    },
  };
  

  function createBaseWebcastImEnterRoomMessage() {
    return {
      roomId: "0",
      roomTag: "",
      liveRegion: "",
      liveId: "0",
      identity: "",
      cursor: "",
      accountType: "0",
      enterUniqueId: "0",
      filterWelcomeMsg: "",
      isAnchorContinueKeepMsg: false,
    };
  }

  const WebcastPushFrame = {
    encode(message, writer = new BinaryWriter()) {
      if (message.seqId !== "0") {
        writer.uint32(8).int64(message.seqId);
      }
      if (message.logId !== "0") {
        writer.uint32(16).int64(message.logId);
      }
      if (message.service !== "0") {
        writer.uint32(24).int64(message.service);
      }
      if (message.method !== "0") {
        writer.uint32(32).int64(message.method);
      }
      Object.entries(message.headers).forEach(([key, value]) => {
        WebcastPushFrame_HeadersEntry.encode({ key: key, value }, writer.uint32(42).fork()).join();
      });
      if (message.payloadEncoding !== "") {
        writer.uint32(50).string(message.payloadEncoding);
      }
      if (message.payloadType !== "") {
        writer.uint32(58).string(message.payloadType);
      }
      if (message.payload.length !== 0) {
        writer.uint32(66).bytes(message.payload);
      }
      return writer;
    },
  
    decode(input, length) {
      const reader = input instanceof BinaryReader ? input : new BinaryReader(input);
      let end = length === undefined ? reader.len : reader.pos + length;
      const message = createBaseWebcastPushFrame();
      while (reader.pos < end) {
        const tag = reader.uint32();
        switch (tag >>> 3) {
          case 1: {
            if (tag !== 8) {
              break;
            }
  
            message.seqId = reader.int64().toString();
            continue;
          }
          case 2: {
            if (tag !== 16) {
              break;
            }
  
            message.logId = reader.int64().toString();
            continue;
          }
          case 3: {
            if (tag !== 24) {
              break;
            }
  
            message.service = reader.int64().toString();
            continue;
          }
          case 4: {
            if (tag !== 32) {
              break;
            }
  
            message.method = reader.int64().toString();
            continue;
          }
          case 5: {
            if (tag !== 42) {
              break;
            }
  
            const entry5 = WebcastPushFrame_HeadersEntry.decode(reader, reader.uint32());
            if (entry5.value !== undefined) {
              message.headers[entry5.key] = entry5.value;
            }
            continue;
          }
          case 6: {
            if (tag !== 50) {
              break;
            }
  
            message.payloadEncoding = reader.string();
            continue;
          }
          case 7: {
            if (tag !== 58) {
              break;
            }
  
            message.payloadType = reader.string();
            continue;
          }
          case 8: {
            if (tag !== 66) {
              break;
            }
  
            message.payload = reader.bytes();
            continue;
          }
        }
        if ((tag & 7) === 4 || tag === 0) {
          break;
        }
        reader.skip(tag & 7);
      }
      return message;
    },
  };
  const HeartbeatMessage= {
    encode(message, writer = new BinaryWriter()) {
      if (message.roomId !== "0") {
        writer.uint32(8).uint64(message.roomId);
      }
      return writer;
    },
  
    decode(input, length) {
      const reader = input instanceof BinaryReader ? input : new BinaryReader(input);
      let end = length === undefined ? reader.len : reader.pos + length;
      const message = createBaseHeartbeatMessage();
      while (reader.pos < end) {
        const tag = reader.uint32();
        switch (tag >>> 3) {
          case 1: {
            if (tag !== 8) {
              break;
            }
  
            message.roomId = reader.uint64().toString();
            continue;
          }
        }
        if ((tag & 7) === 4 || tag === 0) {
          break;
        }
        reader.skip(tag & 7);
      }
      return message;
    },
  };
  function createBaseWebcastPushFrame(overrides) {
    // Basically, we need to set it to "0" so that it DOES NOT send the field(s)
    const undefinedNum = '0';  

    overrides = Object.fromEntries(
        Object.entries(overrides).filter(([_, value]) => value !== undefined)
    );

    return WebcastPushFrame.encode(
        {
            seqId: undefinedNum,
            logId: undefinedNum,
            payloadEncoding: 'pb',
            payloadType: 'msg',
            payload: new Uint8Array(),
            service: undefinedNum,
            method: undefinedNum,
            headers: {},
            ...overrides
        }
    );

}

  
  module.exports = {
    WebcastImEnterRoomMessage,
    createBaseWebcastImEnterRoomMessage,
    WebcastPushFrame,
    createBaseWebcastPushFrame,
    HeartbeatMessage
  }