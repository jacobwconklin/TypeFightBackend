# TypeFightBackend
Backend Server for TypeFight Web App

With MongoDB for VS Code Extention installed go to View -> Command Palete -> Connect With Connection String
and enter the connection string:
mongodb+srv://jacobyconklin:<password>@bigdata.9qbfcyn.mongodb.net/
substituting in the saved password to quickly view / manipulate database

TO COPY AND RUN REPO NEED:
.env file with fields: 
    DB_USER={Insert MongoDB Atlas Database Username}
    DB_PASS={Insert MongoDB Atlas Database Password}

To use require('referral-codes') need to run
    npm i node-fetch@2.6.1
    as new versions of node-fetch only support ESM

## Deployment

Deploy by installing Azure App Service extension, then from the command pallete go to azure sign in,
then use the command pallete to run azure deploy web app

## Notes

Client (front-end) should be expected to keep playerId and sessionId and should only need these
"keys" for each endpoint plus situational values. 