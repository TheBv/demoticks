import { GraphQLBoolean, GraphQLInputObjectType, GraphQLInt, GraphQLList, GraphQLNonNull, GraphQLObjectType, GraphQLSchema, GraphQLString } from "graphql";
import { batchParseLogs, updateMapTable, updatePlayer } from "./DatabaseHelper";
import SteamID from "steamid";
import { LRUCache } from 'lru-cache';
import { GraphQLBigInt } from './GraphQLBigInt'
import { events, players, Prisma, PrismaClient } from "@prisma/client";

//TODO: update query to include custom Op's
//TODO: return reasons: {success,markedAsDuplicate,duplicate,parsingError+reason}
//TODO: look into prisma-graphql stuff

const prisma = new PrismaClient()

const opMap = new Map<string, any>();
opMap.set("airshot", "gte")
opMap.set("killstreak", "gte");
opMap.set("advantageLost", "gte")
opMap.set("weapon", "like")


const nameMatchCache = new LRUCache<string, players[]>({ max: 500, ttl: 1000 * 60 * 4 });

const steamNameCache = new LRUCache<BigInt, players>({ max: 500, ttl: 1000 * 60 * 60 });

const mapidCache = new LRUCache<[string, number], number>({ max: 10000, ttl: 1000 * 60 * 5 });

const logidCache = new LRUCache<number, boolean>({ max: 10000 });

const eventType = new GraphQLObjectType({
    name: 'Event',
    description: 'An Event',
    fields: {
        eventid: {
            type: new GraphQLNonNull(GraphQLBigInt),
            description: 'The internal event id'
        },
        logid: {
            type: new GraphQLNonNull(GraphQLInt),
            description: 'The corresponding logid'
        },
        attacker: {
            type: new GraphQLNonNull(GraphQLBigInt),
            description: 'The steam64 id from the attacker'
        },
        victim: {
            type: GraphQLBigInt,
            description: 'The steam64 id from the victim'
        },
        killstreak: {
            type: GraphQLInt,
            description: 'The killstreak length querried as >='
        },
        headshot: {
            type: GraphQLBoolean,
            description: 'Wether the event should contain a headshot or not'
        },
        airshot: {
            type: GraphQLInt,
            description: 'Wether the event should contain an airshot or not'
        },
        medicDrop: {
            type: GraphQLBoolean,
            description: 'Wether the event should contain a medic drop or not'
        },
        second: {
            type: new GraphQLNonNull(GraphQLInt),
            description: 'The amount of seconds after the game started the event occured'
        },
        capture: {
            type: GraphQLInt,
            description: 'The point id of a captured point'
        },
        kill: {
            type: GraphQLBoolean,
            description: 'Wether the event should contain a kill or not'
        },
        backstab: {
            type: GraphQLBoolean,
            description: 'Wether the event should contain a backstab or not'
        },
        medicDeath: {
            type: GraphQLBoolean,
            description: 'Wether the event should contain a medic death or not'
        },
        advantageLost: {
            type: GraphQLInt,
            description: 'Specifies if the amount of seconds an advantage has been lost is >= some threshold'
        },
        chargeUsed: {
            type: GraphQLBoolean,
            description: 'Wether the event should contain a charge being used or not'
        },
        weapon: {
            type: GraphQLString,
            description: 'The string of the weapon used when the event was triggered'
        }
    }
});

const logType = new GraphQLObjectType({
    name: 'Log',
    description: 'A Log',
    fields: {
        logid: {
            type: new GraphQLNonNull(GraphQLInt),
            description: 'The corresponding logid'
        },
        date: {
            type: GraphQLInt,
            description: 'The unix timestamp the game has ended'
        },
        map: {
            type: GraphQLString,
            description: 'The map name of the game retrieved from logs.tf'
        },
        redPoints: {
            type: GraphQLInt,
            description: 'The amount of points the red team scored'
        },
        bluePoints: {
            type: GraphQLInt,
            description: 'The amount of points the blue team scored'
        },
        timeTaken: {
            type: GraphQLInt,
            description: 'The length of the game'
        },
        playeramount: {
            type: GraphQLInt,
            description: 'The amount of players that at some point entered and played in the game'
        },
        official: {
            type: GraphQLBoolean,
            description: 'Weither the game was an official or not **CURRENTLY UNUSED**'
        },
        events: {
            type: new GraphQLList(eventType),
            description: 'A list of game events that occured in that match given the search querries'
        }
    }
})

