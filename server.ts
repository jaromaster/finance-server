import { Payload } from "https://deno.land/x/djwt@v2.4/mod.ts";
import { Application, Context, Router } from "https://deno.land/x/oak@v10.6.0/mod.ts";
import { Client } from "https://deno.land/x/mysql@v2.10.2/mod.ts";
import {create_jwt, generate_key, verify_jwt} from "./auth.ts";


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
    router.post("/login", async (ctx) => handle_post_login(ctx, key));


    // handle post request to /signup
    router.post("/signup", async (ctx) => handle_post_signup(ctx, key, client));


    // handle /test (just for quick testing)
    router.post("/test", async (ctx)=> {
        
        // do some testing
        ctx.response.body = "this is the testing route";
    });


    
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
 * handle_post_login handles logins (post requests)
 * 
 * @param ctx
 * @param key
 */
async function handle_post_login(ctx: Context, key: CryptoKey) {

    // get login_data as json
    const login_data = await ctx.request.body({type: "json"}).value;
    
    // extract username and password
    const username = login_data.username;
    const password = login_data.password;



    // check if user in database and password correct, get his id


    // if not: sign up


    // if user in database and password correct
    // create jwt from login
    const jwt = await create_jwt(key, 200); // user_id = 200, just for testing

    
    
    ctx.response.body = jwt; // send jwt to client
    ctx.response.status = 200; // status ok
}


/**
 * handle_post_signup handles signups (post: json containing username and password as sha3 hash)
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
    const password_hash = body.password; // 64 char hash


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