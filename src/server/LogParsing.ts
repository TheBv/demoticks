import { LogParser } from 'logstf-parser'
import { EventsModule } from "./logmodules/EventModule";
import { LogModule } from "./logmodules/LogModule";
import { PlaysInModule } from "./logmodules/PlaysInModule";
import { PlayerModule } from "./logmodules/PlayerModule";
import { PlayerClassModule } from "./logmodules/PlayerClassModule";
import { PrismaClient, logs as IMysqlLog, Prisma } from '@prisma/client'
import { Game } from "logstf-parser/lib/cjs/Game";

const prisma = new PrismaClient()

export interface IJsonLogData {
    playsIn: Prisma.plays_inCreateManyInput[],
    events: Prisma.eventsCreateManyInput[],
    game: IMysqlLog,
    players: Prisma.playersCreateManyInput[]
}

export async function parseAndPopulateDatabaseJson(json: IJsonLogData, logid: number): Promise<boolean> {
    await prisma.players.createMany({ data: json.players, skipDuplicates: true })
    
    const logData = json.game
    logData.logid = logid;
    const playsInData = json.playsIn;
    const eventsData = json.events;
    try {
        await prisma.logs.create({
            data: {
                logid: logData.logid,
                date: logData.date,
                redPoints: logData.redPoints,
                bluePoints: logData.bluePoints,
                timeTaken: logData.timeTaken,
                playeramount: logData.playeramount,
                official: logData.official,
                plays_in: {
                    createMany: {
                        data: playsInData
                    }
                },
                events: {
                    createMany: {
                        data: eventsData
                    }
                }
            }
        });
    }
    catch (err: any) {
        if (err.code == 'P2002' && err.meta.target == 'duplicateLogs') {
            prisma.logs.findFirst({
                where: {
                    date: logData.date,
                    redPoints: logData.redPoints,
                    bluePoints: logData.bluePoints,
                    timeTaken: logData.timeTaken,
                    playeramount: logData.playeramount
                }
            }).then((value) => {
                if (!value) return
                prisma.duplicatelogids.create({ data: { logid: logid, duplicateof: value.logid } })
            }).catch(err => { console.error(err); return false });
            return true;
        }
        else {
            console.error(err);
            return false;
        }
    }
    // TODO: playerClassModule
    return true
}

export async function parseAndPopulateDatabaseGame(game: Game, logid: number): Promise<boolean> {
    const logModule = game.modules.find(a => { return a instanceof LogModule })
    const playerModule = game.modules.find(a => { return a instanceof PlayerModule })
    const eventsModule = game.modules.find(a => { return a instanceof EventsModule })
    const playerClassModule = game.modules.find(a => { return a instanceof PlayerClassModule })
    const playsInModule = game.modules.find(a => { return a instanceof PlaysInModule })
    if (playerModule instanceof PlayerModule) {
        await prisma.players.createMany({ data: playerModule.toJSON(), skipDuplicates: true })
    }
    if (logModule instanceof LogModule && playsInModule instanceof PlaysInModule && eventsModule instanceof EventsModule) {
        const logData = logModule.toJSON()
        logData.logid = logid;
        const playsInData = playsInModule.toJSON();
        const eventsData = eventsModule.toJSON();
        try {
            await prisma.logs.create({
                data: {
                    logid: logData.logid,
                    date: logData.date,
                    redPoints: logData.redPoints,
                    bluePoints: logData.bluePoints,
                    timeTaken: logData.timeTaken,
                    playeramount: logData.playeramount,
                    official: logData.official,
                    plays_in: {
                        createMany: {
                            data: playsInData
                        }
                    },
                    events: {
                        createMany: {
                            data: eventsData
                        }
                    }
                }
            });
        }
        catch (err: any) {
            if (err.code == 'P2002' && err.meta.target == 'duplicateLogs') {
                prisma.logs.findFirst({
                    where: {
                        date: logData.date,
                        redPoints: logData.redPoints,
                        bluePoints: logData.bluePoints,
                        timeTaken: logData.timeTaken,
                        playeramount: logData.playeramount
                    }
                }).then((value) => {
                    if (!value) return
                    prisma.duplicatelogids.create({ data: { logid: logid, duplicateof: value.logid } })
                }).catch(err => console.error(err));
                return true;
            }
            else {
                console.error(err);
                return false;
            }
        }
    }
    if (playerClassModule instanceof PlayerClassModule) {
        //TODO:
        //await prisma.players.createMany({data: playerClassModule.toJSON()})
    }
    return true
}

