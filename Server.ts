const express = require('express');
const app = express();
const graphqlHTTP = require('express-graphql');
const GraphQlInteractions = require("./GraphQlInteractions");
const database = require("./database"); //Loads the database script
const config = require("./config");

app.use(function (_req : any, res : any, next : any) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});
app.use('/graphql', graphqlHTTP({
    schema: GraphQlInteractions.schema,
    rootValue: GraphQlInteractions.root,
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
//Make sure we log the file/line
//Use console.trace() instead
/*['warn', 'error'].forEach((methodName) => {
    const originalMethod : any = console[methodName];
    console[methodName] = (...args: any[]) => {
        let initiator = 'unknown place';
        try {
            throw new Error();
        } catch (e) {
            if (typeof e.stack === 'string') {
                let isFirst = true;
                for (const line of e.stack.split('\n')) {
                    const matches = line.match(/^\s+at\s+(.*)/);
                    if (matches) {
                        if (!isFirst) { // first line - current function
                            // second line - caller (what we are looking for)
                            initiator = matches[1];
                            break;
                        }
                        isFirst = false;
                    }
                }
            }
        }
        originalMethod.apply(console, [...args, '\n', `  at ${initiator}`]);
    };
});*/