import test from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import app from "../app.js";

test("health endpoints remain available when MongoDB is disconnected", async () => {
  await mongoose.disconnect();
  const server = app.listen(0, "127.0.0.1");

  try {
    await new Promise((resolve, reject) => {
      server.once("listening", resolve);
      server.once("error", reject);
    });

    const address = server.address();
    const baseUrl = \`http://127.0.0.1:\${address.port}\`;

    const liveness = await fetch(\`\${baseUrl}/healthz\`);
    assert.equal(liveness.status, 200);
    assert.deepEqual(await liveness.json(), { status: "ok" });

    const readiness = await fetch(\`\${baseUrl}/readyz\`);
    assert.equal(readiness.status, 503);
    assert.deepEqual(await readiness.json(), {
      status: "unavailable",
      database: "disconnected"
    });
  } finally {
    await new Promise((resolve, reject) => {
      server.close(error => error ? reject(error) : resolve());
    });
  }
});
