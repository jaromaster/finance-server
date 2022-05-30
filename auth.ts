import { create, getNumericDate, Payload, verify } from "https://deno.land/x/djwt@v2.4/mod.ts";


/**
 * generate_key creates new key for cryptography
 */
export async function generate_key(): Promise<CryptoKey> {

    const key = await crypto.subtle.generateKey(
        {
            name: "HMAC",
            hash: "SHA-512"
        },
        true,
        ["sign", "verify"]
    )

    return key;
}


/**
 * create_jwt creates new json web token containing user_id
 * 
 * @param key
 * @param user_id
 */
export async function create_jwt(key: CryptoKey, user_id: number): Promise<string> {
    
    const jwt = await create(
        {alg: "HS512", typ: "JWT"}, // header
        {user_id: user_id, exp: getNumericDate(60 * 60)}, // payload with user_id and expiration (1h)
        key
    );

    return jwt;
}


/**
 * verify_jwt verifies json web tokens and returns their payload, if jwt invalid: error
 * 
 * @param jwt 
 * @param key 
 */
export async function verify_jwt(jwt: string, key: CryptoKey): Promise<Payload> {
    
    const payload = await verify(jwt, key); // verify and return payload
    return payload;    
}



// documentation/tutorial for jwt:
// https://deno.land/x/djwt@v2.4