import express from 'express';
const app = express();
import { graphqlHTTP } from 'express-graphql';
import cors from 'cors';
import cron from 'cron';
import { schema } from './server/GraphQl';
import { config } from './config'
import { updateDatabaseNames } from './server/DatabaseHelper'

const job = new cron.CronJob('*/5 * * * *', () => {
    console.log("***Updating Player names***");
    updateDatabaseNames();
});

job.start();

app.use(cors())

app.use('/graphql', graphqlHTTP({
    schema: schema,
    rootValue: schema,
    graphiql: true
}));

app.use(express.static("./website", { extensions: ['html'] }));

app.get('/', function (_req: express.Request, res: express.Response) {
    res.sendFile("website/landing.html", { root: "." });
});

app.listen(config.port, () => {
    console.log(`Server is listening on port ${config.port}`);
});