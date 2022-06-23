# API Documentation

# POST /signup
### used for creating new users
___
## Request (JSON): 
`{username: "some username", password: "some password"}`
## Response (Text): 
`"sometext.sometext.sometext" (jwt as text)`
## Status Codes: 
- success: **200**
- error: **403** / **500**


# POST /login
### used for logging in existing users / get valid json web token for user
___
## Request (JSON): 
`{username: "some username", password: "some password"}`
## Response (Text): 
`"sometext.sometext.sometext" (jwt as text)`
## Status Codes: 
- success: **200**
- error: **403**


# DELETE /deluser
### delete existing user using token
___
## Request (JSON): 
`{token: "sometext.sometext.sometext"} (jwt)`
## Response (Text): 
`"some message" (e.g. error message)`
## Status Codes:
- success: **200**
- error: **403** / **500**


# POST /payments
### retrieve all payments of user (using valid jwt)
___
## Request (JSON): 
`{token: "sometext.sometext.sometext"} (jwt)`
## Response (JSON - list):
```
[{id: number,
payment_amount: number,
payment_category: "business" or "personal",
payment_date: "YYYY-MM-DD'T'hh:mm:sss'Z'",
payment_text: string,
payment_time: "HH:MM:SS",
user_id: number}, ...]
```
## Status Codes:
- success: **200**
- error: **403**


# POST /addpayments
### add new payment using valid token
___
## Request (JSON):
```
{
    token: "sometext.sometext.sometext" (jwt),
    payments: [date: "YYYY-MM-DD", amount: number, time: "HH:MM:SS", category: "business" or "personal", text: string}]
}
```
## Response (Text): 
`"some message" (e.g. error message)`
## Status Codes:
- success: **200**
- error: **403** / **500**


# DELETE /delpayments
### delete specific payments of user using valid token
___
## Request (JSON):
```
{
    token: "sometext.sometext.sometext" (jwt),
    payment_ids: [number, number, ...]
}
```
## Response (Text): 
`"some message" (e.g. error message)`
## Status Codes:
- success: **200**
- error: **403** / **500**