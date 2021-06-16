import {LogParser} from 'logstf-parser'
import PlayerClassStatsModule from "logstf-parser/lib/cjs/modules/PlayerClassStatsModule";
import { PlaysIn } from "./DatabaseModel";
import { EventsModule } from "./logmodules/EventModule";
import { LogModule } from "./logmodules/LogModule";
import { PlaysInModule } from "./logmodules/PlaysInModule";
import {IMysqlLog} from './DatabaseModel'
//Accepts a logfile
//Parses it with the modules added
//
const parser = new LogParser()
parser.addModule(EventsModule)
parser.addModule(LogModule)
parser.addModule(PlayerClassStatsModule)
parser.addModule(PlaysInModule)
export async function parseAndPopulateDatabase(lines: string[]): Promise<boolean>{
    const game = parser.parseLines(lines);
    const logModule = game.modules.find(a => {a instanceof LogModule})
    if (logModule instanceof LogModule){
        logModule.toJSON()
    }
    
    await PlaysIn.bulkCreate(game.modules[0]);
    return true
}
