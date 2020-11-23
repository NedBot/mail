import { Provider, util } from "klasa";
import { MongoClient, Db } from "mongodb";
import { mongodbConnectionString, mongodbDatabaseName } from "../config";
const { mergeObjects, isObject } = util;

export default class MongoDB extends Provider {
	public db!: Db;

	public async init() {
		const client = await MongoClient.connect(mongodbConnectionString, {
			useNewUrlParser: true,
			useUnifiedTopology: true
		});

		this.db = client.db(mongodbDatabaseName);
	}

	public async hasTable(table: string) {
		const collections = await this.db.listCollections().toArray();
		return collections.some((collection) => collection.name === table);
	}

	public createTable(table: string) {
		return this.db.createCollection(table);
	}

	public deleteTable(table: string) {
		return this.db.dropCollection(table);
	}

	public getAll(table: string) {
		return this.db.collection(table).find({}).toArray();
	}

	public async getKeys(table: string) {
		const documents = await this.getAll(table);
		return documents.map((document) => document.id);
	}

	public get(table: string, id: string) {
		return this.db.collection(table).findOne(resolveQuery(id));
	}

	public async has(table: string, id: string) {
		const document = await this.get(table, id);
		return Boolean(document);
	}

	public create(table: string, id: string, data: any = {}) {
		return this.db
			.collection(table)
			.insertOne(mergeObjects(this.parseUpdateInput(data), resolveQuery(id)));
	}

	public delete(table: string, id: string) {
		return this.db.collection(table).deleteOne(resolveQuery(id));
	}

	public update(table: string, id: string, data: any) {
		return this.db.collection(table).updateOne(resolveQuery(id), {
			$set: isObject(data) ? flatten(data) : parseEngineInput(data)
		});
	}

	public replace(table: string, id: string, data: any) {
		return this.db.collection(table).replaceOne(resolveQuery(id), this.parseUpdateInput(data));
	}
}

const resolveQuery = (query: string) => {
	try {
		const obj = JSON.parse(query);
		if (isObject(obj)) return obj as Record<string, any>;
	} catch (e) {
		throw new TypeError("Not a well formed query");
	}

	return { id: query };
};

function flatten(obj: any, path = "") {
	let output = {};
	for (const [key, value] of Object.entries(obj)) {
		if (isObject(value))
			output = Object.assign(output, flatten(value, path ? `${path}.${key}` : key));
		else output[path ? `${path}.${key}` : key] = value;
	}
	return output;
}

function parseEngineInput(updated: any[]) {
	return Object.assign({}, ...updated.map((entry) => ({ [entry.data[0]]: entry.data[1] })));
}
