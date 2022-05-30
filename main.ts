import {start_server} from "./server.ts";


/**
 * main is the entry point to server 
 */
function main() {
    const PORT = 8000;


    show_welcome(PORT);
    start_server(PORT);
}


/**
 * show_welcome prints some text
 * 
 * @param port
 */
function show_welcome(port: number) {
    console.log();
    console.log("Starting server...");
    console.log(`http://localhost:${port}\n`);

}


// program starts here
main();