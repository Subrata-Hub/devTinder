# Devtinder API

## Auth Router

- POST/signup
- POST/login
- POST/logout

## Profile Router

- GET / profile/view
- PATCH /profile/edit
- PATCH /profile/password

## ConnectionRequestRouter

- POST /request/send/:status/:userId
<!-- - POST /request/send/ignored/:userId -->
- POST /request/review/:status/:requestId
<!-- - POST /request/review/rejected/:requestId -->

## UserRouter

- GET /user/conections
- GET /user/requests
- GET /user/feed