const eventInput = new GraphQLInputObjectType({
    name: 'EventInput',
    description: 'An Event',
    fields: {
        eventid: {
            type: GraphQLInt,
            description: 'The internal event id'
        },
        logid: {
            type: GraphQLInt,
            description: 'The corresponding logid'
        },
        attacker: {
            type: GraphQLBigInt,
            description: 'The steam64 id from the attacker'
        },
        victim: {
            type: GraphQLBigInt,
            description: 'The steam64 id from the victim'
        },
        killstreak: {
            type: GraphQLInt,
            description: 'The killstreak length querried as >='
        },
        headshot: {
            type: GraphQLBoolean,
            description: 'Wether the event should contain a headshot or not'
        },
        airshot: {
            type: GraphQLInt,
            description: 'Wether the event should contain an airshot or not'
        },
        medicDrop: {
            type: GraphQLBoolean,
            description: 'Wether the event should contain a medic drop or not'
        },
        second: {
            type: GraphQLInt,
            description: 'The amount of seconds after the game started the event occured'
        },
        capture: {
            type: GraphQLInt,
            description: 'The point id of a captured point'
        },
        kill: {
            type: GraphQLBoolean,
            description: 'Wether the event should contain a kill or not'
        },
        backstab: {
            type: GraphQLBoolean,
            description: 'Wether the event should contain a backstab or not'
        },
        medicDeath: {
            type: GraphQLBoolean,
            description: 'Wether the event should contain a medic death or not'
        },
        advantageLost: {
            type: GraphQLInt,
            description: 'Specifies if the amount of seconds an advantage has been lost is >= some threshold'
        },
        chargeUsed: {
            type: GraphQLBoolean,
            description: 'Wether the event should contain a charge being used or not'
        },
        weapon: {
            type: GraphQLString,
            description: 'The string of the weapon used when the event was triggered'
        }
    }
})

const player = new GraphQLObjectType({
    name: 'PlayerInput',
    description: 'Attributes of a player you want to receive data from',
    fields: {
        steam64: {
            type: GraphQLBigInt,
        },
        name: {
            type: GraphQLString,
        },
        etf2lName: {
            type: GraphQLString
        },
        ugcName: {
            type: GraphQLString
        },
        logstfName: {
            type: GraphQLString
        }
    }
})

