import axios from 'axios';
import JSZip from 'jszip';
import { parseAndPopulateDatabase } from './LogParsing'
import { fetchName, fetchNames } from './FetchNames'
import { defaultMap, defaultPlayer } from "./DatabaseModelPrisma";
import { players, PrismaClient, maps } from "@prisma/client";


const prisma = new PrismaClient()

export async function updateDatabaseNames(): Promise<boolean> {
    //TODO: make limit configurable
    const players = await prisma.players.findMany({
        where: { name: null },
        take: 10,
        orderBy: { updatedAt: 'asc' }
    })
    return await updatePlayers(players);
}

export async function updatePlayer(steam64: string): Promise<boolean> {
    const player = defaultPlayer()
    player.steam64 = BigInt(steam64);
    await fetchName(player);
    await prisma.players.upsert({
        create: player,
        update: player,
        where: { steam64: player.steam64 }
    });
    return true;
}


export async function updatePlayers(players: players[]): Promise<boolean> {
    await fetchNames(players);
    for (const player of players) {
        await prisma.players.upsert({
            create: player,
            update: player,
            where: { steam64: player.steam64 }
        })
    }
    return true;
}

export async function updateMapTable(steam64: string, limit: number): Promise<boolean> {
    try {
        const response: any = (await axios.get(`https://logs.tf/api/v1/log?player=${steam64}&limit=${limit}`)).data
        if (!response.success) {
            return false;
        }
        const maps: maps[] = []
        for (const log of response.logs) {
            const mysqlMap = defaultMap();
            mysqlMap.logid = log.id;
            mysqlMap.mapName = log.map;
            maps.push(mysqlMap);
        }
        await prisma.maps.createMany({ data: maps, skipDuplicates: true });
        return true;
    }
    catch (error) {
        console.error(error);
        return false;
    }
}

export async function batchParseLogs(logid: number[]): Promise<boolean[]> {
    const requests: Promise<boolean>[] = []
    for (const log of logid) {
        requests.push(parseLog(log));
    }
    const results: boolean[] = [];
    const promiseResults = await Promise.allSettled(requests);
    promiseResults.forEach((promiseSettled) => {
        if (promiseSettled.status === 'rejected') {
            console.error("Failed to parse logfile. Reason:\n ", promiseSettled.reason)
            results.push(false);
        }
        else {
            results.push(promiseSettled.value);
        }
    })
    return results;
}

export async function parseLog(logid: number): Promise<boolean> {
    try {
        const response = await axios.get(`https://logs.tf/logs/log_${logid}.log.zip`, { responseType: 'arraybuffer' })
        const zipData = await JSZip.loadAsync(response.data)
        const log1 = await zipData.file(`log_${logid}.log`);
        if (log1) {
            const log = await log1.async("text");
            const logLines = log.split("\n")
            return await parseAndPopulateDatabase(logLines, logid);

        }
    } catch (error) {
        console.error(`Failed to parse logfile with id ${logid}. Reason:\n `, error);
        return false;
    }
    return false;
}