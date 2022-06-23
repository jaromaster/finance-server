# How to create server certificate and private key

## store in /keys folder

## sudo openssl req -new -newkey rsa:2048 -nodes -keyout server.key -out server.csr

## sudo openssl x509 -req -in server.csr -signkey server.key -out server.crt