import { Redis } from "ioredis";

const redisClient = new Redis(process.env.REDIS_URL!)

redisClient.on("ready", () => console.log("Connected to Redis"));
redisClient.on("error", (err) => console.log("Redis Client Error: ", err));

export default redisClient;