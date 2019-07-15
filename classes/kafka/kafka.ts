const { Kafka, logLevel } = require("kafkajs");
const uuid = require("uuid/v4");

// const kafkaNode = require("kafka-node");

export class KafkaDriver {
	private cli: any;
	private clientId: string;
	private brokers: string[];
	private topics: string[];
	private consumer: any;
	private producer: any;

	public groupId: string;

	constructor() {
		this.groupId = process.env.APP_NAME || `test-service-in-dev-${uuid()}`;
		this.clientId = `${this.groupId}-${uuid()}`;
		try {
			this.brokers = process.env.KAFKA_URI.split(",");
			this.topics = process.env.KAFKA_TOPICS.split(",");
		} catch (error) {
			this.brokers = ["localhost:9092"];
			this.topics = ["update_channel"];
		}


		/**Definition du client Kafka */
		this.cli = new Kafka({
			clientId: this.clientId,
			brokers: this.brokers,
			logLevel: logLevel.ERROR
		});

		/**Definition du producer Kafka */
		this.producer = this.cli.producer();
		/**Definition du consumer Kafka */
		this.consumer = this.cli.consumer({
			groupId: this.groupId
		});
	}

	public async connexion() {
		await this.consumer.connect();
		await this.producer.connect();

		/**Abonnement aux topics */
		this.topics.map(async y => await this.consumer.subscribe({ topic: y }));
		this.receive();
	}

	public async deconnexion() {
		await this.consumer.disconnect();
		await this.producer.disconnect();
	}

	public async send(action: string, data: {}) {
		await this.producer.send({
			topic: "update_channel",
			messages: [
				{
					headers: {
						kind: "ticket",
						crud_action: action,
						groupId: this.groupId,
						clientId: this.clientId
					},
					value: Buffer.from(JSON.stringify(data))
				}
			]
		});
	}

	public receive() {
		return this.consumer;
	}
}
