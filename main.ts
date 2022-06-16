import {start_server} from "./server.ts";


/**
 * main is the entry point to server 
 */
function main() {
    const PORT = 8000;
    const DB_HOST = get_dbhost_from_args(); // get database hostname from cmd arguments
    const DB_USER = "dbuser";
    const DB_NAME = "finance";
    const DB_PASSWORD = get_dbpass_from_args(); // get password of database user from cmd arguments

    // check if DB_HOST and DB_PASSWORD are valid 
    if (DB_HOST.length==0){
        console.log("Database host must not be empty!");
        return;
    }
    if (DB_PASSWORD.length==0){
        console.log("Database user password must not be empty!");
        return;
    }


    show_welcome(PORT);
    start_server(PORT, DB_HOST, DB_USER, DB_NAME, DB_PASSWORD);
}

/**
 * get_dbhost_from_args searches cmd args and returns dbhost if in args, else ""
 * 
 * @returns argument
 */
function get_dbhost_from_args(): string {
    const args = Deno.args;
    const arg_key = "dbhost="; // key to search for

    // check each argument
    for (let i=0; i < args.length; i++) {
        const arg = args[i];
        if (arg.startsWith(arg_key) ){
            return arg.replace(arg_key, ""); // return arg without arg_key
        }
    }

    return "";
}


/**
 * get_dbpass_from_args searches cmd args and returns database user's password if in args, else ""
 * 
 * @returns argument
 */
 function get_dbpass_from_args(): string {
    const args = Deno.args;
    const arg_key = "dbpass="; // key to search for

    // check each argument
    for (let i=0; i < args.length; i++) {
        const arg = args[i];
        if (arg.startsWith(arg_key) ){
            return arg.replace(arg_key, ""); // return arg without arg_key
        }
    }

    return "";
}


/**
 * show_welcome prints some text
 * 
 * @param port
 */
function show_welcome(port: number) {
    console.log("Starting server...");
    console.log(`http://localhost:${port}\n`);
}


// program starts here
main();