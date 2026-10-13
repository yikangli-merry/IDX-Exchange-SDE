const assert = require("node:assert/strict");
const EventEmitter = require("node:events");
const test = require("node:test");

const requestLogger = require("../src/middleware/requestLogger");

test("logs request method, URL, status code, and duration", () => {
  const req = {
    method: "GET",
    originalUrl: "/api/properties/1190952876",
  };
  const res = new EventEmitter();
  res.statusCode = 200;
  let nextCalled = false;
  const logs = [];
  const originalLog = console.log;

  console.log = (message) => {
    logs.push(message);
  };

  try {
    requestLogger(req, res, () => {
      nextCalled = true;
    });

    res.emit("finish");
  } finally {
    console.log = originalLog;
  }

  assert.equal(nextCalled, true);
  assert.equal(logs.length, 1);
  assert.match(logs[0], /GET \/api\/properties\/1190952876 200 \d+\.\dms/);
});
