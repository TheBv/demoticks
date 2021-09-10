const express = require('express');
const app = express();
const graphqlHTTP = require('express-graphql');
const cors = require('cors')
import {schema} from './server/GraphQl';
//const database = require("./server/Database"); //Loads the database script
import {config} from './config'
import * as test from './tests'
//test.runTest()
import {parseLog, updatePlayer} from './server/DatabaseHelper'
import { DuplicateLog, Log } from "./server/DatabaseModel";
//updatePlayer("76561198079513105").then((res)=>console.log(res)).catch((err)=>console.log(err));
app.use(cors())
/*app.use(function (_req : any, res : any, next : any) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});*/
app.use('/graphql', graphqlHTTP({
    schema: schema,
    rootValue: schema,
    graphiql: true
}));
app.use(express.static("./website", { extensions: ['html'] }));
app.get('/', function (_req : any, res : any) {
    res.sendfile("./website/landing.html");
});
app.listen(config.port, () => {
    console.log(`Server is listening on port ${config.port}`);
    console.log(`MYSQLServer host: ${config.MySQLHost}`);
});