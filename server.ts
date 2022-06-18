import { Payload } from "https://deno.land/x/djwt@v2.4/mod.ts";
import { Application, Context, Router } from "https://deno.land/x/oak@v10.6.0/mod.ts";
import { Client } from "https://deno.land/x/mysql@v2.10.2/mod.ts";
import {create_jwt, generate_key, verify_jwt, hash_password} from "./auth.ts";


/**
 * initialize server listening on specific port and configure routes
 * 
 * @param port
 */
export async function start_server(port: number, db_hostname: string, db_user: string, db_name: string, db_password: string) {
    // create app and router
    const app: Application = new Application();
    const router: Router = new Router();

    // generate key for jwt
    const key: CryptoKey = await generate_key(); // note: when server stops, key gets lost -> all jwts will get invalid


    // init mariadb / mysql client for database connection
    const client: Client = await create_db_client(db_hostname, db_user, db_name, db_password);


    // handle post request to /payments
    router.post("/payments", async (ctx) => handle_post_payments(ctx, key)); 


    // handle post request to /login
    router.post("/login", async (ctx) => handle_post_login(ctx, key, client));


    // handle post request to /signup
    router.post("/signup", async (ctx) => handle_post_signup(ctx, key, client));


    // handle post request to /addpayments
    router.post("/addpayments", async (ctx) => handle_post_add_payments(ctx, key, client));


    // handle delete request to /delpayments
    router.delete("/delpayments", async (ctx) => handle_delete_del_payments(ctx, key, client));


    
    app.use(router.routes()); // use router
    await app.listen({port: port}); // listen on port
}


/**
 * create_db_client creates a database client and returns it
 * 
 * @param hostname 
 * @param username 
 * @param db 
 * @param password 
 * @returns created database client
 */
async function create_db_client(hostname: string, username: string, db: string, password: string): Promise<Client> {
    const client = await new Client().connect({
        hostname: hostname,
        username: username,
        db: db,
        password: password,
    });

    return client;
}


/**
 * handle_post_payments handles get request and returns payments as response
 * 
 * @param ctx
 * @param key
 */
async function handle_post_payments(ctx: Context, key: CryptoKey) {
    
    // TODO: get real data from database
    // simulate payments (dummy data)
    const dummy_payments = {
        payments: [
            {
                id: 1,
                price: 10,
                category: "food",
                date: "2022-29-05",
                user_id: 123
            },
            {
                id: 2,
                price: 40,
                category: "business",
                date: "2022-30-05",
                user_id: 123
            },
            {
                id: 3,
                price: 100,
                category: "tech",
                date: "2022-10-06",
                user_id: 124
            }
        ]
    }
    

    // verify jwt and get user_id
    const body = await ctx.request.body({type: "json"}).value;
    const jwt: string = body.body;

    let payload: Payload;
    try {
        payload = await verify_jwt(jwt, key);
    } catch (error) {
        // handle invalid jwt
        console.log("invalid token used");
        ctx.response.status = 403; // forbidden
        return;
    }
    
    const user_id = payload.user_id;
    console.log("sending payments of user with id:", user_id); // just for testing


    // get all payments with user_id from database

    // return payments to client


    // send data as response
    ctx.response.body = dummy_payments;
}


/**
 * handle_post_login handles logins (post requests) and returns jwt if successful
 * 
 * @param ctx
 * @param key
 * @param client
 */
async function handle_post_login(ctx: Context, key: CryptoKey, client: Client) {

    // get login_data as json
    const login_data = await ctx.request.body({type: "json"}).value;
    
    // extract username and password
    const username = login_data.username;
    const password = login_data.password;

    const password_hash = await hash_password(password); // hash the password for comparison (check if correct)


    // check if user in database and password correct, get his id
    let [result] = await client.query(`SELECT id FROM users WHERE user_name = ? and user_password_hash = ?`, [
        username,
        password_hash
    ]);

    // if user id not found
    if (result === undefined) {
        //console.log("username or password incorrect!!!"); // testing

        ctx.response.status = 403; // Forbidden
        return;
    }

    const user_id = result.id; // extract id from result

    // create jwt containing user_id
    const jwt = await create_jwt(key, user_id);

    ctx.response.body = jwt; // send jwt to client
    ctx.response.status = 200; // status ok
}


/**
 * handle_post_signup handles signups (post: json containing username and password)
 * 
 * @param ctx
 * @param key
 * @param client
 */
