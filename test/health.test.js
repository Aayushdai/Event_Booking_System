import test from "node:test";
import assert from "node:assert/strict";
import request from "supertest";

import app from "../src/app.js";

test("GET /api/health return 200", async ()=>{
    const response = await request(
        app
    ).get("/api/health");

    assert.equal(
        response.statusCode,
        200
    );

    assert.deepEqual(
        response.body,
        {
            message: "Server is healthy",
        }
    );
});