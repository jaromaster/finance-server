# API Documentation

# POST /signup
### used for creating new users
#### Request: {username: "some username", password: "some password"}
#### Response: "sometext.sometext.sometext" (jwt as text)
#### Status Codes: 
- success: 200
- error: 403 / 500


# POST /login
### used for logging in existing users / get valid json web token for user
#### Request: {username: "some username", password: "some password"}
#### Response: "sometext.sometext.sometext" (jwt as text)
#### Status Codes: 
- success: 200
- error: 403


# DELETE /deluser
### delete existing user using token
#### Request: {token: "sometext.sometext.sometext"} (jwt)
#### Response: "some message" (e.g. error message)
#### Status Codes:
- success: 200
- error: 403 / 500


# POST /payments
### retrieve all payments of user (using valid jwt)
#### Request: {token: "sometext.sometext.sometext"} (jwt)
#### Response: list of json-objects
[{id: number, <br>
payment_amount: number, <br>
payment_category: "business" or "personal", <br>
payment_date: "YYYY-MM-DD'T'hh:mm:sss'Z'", <br>
payment_text: string, <br>
payment_time: "HH:MM:SS", <br>
user_id: number}, ...]
#### Status Codes:
- success: 200
- error: 403


# POST /addpayments
### add new payment using valid token
#### Request: token + list of json objects
{
    token: "sometext.sometext.sometext" (jwt), <br>
    payments: [date: "YYYY-MM-DD", amount: number, time: "HH:MM:SS", category: "business" or "personal", text: string}]
}
#### Response: "some message" (e.g. error message)
#### Status Codes:
-- success: 200
-- error: 403 / 500


# DELETE /delpayments
### delete specific payments of user using valid token
#### Request: token + list of payment ids
{
    token: "sometext.sometext.sometext" (jwt), <br>
    payment_ids: [number, number, ...]
}
#### Response: "some message" (e.g. error message)
#### Status Codes:
-- success: 200
-- error: 403 / 500