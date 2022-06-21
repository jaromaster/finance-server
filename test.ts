import { assertEquals, assertNotEquals, assertRejects } from "https://deno.land/std@0.104.0/testing/asserts.ts";
import axiod from "https://deno.land/x/axiod@0.26.1/mod.ts";
import { Payload } from "https://deno.land/x/djwt@v2.4/mod.ts";
import { Client } from "https://deno.land/x/mysql@v2.10.2/mod.ts";
import { create_jwt, generate_key, hash_password, verify_jwt } from "./auth.ts";
import { create_db_client } from "./database_funcs.ts";
import { get_dbhost_from_args, get_dbpass_from_args } from "./main.ts";


// AUTH.TS
/**
 * test generate_key()
 */
Deno.test("test generate_key()", async () => {
    const key: CryptoKey = await generate_key();

    assertNotEquals(key, null);

    assertEquals(key.type, "secret");
    assertEquals(key.extractable, true)
    assertEquals(key.algorithm, {name: "HMAC", hash: {name: "SHA-512"}, length: 1024});
    assertEquals(key.usages, ["sign", "verify"]);
});


/**
 *  test create_jwt()
 */
Deno.test("test create_jwt()", async () => {
    const key: CryptoKey = await generate_key();
    const user_id: number = 1;
    const jwt: string = await create_jwt(key, user_id); // use key and user_id (claim)

    const payload: Payload = await verify_jwt(jwt, key);
    assertNotEquals(payload, null);
    assertNotEquals(payload, undefined);
    assertEquals(jwt.split(".").length, 3); // check if token has valid structure (aaa.aaa.aaa)
    assertEquals(payload.user_id, user_id); // check if payload correct
});


/**
 * test verify_jwt()
 */
Deno.test("test verify_jwt()", async () => {
    const key: CryptoKey = await generate_key();
    const user_id: number = 1000;
    const jwt: string = await create_jwt(key, user_id); // use key and user_id (claim)

    const payload: Payload = await verify_jwt(jwt, key);
    assertEquals(payload.user_id, user_id); // should work

    const new_key: CryptoKey = await generate_key(); // create new key
    assertRejects(async () => await verify_jwt(jwt, new_key), Error); // new key should new work
});


/**
 * test hash_password()
 */
Deno.test("test hash_password()", async () => {
    const password: string = "password";
    const password2: string = "password";

    const hash: string = await hash_password(password);
    const hash2: string = await hash_password(password2);

    assertEquals(hash, hash2);


    const password_different: string = "password1";
    const hash_different: string = await hash_password(password_different);

    assertNotEquals(hash, hash_different);
    assertNotEquals(hash2, hash_different);
});


// DATABASE_FUNCS.TS
/**
 * test create_db_client()
 */
Deno.test("test create_db_client()", async () => {

    const db_hostname = get_dbhost_from_args();
    const db_password = get_dbpass_from_args();

    const client: Client = await create_db_client(db_hostname, "dbuser", "finance", db_password);
    
    await client.close();
});

// TODO TEST API
/**
 * test /signup
 */
Deno.test({
    name: "test /signup (creating testuser)",
    async fn () { 
        const username = "testuser";
        const password = "password";

        const response = await fetch("http://localhost:8000/signup", {
            method: "POST",
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({username: username, password: password})
        });

        assertEquals(response.status, 200); // check if ok

        const token = await response.text(); // get jwt

        assertEquals(token.split(".").length, 3); // check if token has valid syntax
    },
    // deactivate ressource checking (else error because leaking async ops)
    sanitizeResources: false,
    sanitizeOps: false
});


/**
 * test /login
 */
Deno.test({
    name: "test /login (logging in as testuser)",
    async fn () { 
        const username = "testuser";
        const password = "password";

        const response = await fetch("http://localhost:8000/login", {
            method: "POST",
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({username: username, password: password})
        });

        assertEquals(response.status, 200); // check if ok

        const token = await response.text(); // get jwt

        assertEquals(token.split(".").length, 3); // check if token has valid syntax
    },
    // deactivate ressource checking (else error because leaking async ops)
    sanitizeResources: false,
    sanitizeOps: false
});


/**
 * test /deluser
 */
 Deno.test({
    name: "test /deluser (delete testuser)",
    async fn () { 
        const username = "testuser";
        const password = "password";

        // login to get token (should work)
        const response = await fetch("http://localhost:8000/login", {
            method: "POST",
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({username: username, password: password})
        });

        assertEquals(response.status, 200); // check if ok

        const token = await response.text(); // get jwt


        // delete user with token
        const response_del = await fetch("http://localhost:8000/deluser", {
            method: "DELETE",
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({token: token}) // use token
        });

        assertEquals(response_del.status, 200); // check if ok

        // login again (should not work, user was deleted)
        const response_retry = await fetch("http://localhost:8000/login", {
            method: "POST",
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({username: username, password: password})
        });

        assertEquals(response_retry.status, 403); // check if Forbidden
    },
    // deactivate ressource checking (else error because leaking async ops)
    sanitizeResources: false,
    sanitizeOps: false
});