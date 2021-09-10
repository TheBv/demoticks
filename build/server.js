"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require('express');
const app = express();
const graphqlHTTP = require('express-graphql');
const cors = require('cors');
const GraphQl_1 = require("./server/GraphQl");
//const database = require("./server/Database"); //Loads the database script
const config_1 = require("./config");
//updatePlayer("76561198079513105").then((res)=>console.log(res)).catch((err)=>console.log(err));
app.use(cors());
/*app.use(function (_req : any, res : any, next : any) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});*/
app.use('/graphql', graphqlHTTP({
    schema: GraphQl_1.schema,
    rootValue: GraphQl_1.schema,
    graphiql: true
}));
app.use(express.static("./website", { extensions: ['html'] }));
app.get('/', function (_req, res) {
    res.sendfile("./website/landing.html");
});
app.listen(config_1.config.port, () => {
    console.log(`Server is listening on port ${config_1.config.port}`);
    console.log(`MYSQLServer host: ${config_1.config.MySQLHost}`);
});
//# sourceMappingURL=Server.js.map