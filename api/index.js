import app, { ensureMongoConnection } from "../server/index.js";

await ensureMongoConnection().catch(() => {});

export default app;
