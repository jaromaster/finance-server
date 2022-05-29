import { Application, Context, Router } from "https://deno.land/x/oak@v10.6.0/mod.ts";
import {generate_key} from "./auth.ts";

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
    const key: CryptoKey = await generate_key();


    // handle get request to /payments, TODO (only get payments of specific user)
    router.get("/payments", async (ctx) => handle_get_payments(ctx)); 


    // handle post request to /login
    router.post("/login", async (ctx) => {
        // get login_data as json
        const login_data = await ctx.request.body({type: "json"}).value;

        // just for testing
        console.log(login_data);


        // handle login data --------------------------------------------------

        
        // check if user in database in get his id
        // if not: sign up

        // if user in database: create jwt containing the user id
        // then send jwt back (response)

        // login done

    });


    
    app.use(router.routes()); // use router
    await app.listen({port: port}); // listen on port
}


/**
 * handle get request and return payments
 * 
 * @param ctx 
 */
function handle_get_payments(ctx: Context) {
    
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
        

    // send data as response
    ctx.response.body = dummy_payments;
}


/**
 * handle logins
 * 
 * @param ctx 
 */
function handle_post_login(ctx: Context) {

    // check if user in database

    // if user does not exist, redirect to sign up
    
    // if login data valid, get id of user and create jwt
    
    // send jwt as response
}