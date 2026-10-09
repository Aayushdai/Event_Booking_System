import test, {before, after } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import bcrypt from "bcrypt";

import app from "../src/app.js"
import sequelize from "../src/config/db.js";
import User from "../src/models/User.js";
import "../src/models/index.js";

before(async()=>{
    await sequelize.sync({force: true});
});
after(async ()=> {
    await sequelize.close();
});

test("POST /api/auth/register creates a new user", async()=> {
    const response =await request(app)
    .post("/api/auth/register")
    .send({

        name: "Test User",
        email: "test@example.com",
        password: "TestPassword123",
    });

    assert.equal(response.statusCode, 201);
    assert.equal(response.body.message, "User registered successfully");

    assert.ok(!response.body.user.password);
    assert.ok(!response.body.user.email.email_verification_token);
    assert.ok(!response.body.user.email.email_verification_expires);
    const user = await User.findOne({
        where: {

            email: "test@example.com",
        }
    })
    assert.ok(user);
    assert.equal(user.name, "Test User");
    assert.equal(user.email_verified, false);
    assert.ok(user.email_verification_token);
    assert.ok(user.email_verification_expires);

    const passwordMatches = await bcrypt.compare(
        "TestPassword123",
        user.password
    );
    assert.equal(passwordMatches, true
    );
})

test("POST /api/users/register creates a new user", async()=> {
    const response = await request(app)
    .post("/api/users/register")
    .send({
        name: "Users Route",
        email: "users-route@example.com",
        password: "TestPassword123",
    });

    assert.equal(response.statusCode, 201);
    assert.equal(response.body.message, "User registered successfully");
    assert.ok(!response.body.user.password);

    const user = await User.findOne({
        where: {
            email: "users-route@example.com",
        },
    });

    assert.ok(user);
    assert.equal(user.name, "Users Route");
})

test("POST /api/auth/register rejects duplicat email", async()=>{
    const userData={
        name: "Test User",
        email: "duplicate@example.com",
        password: "TestPassword123",
    };

    await request(app)
    .post("/api/auth/register")
    .send(userData);

    const response = await request(app)
    .post("/api/auth/register")
    .send(userData);

    assert.equal(response.statusCode, 409);
    assert.equal(
        response.body.message,
        "User with this email already exists"
    );
})

test("GET /api/auth/verify-email verifies a user email", async ()=>{
    const email = "verify@example.com";

    await request(app)
    .post("/api/auth/register")
    .send({
        name: "Verify User",
        email,
        password: "TestPassword123",
    });

    const userBefore = await User.findOne({
        where: {email},
    });

    assert.ok(userBefore);
    assert.equal(userBefore.email_verified, false);
    assert.ok(userBefore.email_verification_token);

    const response = await request(app)
    .get("/api/auth/verify-email")
    .query({
        email,
        token: userBefore.email_verification_token,
    });

    assert.equal(response.statusCode, 200);
    assert.equal(
        response.body.message,
        "Email verified successfully"
    );

    const userAfter = await User.findOne({
        where: {email},
    });
    assert.equal(userAfter.email_verified, true);
    assert.equal(userAfter.email_verification_token, null);
    assert.equal(userAfter.email_verification_expires, null);
});

test("GET /api/auth/verify-email rejects invalid token", async()=>{
    const response = await request(app)
    .get("/api/auth/verify-email")
    .query({
        email: "verify@example.com",
        token: "invalid-token",
    });

    assert.equal(response.statusCode, 400);
    assert.equal(
        response.body.message,
        "Invalid verification link"
    );
});

test("POST /api/auth/login rejects unverified user", async()=>{
    const email = "unverified@example.com";

    await request(app)
    .post("/api/auth/register")
    .send({
        name: "Unverified User",
        email,
        password: "TestPassword123",
    });

    const response = await request(app)
    .post("/api/auth/login")
    .send({
        email,
        password: "TestPassword123",
    });

    assert.equal(response.statusCode, 403);
    assert.equal(
        response.body.message,
        "Please verify your email before logging in"
    );
})

test("POST /api/auth/login can bypass email verification in non-production", async()=> {
    const originalBypass = process.env.BYPASS_EMAIL_VERIFICATION;
    process.env.BYPASS_EMAIL_VERIFICATION = "true";

    try {
        const email = "bypass@example.com";
        const password = "TestPassword123";

        await request(app)
        .post("/api/auth/register")
        .send({
            name: "Bypass User",
            email,
            password,
        });

        const response = await request(app)
        .post("/api/auth/login")
        .send({
            email,
            password,
        });

        assert.equal(response.statusCode, 200);
        assert.equal(response.body.message, "Login successful");
        assert.equal(response.body.email_verified, false);
        assert.ok(response.body.accessToken);
    } finally {
        if (originalBypass === undefined) {
            delete process.env.BYPASS_EMAIL_VERIFICATION;
        } else {
            process.env.BYPASS_EMAIL_VERIFICATION = originalBypass;
        }
    }
})

test("POST /api/login validates login request", async()=> {
    const response = await request(app)
    .post("/api/login")
    .send({
        email: "noobdai@gmail.com",
    });

    assert.equal(response.statusCode, 400);
    assert.equal(response.body.message, "Validation failed");
})

test("POST /api/auth/login logs in a verified user", async()=>{
    const email = "verified-login@example.com";
    const password = "TestPassword123";

    await request(app)
    .post("/api/auth/register")
    .send({
        name: "Verified User",
        email,
        password,
    });
    const user = await User.findOne({
        where: {email},
    });
    assert.ok(user);
    assert.ok(user.email_verification_token);

    await request(app)
    .get("/api/auth/verify-email")
    .query({
        email,
        token: user.email_verification_token,
    });

    const response = await request(app)
    .post("/api/auth/login")
    .send({
        email,
        password,
    });
    assert.equal(response.statusCode, 200);
    assert.equal(response.body.message, "Login successful");
    assert.ok(response.body.accessToken);
    assert.equal(response.body.email, email);
    assert.equal(response.body.email_verified, true);
});

test("POST /api/auth/login rejects invalid password", async()=>{
    const email = "wrong-password@example.com";
    const password = "CorrectPassword123";

    await request(app)
    .post("/api/auth/register")
    .send({
        name: "Wrong Password User",
        email,
        password,
    });

    const user = await User.findOne({
        where: {email},
    
    });

    await request(app)
    .get("/api/auth/verify-email")
    .query({
        email,
        token: user.email_verifiction_token,
    });

    const response = await request(app)
    .post("/api/auth/login")
    .send({
        email,
        password: "WrongPassword123",
    });

    assert.equal(response.statusCode, 401);
    assert.equal(
        response.body.message,
        "Invalid email or password"
    );
});
