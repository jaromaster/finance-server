import { create } from "https://deno.land/x/djwt@v2.4/mod.ts";


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
export async function create_jwt(key: CryptoKey, user_id: number): Promise<String> {
    
    const jwt = await create(
        {alg: "HS512", typ: "JWT"}, // header
        {user_id: user_id}, // payload
        key
    );

    return jwt;
}

// documentation/tutorial for jwt (verification, decoding, expiration...):
// https://deno.land/x/djwt@v2.4