# How to run server

## deno run --allow-net --allow-read main.ts dbhost="some ip" dbpass="some password"

# How to run tests

## deno test --allow-net --allow-read --unsafely-ignore-certificate-errors -- dbhost="some ip" dbpass="some password"

#### dbhost...hostname of database
#### dbpass...password of database user