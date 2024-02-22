import { LogParser, defaultModules } from "logstf-parser";
import { parentPort } from "worker_threads";

const parser = new LogParser()
for (const module of Object.values(defaultModules)){
    parser.addModule(module);
}
//parser.useSteam64Id();

function parseLines(lines: string[]) {
    const game = parser.parseLines(lines);
    return game;
}

parentPort?.on("message", async (param) => {
    const result = parseLines(param);
    parentPort!.postMessage(result.toLogstf());
});
