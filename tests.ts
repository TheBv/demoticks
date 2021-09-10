import * as LogParsing from './server/LogParsing';
import * as fs from 'fs'

export function runTest(){
    try{
    const file = fs.readFileSync("./server/tests/log_2088801.log", "utf-8").split("\n");
    LogParsing.parseAndPopulateDatabase(file, 2088801);
    }
    catch (err) {
        console.error(err)
    }
}