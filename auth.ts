import { create, getNumericDate, Payload, verify } from "https://deno.land/x/djwt@v2.4/mod.ts";
import { crypto } from "https://deno.land/std@0.144.0/crypto/mod.ts";
import { encode } from "https://deno.land/std@0.144.0/encoding/hex.ts";

/**
 * generate_key creates new key for cryptography
 * 
 * @returns key
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
 * @returns jwt
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
 * @returns payload
 */
export async function verify_jwt(jwt: string, key: CryptoKey): Promise<Payload> {
    
    const payload = await verify(jwt, key); // verify and return payload
    return payload;    
}


/**
 * hash_password uses sha3-512 to hash password and return as hexadecimal string
 * 
 * @param password
 * @returns hash as hex string
 */
export async function hash_password(password: string): Promise<string> {
    const hash: ArrayBuffer = await crypto.subtle.digest("SHA3-512", new TextEncoder().encode(password)); // hash the password
    const hash_as_string: string = new TextDecoder().decode(encode(new Uint8Array(hash))); // convert to hex string

    return hash_as_string;
}

// documentation/tutorial for jwt:
// https://deno.land/x/djwt@v2.4