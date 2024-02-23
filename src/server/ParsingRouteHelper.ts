import { StaticPool } from 'node-worker-threads-pool';
import axios, { AxiosError } from 'axios';
import JSZip from 'jszip';
import './parsers/ParseLogDefault';
import { config } from '../../config';

const staticPool = new StaticPool({
    size: config.workerThreads,
    task: __dirname + "/parsers/ParseLogDefault.js",
});

async function pushLog(lines: string[]): Promise<{ events: any, game: any, players: any, playsIn: any }> {
    return staticPool.exec(lines);
}

export async function parseLog(logid: number): Promise<any> {
    try {
        const response = await axios.get(`https://logs.tf/logs/log_${logid}.log.zip`, { responseType: 'arraybuffer' })
        const zipData = await JSZip.loadAsync(response.data)
        const log1 = await zipData.file(`log_${logid}.log`);
        if (log1) {
            const log = await log1.async("text");
            const logLines = log.split("\n")
            const result = await pushLog(logLines);
            return result;
        }
    } catch (error) {
        if (!(error instanceof AxiosError)) {
            console.error(`Couldn't fetch zip file with id ${logid}. Reason:\n `, error);
        }
        return {
            success: false,
            statusCode: error instanceof AxiosError ? (error as AxiosError).response?.status : undefined,
            reason: 'Couldn\'t fetch zip file'
        };

    }
    return {
        success: false,
        reason: 'Corrupt zip file'
    };
}