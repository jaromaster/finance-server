import { Payload } from "https://deno.land/x/djwt@v2.4/mod.ts";
import { Application, Context, Router } from "https://deno.land/x/oak@v10.6.0/mod.ts";
import {create_jwt, generate_key, verify_jwt} from "./auth.ts";


/**
 * initialize server listening on specific port and configure routes
 * 
 * @param port
 */
export async function start_server(port: number) {
    // create app and router
    const app: Application = new Application();
    const router: Router = new Router();

    // generate key for jwt
    const key: CryptoKey = await generate_key(); // note: when server stops, key gets lost -> all jwts will get invalid



    // handle post request to /payments
    router.post("/payments", async (ctx) => handle_post_payment(ctx, key)); 


    // handle post request to /login
    router.post("/login", async (ctx) => handle_post_login(ctx, key));


    // handle /test (just for testing)
    router.post("/test", async (ctx)=> {
        
        // do some testing
        ctx.response.body = "this is the testing route";
    });


    
    app.use(router.routes()); // use router
    await app.listen({port: port}); // listen on port
}


/**
 * handle_post_payment handles get request and returns payments as response
 * 
 * @param ctx
 * @param key
 */
async function handle_post_payment(ctx: Context, key: CryptoKey) {
    
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



    // create jwt from login
    const jwt = await create_jwt(key, 200); // user_id = 200, just for testing


    
    // check if user in database, get his id

    // if not: sign up

    // if user in database: create jwt containing the user id
    

    // return jwt to client
    ctx.response.body = jwt;

    ctx.response.status = 200; // status ok
}