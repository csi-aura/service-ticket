"use strict";

import { ServiceSchema, Errors } from "moleculer";
import { KafkaDriver } from "../classes/kafka/kafka";
const kafkaDriver = new KafkaDriver();

const DbService = require("moleculer-db");
const MongoAdapter = require("moleculer-db-adapter-mongo");

const ticketService: ServiceSchema = {
	/**
	 * Name of service
	 */
	name: "tickets",
	mixins: [DbService],

	/**
	 * Mongo settings
	 */
	adapter: new MongoAdapter(process.env.MONGO_URI, { useNewUrlParser: true }),
	collection: "tickets",

	/**
	 * Actions
	 */
	actions: {
		create: {
			params: {
				nom: {
					type: "string",
					min: 2
				},
				prenom: {
					type: "string",
					min: 2
				}
			}
		},

		// Heartbeat for kubernetes
		health() {
			return true;
		}
	},

	/**
	 * Service started lifecycle event handler
	 */
	async started() {
		try {
			/**Connexion */
			await kafkaDriver.connexion();
			this.logger.info("kafka adapter has connected successfully.");

			/**Reception */
			kafkaDriver
				.receive()
				.run({
					/**Lecture de tous les messages du/des topics abonnées */
					eachMessage: async ({ topic, partition, message }: any) => {
						let mess = JSON.parse(message.value.toString())

						/**Filtre les message consernant les convives et ne venant pas de ce groupe de service */
						if (
							mess.headers.kind === "convive" &&
							mess.headers.groupId != kafkaDriver.groupId
						) {
							this.logger.info(
								`Demande de modification de ${mess.headers.kind} venant d'un autre service :
								Topic : ${topic}
								Type de donnée : ${mess.headers.kind}
								Action effectuée : ${mess.headers.crud_action}
								Provient du client : ${mess.headers.clientId}
								Le client provient du groupe : ${mess.headers.groupId}
								Data : ${mess.data}`);

							/**CRUD Routes */
							switch (mess.headers.crud_action) {
								case "CREATE":
									break;
								case "UPDATE":
									break;
								case "DELETE":
									break;
								default:
									break;
							}
						}
					}
				});
		} catch (e) {
			throw new Errors.MoleculerServerError(
				"Unable to connect to kafka.",
				e.message
			);
		}
	},

	/**
	 * Service stoped lifecycle event handler
	 */
	async stopped() {
		try {
			await kafkaDriver.deconnexion();
			this.logger.warn("kafka adapter has disconnected.");
		} catch (e) {
			this.logger.warn("Unable to stop kafka connection gracefully.", e);
		}
	},

	entityCreated(json: {}, ctx: any) {
		this.logger.info("New entity created!", json);
		kafkaDriver.send("CREATE", json);
	},

	entityUpdated(json: {}, ctx: any) {
		this.logger.info(`Entity updated by '${ctx.meta.user.name}' user!`);
		kafkaDriver.send("UPDATE", json);
	},

	entityRemoved(json: {}, ctx: any) {
		this.logger.info("Entity removed", json);
		kafkaDriver.send("DELETE", json);
	}
};

export = ticketService;
