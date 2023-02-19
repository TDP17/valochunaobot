import { MongoClient, ServerApiVersion } from "mongodb";
import * as dotenv from "dotenv";
dotenv.config({ path: "./.env" });


const client = new MongoClient(process.env.MONGODB_URI_OLD, {
  serverApi: ServerApiVersion.v1,
});

export default client;
