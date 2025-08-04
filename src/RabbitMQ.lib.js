const amqp = require('amqp-connection-manager')
const path = require('path');
const helper = require(path.resolve('./helper'));
var config = {};//require(path.resolve('bupmat_config'));

class RabbitMQ {
  static isInitialized
  static instance
  constructor(configs) {
    this.consumers = []
    this.connected = false;
    this.configs = configs
    this.connection = null
    this.channel = null
    this.onDisconnect = null
    this.defaultConfig = {
      url: "amqp://bupmat:bupmat@185.190.140.88:5672",
      type: 'direct',
      exchangeName: 'bupmat_exchange',
      durable: true
    }
  }
  /**
   * getInstance
   * @param {{url: string, isNew: boolean}} options 
   * @returns {Promise<RabbitMQ>} Promise<RabbitMQ>
   */
  static async getInstance({ url, isNew, type, exchangeName, durable }) {

    await helper.delay(helper.getRandomInt(1, 10))
    while (RabbitMQ.status == "processing") {
      await helper.delay(100)
    }
   
    if (!RabbitMQ.isInitialized || isNew) {
      RabbitMQ.isInitialized = false
      RabbitMQ.instance = new RabbitMQ({ url, type, exchangeName, durable })
      await RabbitMQ.instance.connect()
    }
    return RabbitMQ.instance
  }
  setOnDisconnected(fn) {
    this.onDisconnect = fn;
  }
  async beforeReconnect  () {
    RabbitMQ.status = "processing"
    this.connecting =false;
    this.connected = false;
    RabbitMQ.isInitialized = false;
    if(this.channel) {
      this.channel.close();
    }
    if(this.connection) {
      this.connection.close();
    }
    this.channel = null;
    this.tempConnection = this.connection;
    this.connection = null;

  }
  async connect() {
    let that = this;
    return new Promise(async (resolve) => {
      let retry = async () => {
        
        that.beforeReconnect()
        resolve(await this.connect())
      }
      try {
        if (!RabbitMQ.isInitialized) {
          RabbitMQ.status = "processing"
          if(that.connecting == true) return;
          that.connecting = true;
          console.log("Connecting...")
          setTimeout(()=>{
              if(!this.connected){
                retry()
              }
          },30000)
          let { url, type, exchangeName, durable } = this.configs;
          if (!this.connection) {
            this.connection = await amqp.connect(url || this.defaultConfig.url)
            this.connection._id = Date.now();
          }
          if (!this.connection) throw new Error("Connection fail")

          this.connection.on("connect", async (connection, a, c) => {
            // if(conn._id !== that.connection._id){
            //   return
            // }
            this.connected = true;
            if (!this.channel) {
              let channel = await this.connection.createChannel(
                {
                  setup: (channel) => {
                    let _type = type || String(this.defaultConfig.type)
                    channel.assertExchange(exchangeName || this.defaultConfig.exchangeName, _type, {
                      durable: durable || this.defaultConfig.durable,
                    })

                    channel.prefetch(Number(1))

                  },
                  json: false,
                }
              )
              that.channel = channel
              if (that.consumers.length) {
                for (let i = 0; i < that.consumers.length; i++) {
                  await that.setupConsumer(that.consumers[i]);
                }
              }
            }

            RabbitMQ.isInitialized = true;
            if(this.tempConnection){
              try {
                this.tempConnection.close();
                this.tempConnection =null
              } catch (e){
                console.log("error tempConnection",e)
              }
            }
            console.log('Connect rabbit success')
            RabbitMQ.status = "done"

            resolve(true)
          });
          this.connection.on('error', async function (err) {
            console.log('Error connection!', err)
            retry()
          })
          this.connection.on('disconnect', async (err) => {
            console.log('disconnect!', err)
            retry()
            if (this.onDisconnect) await this.onDisconnect();

          })
          this.connection.on('close', async function () {

            console.error('connection to RabbitQM closed!')
            retry()
          })
        }
      } catch (error) {
        console.log('Error connect RabbitMQ! ', error)
        return await retry()
      }
    })
    
  }

  async sendMessage(queue, message) {
    if (!this.connection && !this.channel) {
      await this.connect()
    }

    let buffer = Buffer.from(JSON.stringify(message))

    let result;
    try {
      result = await this.channel.sendToQueue(queue, buffer, {})

    } catch (err) {
      console.log("error", err)
    }
    return result;
  }
  async setupConsumer(queueOption) {
    console.log("setup consumer")
    const { option, queueName, routingKey, exchangeName, isConsumer, onMessage } = queueOption;

    this.channel.addSetup(async (channel) => {
      await channel.assertQueue(queueName, option);
      await channel.bindQueue(queueName, exchangeName, routingKey);
      if (isConsumer) {
        await channel.consume(
          queueName,
          (msg) => {
            if (onMessage && msg) {
              let payload = {}
              try {
                payload = JSON.parse(msg.content.toString("utf8"));
              } catch (err) {

              }
              onMessage(payload, msg, channel);
            }
          },
          {
            noAck: false,
          }
        );
      }
    });
  }
  async registerQueue(queueOption) {
    this.consumers.push(queueOption)
    if (!this.connection && !this.channel) {
      await this.connect()
    }
    if (this.channel) {
      await this.setupConsumer(queueOption)
    }
    return;
  }
}

module.exports = RabbitMQ