async function handle_post_signup(ctx: Context, key:CryptoKey, client: Client) {
    // read body (json)
    let body = await ctx.request.body({type: "json"}).value;

    // extract username and user password (hash)
    const username = body.username; // username
    const password = body.password; // password

    const password_hash = await hash_password(password); // hash the password (sha3-512)

    try {
        // store user and hash in database
        let result = await client.execute(`insert into users(user_name, user_password_hash) values(?, ?)`, [
            username,
            password_hash
        ]);
        
        const user_id = (result.lastInsertId as number); // get id of inserted user

        // create jwt using user_id
        const jwt = await create_jwt(key, user_id);

        ctx.response.status = 200; // ok
        ctx.response.body = jwt; // send jwt


    } catch (error) {
        const error_message: string = error.message; // get error message

        ctx.response.status = 500; // internal server error
        ctx.response.body = error_message; // return error message to frontend
    }
}


/**
 * handle_post_add_payments handles new payments that need to be inserted to db
 * 
 * @param ctx 
 * @param key 
 */
async function handle_post_add_payments(ctx: Context, key: CryptoKey, client: Client) {
    // read body as json
    const body = await ctx.request.body({type: "json"}).value; // {token: some_valid_token, payments: [payment1, payment2, ...]}

    const jwt = body.token; // get token
    const payments = body.payments; // payments

    try {
        const payload: Payload = await verify_jwt(jwt, key); // check jwt
        const user_id = payload.user_id; // get user id

        // add user_id to each payment (to store in database)
        for (let i = 0; i < payments.length; i++) {
            payments[i].user_id = user_id;
        }

        // insert payments to database
        const message: string = await insert_payments_db(payments, client);
        
        // check for errors
        if (message === "payments added") { // "payments added" if successful
            ctx.response.status = 200; // ok
            ctx.response.body = message;
        }
        else {
            // insertion went wrong (incorrect data, missing fields)
            ctx.response.status = 500; // internal server error
            ctx.response.body = message;
        }

    } catch (error) {
        // jwt invalid
        ctx.response.status = 403; // Forbidden
    }
}


/**
 * insert_payments_db takes payments and inserts them into the database
 * 
 * @param payments 
 * @param client 
 * @returns string ("payments added" or error.message)
 */
async function insert_payments_db(payments: Array<any>, client: Client): Promise<string> {
    // insert statement
    const insert_sql = 
    `insert into payments(user_id, payment_date, payment_time, payment_amount, payment_category, payment_text) values (?, ?, ?, ?, ?, ?)`;
    
    try {
        // insert each payment into database
        for (let i = 0; i < payments.length; i++) {
            const payment = payments[i];

            await client.execute(insert_sql, [
                payment.user_id,
                payment.date,
                payment.time,
                payment.amount,
                payment.category,
                payment.text
            ]);
        }

    } catch (error) {
        return error.message;
    }

    return "payments added";
}


/**
 * handle_delete_del_payments handles delete requests to remove payments
 * 
 * @param ctx 
 * @param key 
 * @param client
 */
async function handle_delete_del_payments(ctx: Context, key: CryptoKey, client: Client) {
    // read body as json
    const body = await ctx.request.body({type: "json"}).value;

    const payment_ids = body.payment_ids; // get list of payment ids (to delete)
    const jwt = body.token; // get jwt

    // check jwt
    try {
        const payload: Payload = await verify_jwt(jwt, key); // check if jwt is valid
        const user_id: number = (payload.user_id as number); // get id of user

        console.log("User with id", user_id, "deletes payments:", payment_ids);


        // delete payments (payment_ids) from database
        const message: string = await delete_payments_db(payment_ids, user_id, client);

        // error handling
        if (message === "payments deleted") {
            ctx.response.status = 200; // ok
            ctx.response.body = message;
        }
        else {
            ctx.response.status = 500; // Internal server error
            ctx.response.body = message;
        }

    } catch (error) {
        // jwt invalid
        ctx.response.status = 403; // Forbidden
    }
}


/**
 * delete_payments_db deletes payments with id from database
 * 
 * @param payment_ids 
 * @param client
 * @returns string ("payments deleted" or error.message)
 */
async function delete_payments_db(payment_ids: Array<number>, user_id: number, client: Client): Promise<string> {
    const delete_statement = `delete from payments where user_id = ? and id = ?`;

    try {
        // delete each payment
        for (let i = 0; i < payment_ids.length; i++) {
            const id: number = payment_ids[i];

            // delete payment with id
            await client.execute(delete_statement, [
                user_id,
                id
            ]);
        }

    } catch (error) {
        return error.message;
    }
    
    return "payments deleted";
}