export const schema = new GraphQLSchema({
    query: new GraphQLObjectType({
        name: 'Query',
        fields: {
            event: {
                type: new GraphQLList(logType),
                args: {
                    logid: {
                        type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(GraphQLInt))),
                        description: 'The corresponding logid'
                    },
                    events: {
                        type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(eventInput)))
                    }

                },
                resolve: async (parent: any, args: any) => {
                    //TODO: Update the map-check part
                    const maxLogid = Math.max(...args.logid);
                    const primaryAttacker : string = args.events[0].attacker
                    const key : [string, number] = [primaryAttacker, maxLogid]
                    const mapValues = await queryWithCache(mapidCache, key, {
                        where: {
                            logid: maxLogid
                        }
                    }, prisma.maps)
                    if (!mapValues) {
                        try {
                            const steam64 = new SteamID(args.events[0].attacker)
                            if (steam64.isValid())
                                await updateMapTable(steam64.getSteamID64(), 10000);
                        }
                        catch { }
                    }
                    const maps = await prisma.maps.findMany({
                        where: {
                            logid: { in: args.logid }
                        }
                    })
                    const returny: any[] = [];
                    (await prisma.logs.findMany({
                        where: {
                            logid: { in: args.logid },
                        },
                        include: {
                            events: {
                                where: { OR: args.events.map((event: events) => { return { AND: applyOp(event) } }) },
                                orderBy: [{ attacker: 'desc' }, { second: 'asc' }]
                            }
                        },
                        orderBy: [{ logid: 'asc' }]
                    })).forEach((result: any) => {
                        result.map = maps.find((map) => map.logid == result.logid)?.mapName;
                        if (result.events.length > 0)
                            returny.push(result);
                    })
                    return returny;
                }
            },
            player: {
                type: new GraphQLList(player),
                args: {
                    steam64: {
                        type: GraphQLBigInt
                    },
                    name: {
                        type: GraphQLString
                    },
                    etf2lName: {
                        type: GraphQLString
                    },
                    ugcName: {
                        type: GraphQLString
                    },
                    logstfName: {
                        type: GraphQLString
                    }
                },
                resolve: async (parent: any, args: any) => {
                    //If a steamid is specified query by that
                    if (args.steam64) {
                        try {
                            const steamId = new SteamID(args.steam64);
                            if (steamId.isValid()) {
                                const player = await queryWithCache(steamNameCache,
                                    BigInt(steamId.getSteamID64()), {
                                    where: { steam64: BigInt(steamId.getSteamID64()) }
                                }, prisma.players)
                                if (player)
                                    return [player]
                                //TODO: function should possibly return player instead
                                //TODO: use bigint internally?
                                if (await updatePlayer(steamId.getSteamID64())) {
                                    const updatedPlayer = (await prisma.players.findFirst({
                                        where: { steam64: BigInt(steamId.getSteamID64()) }
                                    }))
                                    if (updatedPlayer)
                                        return [updatedPlayer];
                                }

                            }
                        }
                        catch (err) {
                            console.error(err)
                        }
                    }
                    //If we're doing a general name lookup use that
                    if (args.name) {
                        return queryWithCacheMany(nameMatchCache, args.name, {
                            where: {
                                name: { contains: args.name }
                            }
                        }, prisma.players)
                    }
                    //Otherwise for every org name
                    return await prisma.players.findMany({
                        where: {
                            OR: [getPlayerData(args)]
                        }
                    })
                }
            },
            addLog: {
                type: new GraphQLList(GraphQLBoolean),
                args: {
                    logid: {
                        type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(GraphQLInt)))
                    }
                },
                resolve: async (parent: any, args: any) => {
                    let logids: number[] = args.logid;
                    let unCachedIds: number[] = [];
                    for (let logid of logids) {
                        if (!logidCache.has(logid))
                            unCachedIds.push(logid);
                    }
                    if (unCachedIds.length == 0)
                        return [true];
                    const logsFound = (await prisma.logs.findMany({
                        where: {
                            logid: { in: unCachedIds }
                        },
                        select: {
                            logid: true
                        }
                    })).map((log) => log.logid);
                    unCachedIds = unCachedIds.filter(logid => { logidCache.set(logid, true); return !logsFound.includes(logid) });
                    const duplicateLogsFound = (await prisma.duplicatelogids.findMany({
                        where: {
                            logid: { in: unCachedIds }
                        },
                        select: {
                            logid: true
                        }
                    })).map((log) => log.logid);
                    unCachedIds = unCachedIds.filter(logid => { logidCache.set(logid, true); return !duplicateLogsFound.includes(logid) });
                    return batchParseLogs(unCachedIds);
                }
            }
        }
    }),
});

async function queryWithCache<K extends {}, V extends {}>(cache: LRUCache<K, V>, key: K, query: any, table: any): Promise<V> {
    if (cache.get(key) != undefined)
        return cache.get(key)!
    const dbResult = await table.findFirst(query);
    if (dbResult)
        cache.set(key, dbResult)
    return dbResult
}

async function queryWithCacheMany<K extends {}, V extends {}>(cache: LRUCache<K, V>, key: K, query: any, table: any): Promise<V> {
    if (cache.get(key) != undefined)
        return cache.get(key)!
    const dbResult = await table.findMany(query);
    if (dbResult)
        cache.set(key, dbResult)
    return dbResult
}

function getPlayerData(args: any) {
    const data: Prisma.playersWhereInput = {};

    if (args.etf2lName) {
        data.etf2lName = { contains: args.etf2lName }
    }
    if (args.ugcName) {
        data.ugcName = { contains: args.ugcName }
    }
    if (args.logstfName) {
        data.logstfName = { contains: args.logstfName }
    }

    return data;
}

function applyOp(event: events) {
    interface LooseObject {
        [key: string]: any
    }
    const data: LooseObject = {};
    for (let [key, value] of Object.entries(event)) {
        if (typeof value == 'string') {
            value = BigInt(value)
        }
        if (opMap.has(key)) {
            if (opMap.get(key) == "like")
                data[key] = { like: value }
            else if (opMap.get(key) == "gte")
                data[key] = { gte: value }
            else
                data[key] = { equals: value }
        }
        else {
            data[key] = value
        }
    }
    return data
}