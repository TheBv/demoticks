import express from 'express';
const app = express();
import { createHandler } from 'graphql-http/lib/use/express';
import cors from 'cors';
import { schema } from './server/GraphQl';
import { config } from '../config'
import { updateDatabaseNames } from './server/DatabaseHelper'
import { parseLog } from './server/ParsingRouteHelper'

import './server/parsers/ParseLog';
import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import { CronJob } from 'cron';

const job = new CronJob('*/5 * * * *', () => {
    console.log("***Updating Player names***");
    updateDatabaseNames();
});

job.start();

app.use(cors())

app.use('/graphql', createHandler({
    schema: schema,
    rootValue: schema,
}));

app.use(express.static("./src/website", { extensions: ['html'] }));

app.get('/', function (_req: express.Request, res: express.Response) {
    res.sendFile("./src/website/landing.html", { root: "." });
});

const prisma = new PrismaClient();

app.get('/api/player', async (req: express.Request, res: express.Response) => {
    // This is great code I swear!
    const response = await axios.get(`https://trends.tf/api/v1/logs${(req as any)._parsedUrl.search}`, req);
    res.send(response.data);
});

app.get('/api/parse/:logid', async (req: express.Request, res: express.Response) => {
    const logid = req.params.logid;
    if (isNaN(parseInt(logid))) {
        res.status(400).send("Invalid logid");
        return;
    }
    const value = await prisma.parsed_logs.findFirst({ where: { id: parseInt(logid) } })
    if (value) {
        res.send(value.json);
        return;
    }

    const result = await parseLog(parseInt(logid));
    await prisma.parsed_logs.create({ data: { id: parseInt(logid), json: result } });
    res.send(result);
});



app.listen(config.port, () => {
    console.log(`Server is listening on port ${config.port}`);
});