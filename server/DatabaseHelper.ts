import axios from 'axios';
import JSZip from 'jszip';
import { parseAndPopulateDatabase } from './LogParsing'
import { fetchName, fetchNames } from './FetchNames'
import { defaultMysqlMap, defaultMysqlPlayer, IMysqlMap, IMysqlPlayer, Map, Player } from './DatabaseModel'
import SteamId from 'steamid'

export async function updateDatabaseNames(): Promise<boolean> {
    //TODO: make limit configurable
    const players = await Player.findAll({
        where: { name: null },
        limit: 10
    })

    const mysqlPlayers: IMysqlPlayer[] = [];
    //No idea why I have to do this but the steam64 id seems to be null otherwise when bulk creating
    for (const player of players) {
        const mysqlPlayer = defaultMysqlPlayer();
        mysqlPlayer.steam64 = player.steam64;
        mysqlPlayers.push(mysqlPlayer);
    }
    await fetchNames(mysqlPlayers);
    await Player.bulkCreate(mysqlPlayers, {
        updateOnDuplicate: ["name", "etf2lName", "logstfName", "ozFortressName", "ugcName"]
    }).catch((err) => { console.error(err); return false });
    return true;
}

/*export async function updatePlayerSteamId3(steamId3: string): Promise<boolean> {
    return updatePlayer(new SteamId(steamId3).getSteamID64())
}*/

export async function updatePlayer(steam64: string): Promise<boolean> {
    const player = defaultMysqlPlayer()
    player.steam64 = steam64;
    await fetchName(player);
    await Player.upsert(player);
    return true;
}

/*export async function updatePlayersSteamId3(steamId3: string[]): Promise<boolean> {
    return updatePlayers(steamId3.map((id) => new SteamId(id).getSteamID64()));
}*/

export async function updatePlayers(steam64: string[]): Promise<boolean> {
    const players = steam64.map((steam64) => {
        const player = defaultMysqlPlayer()
        player.steam64 = steam64;
        return player;
    })
    await fetchNames(players);
    await Player.bulkCreate(players, {
        updateOnDuplicate: ["etf2lName", "logstfName", "ozFortressName", "ugcName"]
    }).catch((err) => { console.error(err); return false });
    return true;
}

export async function updateMapTable(steam64: string, limit: number): Promise<boolean> {
    try {
        const response: any = (await axios.get(`https://logs.tf/api/v1/log?player=${steam64}&limit=${limit}`)).data
        if (!response.success) {
            return false;
        }
        const maps: IMysqlMap[] = []
        for (const log of response.logs) {
            const mysqlMap = defaultMysqlMap();
            mysqlMap.logid = log.id;
            mysqlMap.mapName = log.map;
            maps.push(mysqlMap);
        }
        await Map.bulkCreate(maps, {
            ignoreDuplicates: true
        });
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