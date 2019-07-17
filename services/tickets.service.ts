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
			kafkaDriver.receive().run({
				/**Lecture de tous les messages du/des topics abonnées */
				eachMessage: async ({ topic, partition, message }: any) => {

					/**Filtre les message consernant les tickets et ne venant pas de ce groupe de service */
					if (
						message.headers.kind === "ticket" &&
						message.headers.groupId != kafkaDriver.groupId
					) {
						this.logger.info(
							`Demande de modification de base venant d'un autre service :
								Topic : ${topic}
								Type de donnée : ${message.headers.kind}
								Action effectuée : ${message.headers.crud_action}
								Provient du client : ${message.headers.clientId}
								Le client provient du groupe : ${message.headers.groupId}
								Data : ${message.value}`);


						/**CRUD Routes */
						switch (message.headers.crud_action) {
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
