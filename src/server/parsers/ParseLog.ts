import { LogParser } from "logstf-parser";
import { EventsModule } from "../logmodules/EventModule";
import { LogModule } from "../logmodules/LogModule";
import { PlaysInModule } from "../logmodules/PlaysInModule";
import { PlayerModule } from "../logmodules/PlayerModule";
import { parentPort } from "worker_threads";

const parser = new LogParser()
parser.useCustomGameState();
parser.addModule(LogModule);
parser.addModule(PlayerModule);
parser.addModule(EventsModule);
//parser.addModule(PlayerClassModule);
parser.addModule(PlaysInModule);
parser.useSteam64Id();

function parseLines(lines: string[]) {
    const game = parser.parseLines(lines);
    return game;
}

parentPort?.on("message", async (param) => {
    const result = parseLines(param);
    parentPort?.postMessage(result.toJSON());
});
