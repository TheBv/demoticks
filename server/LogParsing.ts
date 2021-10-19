import { LogParser } from 'logstf-parser'
import { DuplicateLog, Event, IMysqlDuplicateLog, IMysqlEvent, IMysqlLog, IMysqlPlayer, IMysqlPlaysIn, Log, Player, PlaysIn } from "./DatabaseModel";
import { EventsModule } from "./logmodules/EventModule";
import { LogModule } from "./logmodules/LogModule";
import { PlaysInModule } from "./logmodules/PlaysInModule";
import { PlayerModule } from "./logmodules/PlayerModule";
import { PlayerClassModule } from "./logmodules/PlayerClassModule";
import { UniqueConstraintError } from 'sequelize';


interface LogData {
    logData: IMysqlLog[],
    players: IMysqlPlayer[],
    playsIn: IMysqlPlaysIn[],
    events: IMysqlEvent[]
}

const parser = new LogParser()
parser.useCustomGameState();
parser.addModule(LogModule);
parser.addModule(PlayerModule);
parser.addModule(EventsModule);
parser.addModule(PlayerClassModule);
parser.addModule(PlaysInModule);
parser.useSteam64Id();

export async function parseAndPopulateDatabase(lines: string[], logid: number): Promise<boolean> {
    const game = parser.parseLines(lines);
    const logModule = game.modules.find(a => { return a instanceof LogModule })
    const playerModule = game.modules.find(a => { return a instanceof PlayerModule })
    const eventsModule = game.modules.find(a => { return a instanceof EventsModule })
    const playerClassModule = game.modules.find(a => { return a instanceof PlayerClassModule })
    const playsInModule = game.modules.find(a => { return a instanceof PlaysInModule })
    if (logModule instanceof LogModule) {
        const logData = logModule.toJSON()
        logData.logid = logid;
        try {
            await Log.create(logData)
        }
        catch (err: any) {
            if (err instanceof UniqueConstraintError) {
                const subError = err.errors[0];
                if (subError.validatorKey == 'not_unique' && subError.path == 'logs.dublicateLogs') {
                    Log.findOne({
                        where: {
                            date: logData.date,
                            redPoints: logData.redPoints,
                            bluePoints: logData.bluePoints,
                            timeTaken: logData.timeTaken,
                            playeramount: logData.playeramount
                        },
                        attributes: ["logid"]
                    }).then((duplicateOf: Log | null) => {
                        if (!duplicateOf) return;
                        const duplicateLog: IMysqlDuplicateLog = {
                            logid: logid,
                            duplicateof: duplicateOf.logid
                        }
                        DuplicateLog.create(duplicateLog).catch(err => { console.log(err) });
                    }).catch(err => console.error(err));
                    return false;
                }
            }
            console.error(err);
            return false;
        }
    }
    if (playerModule instanceof PlayerModule) {
        const players = playerModule.toJSON();
        try {
            await Player.bulkCreate(players, {
                ignoreDuplicates: true
            })
        }
        catch (err) {
            console.error(err);
            return false;
        }
    }
    if (playsInModule instanceof PlaysInModule) {
        const playsInData = playsInModule.toJSON();
        playsInData.forEach(playsIn => { playsIn.logid = logid })
        await PlaysIn.bulkCreate(playsInData).catch((err) => console.error(err))
    }
    if (eventsModule instanceof EventsModule) {
        const eventsData = eventsModule.toJSON();
        eventsData.forEach(event => { event.logid = logid })
        await Event.bulkCreate(eventsData).catch((err) => console.error(err))
    }
    if (playerClassModule instanceof PlayerClassModule) {
        //TODO:
        //await Player.bulkCreate(playerClassModule.toJSON())
    }
    return true
}

async function populateDatabase(logData: LogData) {

}
