import { assertEquals, assertNotEquals, assertRejects } from "https://deno.land/std@0.104.0/testing/asserts.ts";
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


// TEST API
/**
 * create_testuser() creates new user for testing and returns reponse from server
 * 
 * @returns response
 */
async function create_testuser(): Promise<Response> {
    const username = "testuser";
    const password = "password";

    // create user
    const response = await fetch("https://localhost:8000/signup", {
        method: "POST",
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({username: username, password: password})
    });

    return response;
}


/**
 * delete_testuser() takes token and deletes user for testing
 * 
 * @param token 
 * @returns response
 */
async function delete_testuser(token: string): Promise<Response> {

    // delete user with token
    const response = await fetch("https://localhost:8000/deluser", {
        method: "DELETE",
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({token: token}) // use token
    });

    return response;
}


/**
 * login_testuser() logs testuser in to get reponse containing token (jwt)
 * 
 * @returns response
 */
async function login_testuser(): Promise<Response> {
    const username = "testuser";
    const password = "password";

    // login user to get response with token
    const response = await fetch("https://localhost:8000/login", {
        method: "POST",
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({username: username, password: password})
    });

    return response;
}


/**
 * test /signup
 */
Deno.test({
    name: "test /signup (creating testuser)",
    async fn () { 
    
        // create testuser
        const response = await create_testuser();

        assertEquals(response.status, 200); // check if ok

        const token = await response.text(); // get jwt

        assertEquals(token.split(".").length, 3); // check if token has valid syntax
    },
    // deactivate resource checking (else error because leaking async ops)
    sanitizeResources: false,
    sanitizeOps: false
});


/**
 * test /login
 */
Deno.test({
    name: "test /login (logging in as testuser)",
    async fn () { 
        const response = await login_testuser(); // login

        assertEquals(response.status, 200); // check if ok

        const token = await response.text(); // get jwt

        assertEquals(token.split(".").length, 3); // check if token has valid syntax
    },
    // deactivate resource checking (else error because leaking async ops)
    sanitizeResources: false,
    sanitizeOps: false
});


/**
 * test /deluser
 */
 Deno.test({
    name: "test /deluser (delete testuser)",
    async fn () { 

        // login to get token (should work)
        const response = await login_testuser();
        assertEquals(response.status, 200); // check if ok
        const token = await response.text(); // get jwt

        // delete user with token
        const response_del = await delete_testuser(token);
        assertEquals(response_del.status, 200); // check if ok

        // login again (should not work, user was deleted)
        const response_retry = await login_testuser();
        assertEquals(response_retry.status, 403); // check if Forbidden
    },
    // deactivate resource checking (else error because leaking async ops)
    sanitizeResources: false,
    sanitizeOps: false
});


/**
 * test /addpayments
 */
Deno.test({
    name: "test /addpayments",
    async fn () { 
        // create testuser
        const response = await create_testuser();
        assertEquals(response.status, 200); // check if ok
        const token = await response.text(); // get jwt

        // test data
        const payments = [
            {date: "2020-10-10", amount: 10, time: "10:30:00", category: "business", text: "some text about payment"},
            {date: "2022-01-01", amount: 150, time: "15:00:00", category: "business", text: "some more text about payment"}
        ];

        // send payments to server (should work)
        const response_add = await fetch("https://localhost:8000/addpayments", {
            method: "POST",
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({payments: payments, token: token})
        });

        assertEquals(response_add.status, 200); // should be ok
        console.log(await response_add.text());
    },
    // deactivate resource checking (else error because leaking async ops)
    sanitizeResources: false,
    sanitizeOps: false
});


/**
 * test /payments
 */
Deno.test({
    name: "test /payments",
    async fn () { 
        // test data for comparison
        const compare_payments = [
            {date: "2020-10-10", amount: 10, time: "10:30:00", category: "business", text: "some text about payment"},
            {date: "2022-01-01", amount: 150, time: "15:00:00", category: "business", text: "some more text about payment"}
        ];

        const response_login = await login_testuser(); // login to get token
        const token = await response_login.text(); // get token

        // get payments from server (should work)
        const response = await fetch("https://localhost:8000/payments", {
            method: "POST",
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({token: token})
        });

        assertEquals(response.status, 200); // should be ok
        const payments = JSON.parse(await response.text()); // get payments from server

        // check if payments are same as compare_payments (ignoring date, as format is different)
        for (let i = 0; i < payments.length; i++) {
            const payment = payments[i];
            const compare_payment = compare_payments[i];

            assertEquals(compare_payment.amount, payment.payment_amount); // check amount
            assertEquals(compare_payment.category, payment.payment_category); // check category
            assertEquals(compare_payment.text, payment.payment_text); // check text
            assertEquals(compare_payment.time, payment.payment_time); // check time
        }

    },
    // deactivate resource checking (else error because leaking async ops)
    sanitizeResources: false,
    sanitizeOps: false
});


/**
 * test /delpayments
 */
Deno.test({
    name: "test /delpayments",
    async fn () { 
        const response_login = await login_testuser(); // login
        const token = await response_login.text(); // get token

        // get payments from server (should work)
        const response = await fetch("https://localhost:8000/payments", {
            method: "POST",
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({token: token})
        });

        assertEquals(response.status, 200); // should be ok
        const payments = JSON.parse(await response.text()); // get payments from server

        // get ids of all payments to delete them later
        let payment_ids: number[] = [];
        for (let i = 0; i < payments.length; i++) {
            const id = payments[i].id; // get id
            payment_ids.push(id); 
        }

        // delete all payments from server (should work)
        const response_del = await fetch("https://localhost:8000/delpayments", {
            method: "DELETE",
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({token: token, payment_ids: payment_ids})
        });

        assertEquals(response_del.status, 200); // should be ok


        // check if all payments are deleted
        const response_payment = await fetch("https://localhost:8000/payments", {
            method: "POST",
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({token: token})
        });

        assertEquals(response_payment.status, 200); // should be ok
        assertEquals(JSON.parse(await response_payment.text()), []); // get payments from server, should be empty array

        // delete testuser
        const response_del_user = await delete_testuser(token);
        assertEquals(response_del_user.status, 200); // should be ok

    },
    // deactivate resource checking (else error because leaking async ops)
    sanitizeResources: false,
    sanitizeOps: false
});