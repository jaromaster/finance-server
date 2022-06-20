import { Client } from "https://deno.land/x/mysql@v2.10.2/mod.ts";


/**
 * create_db_client creates a database client and returns it
 * 
 * @param hostname 
 * @param username 
 * @param db 
 * @param password 
 * @returns created database client
 */
export async function create_db_client(hostname: string, username: string, db: string, password: string): Promise<Client> {
    const client = await new Client().connect({
        hostname: hostname,
        username: username,
        db: db,
        password: password,
    });

    return client;
}


/**
 * get_payments_db fetches and returns all payments of user from database
 * 
 * @param user_id 
 * @param client
 * @returns payments as array of json
 */
export async function get_payments_db(user_id: number, client: Client): Promise<any[]> {
    const select_statement = `select * from payments where user_id = ?`;

    // get all payments from database
    const payments: Array<any> = await client.query(select_statement, [
        user_id
    ]);

    return payments;
}


/**
 * insert_payments_db takes payments and inserts them into the database
 * 
 * @param payments 
 * @param client 
 * @returns string ("payments added" or error.message)
 */
export async function insert_payments_db(payments: Array<any>, client: Client): Promise<string> {
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
 * delete_payments_db deletes payments with id from database
 * 
 * @param payment_ids 
 * @param user_id
 * @param client
 * @returns string ("payments deleted" or error.message)
 */
export async function delete_payments_db(payment_ids: Array<number>, user_id: number, client: Client): Promise<string> {
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


/**
 * delete_user_db deletes user with id from database
 * 
 * @param user_id 
 * @param client 
 * @returns string ("user deleted" or error.message)
 */
export async function delete_user_db(user_id: number, client: Client): Promise<string> {
    const delete_statement = `delete from users where id = ?`;

    try {
        await client.execute(delete_statement, [
            user_id
        ]);
    } catch (error) {
        return error.message;
    }
    
    return "user deleted";
}


/**
 * check_user_exists checks if user is in database
 * 
 * @param user_id 
 * @param client 
 * @returns boolean (if user in database)
 */
export async function check_user_exists(user_id: number, client: Client): Promise<boolean> {
    const select_statement = `select exists(select 1 from users where id = ?) as "exists"`;

    // check if exists
    const exists = await client.query(select_statement, [user_id]);

    // not in db
    if (exists[0].exists == 0) {
        return false;
    }

    // in db
    return true;
}