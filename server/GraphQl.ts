import { GraphQLBoolean, GraphQLInputObjectType, GraphQLInt, GraphQLList, GraphQLNonNull, GraphQLObjectType, GraphQLSchema, GraphQLString } from "graphql";
import { DuplicateLog, Event, IMysqlEvent, Log, Map as MysqlMap, Player, sequelize } from './DatabaseModel';
import { Op } from 'sequelize';
import { batchParseLogs, updateMapTable, updatePlayer } from "./DatabaseHelper";
import SteamID from "steamid";
import LRU from 'lru-cache';
const dataloader = require("dataloader-sequelize");
const EXPECTED_OPTIONS_KEY = dataloader.EXPECTED_OPTIONS_KEY

//TODO: update query to include custom Op's
//TODO: return reasons: {success,markedAsDuplicate,duplicate,parsingError+reason}

const opMap = new Map<string, symbol>();
opMap.set("killstreak", Op.gte);
opMap.set("advantageLost", Op.gte)
opMap.set("weapon", Op.like)

const context = dataloader.createContext(sequelize);

const nameMatchCache = new LRU({ max: 500, maxAge: 1000 * 60 * 4 });

const steamNameCache = new LRU({max: 500, maxAge:1000*60*60});

const mapidCache = new LRU({ max: 10000, maxAge: 1000*60*5});

const logidCache = new LRU({ max: 10000});

const eventType = new GraphQLObjectType({
    name: 'Event',
    description: 'An Event',
    fields: {
        eventid: {
            type: GraphQLNonNull(GraphQLInt),
            description: 'The internal event id'
        },
        logid: {
            type: GraphQLNonNull(GraphQLInt),
            description: 'The corresponding logid'
        },
        attacker: {
            type: GraphQLNonNull(GraphQLString),
            description: 'The steam64 id from the attacker'
        },
        victim: {
            type: GraphQLString,
            description: 'The steam64 id from the victim'
        },
        killstreak: {
            type: GraphQLInt,
        },
        headshot: {
            type: GraphQLBoolean,
        },
        airshot: {
            type: GraphQLBoolean,
        },
        medicDrop: {
            type: GraphQLBoolean,
        },
        second: {
            type: GraphQLNonNull(GraphQLInt),
        },
        capture: {
            type: GraphQLInt,
        },
        kill: {
            type: GraphQLBoolean,
        },
        backstab: {
            type: GraphQLBoolean,
        },
        medicDeath: {
            type: GraphQLBoolean,
        },
        advantageLost: {
            type: GraphQLInt,
        },
        chargeUsed: {
            type: GraphQLBoolean,
        },
        weapon: {
            type: GraphQLString,
        }
    }
});

const logType = new GraphQLObjectType({
    name: 'Log',
    description: 'A Log',
    fields: {
        logid: {
            type: GraphQLNonNull(GraphQLInt),
            description: 'The corresponding logid'
        },
        date: {
            type: GraphQLInt
        },
        map: {
            type: GraphQLString
        },
        redPoints: {
            type: GraphQLInt
        },
        bluePoints: {
            type: GraphQLInt
        },
        timeTaken: {
            type: GraphQLInt
        },
        playeramount: {
            type: GraphQLInt
        },
        official: {
            type: GraphQLBoolean
        },
        events: {
            type: GraphQLList(eventType)
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
            type: GraphQLString,
            description: 'The steam64 id from the attacker'
        },
        victim: {
            type: GraphQLString,
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
            type: GraphQLBoolean,
            description: 'Wether the event should contain an airshot or not'
        },
        medicDrop: {
            type: GraphQLBoolean,
            description: 'Wether the event should contain a medic drop or not'
        },
        second: {
            type: GraphQLInt,
            description: 'The second the event occured'
        },
        capture: {
            type: GraphQLInt,
            description: 'The point id of a captured point'
        },
        kill: {
            type: GraphQLBoolean,
        },
        backstab: {
            type: GraphQLBoolean,
        },
        medicDeath: {
            type: GraphQLBoolean,
        },
        advantageLost: {
            type: GraphQLInt,
        },
        chargeUsed: {
            type: GraphQLBoolean,
        },
        weapon: {
            type: GraphQLString,
        }
    }
})

const player = new GraphQLObjectType({
    name: 'PlayerInput',
    description: 'Attributes of a player you want to receive data from',
    fields: {
        steam64: {
            type: GraphQLString,
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
                type: GraphQLList(logType),
                args: {
                    logid: {
                        type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLInt))),
                        description: 'The corresponding logid'
                    },
                    events: {
                        type: GraphQLNonNull(GraphQLList(GraphQLNonNull(eventInput)))
                    }

                },
                resolve: async (parent: any, args: any) => {
                    //TODO: Update the map-check part
                    const max = Math.max(...args.logid);
                    if (!mapidCache.has(max) && !await MysqlMap.findByPk(Math.max(...args.logid))) {
                        try {
                            const steam64 = new SteamID(args.events[0].attacker)
                            if (steam64.isValid())
                                await updateMapTable(steam64.getSteamID64(), 10000);
                        }
                        catch { }
                    }
                    mapidCache.set(max, true);
                    return (await Log.findAll({
                        where: {
                            logid: { [Op.in]: args.logid },
                        },
                        include: [{
                            model: Event,
                            as: 'events',
                            where: {
                                [Op.or]:
                                    args.events.map((event: IMysqlEvent) => { return { [Op.and]: applyOp(event) } })
                            }

                        }, {
                            model: MysqlMap,
                            as: "mapTable",
                            required: true,
                        }],
                        order: [["logid", "ASC"],["events","attacker","DESC"],["events","second","ASC"]]
                    })).map((result: any) => {
                        result.map = result.mapTable.mapName;
                        return result;
                    })
                }
            },
            player: {
                type: GraphQLList(player),
                args: {
                    steam64: {
                        type: GraphQLString
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
                                if (steamNameCache.has(args.steam64))
                                    return [steamNameCache.get(args.steam64)]
                                const player = await Player.findByPk(steamId.getSteamID64());
                                if (!player) {
                                    //TODO: function should possibly return player instead
                                    if (await updatePlayer(steamId.getSteamID64()))
                                        return [await Player.findByPk(steamId.getSteamID64())];
                                }
                                else {
                                    steamNameCache.set(args.steam64,player);
                                    return [player];
                                }

                            }
                        }
                        catch { }
                    }
                    //If a we're doing a general name lookup use that
                    if (args.name) {
                        if (nameMatchCache.has(args.name))
                            return nameMatchCache.get(args.name)
                        const players = await Player.findAll({
                            where: {
                                name: { [Op.like]: `%${args.name}%` }
                            }
                        })
                        nameMatchCache.set(args.name, players);
                        return players;
                    }
                    //Otherwise or every org name
                    return await Player.findAll({
                        where: {
                            [Op.or]: getPlayerData(args)
                        }
                    })
                }
            },
            addLog: {
                type: GraphQLList(GraphQLBoolean),
                args: {
                    logid: {
                        type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLInt)))
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
                    const logsFound = (await Log.findAll({
                        where: {
                            logid: { [Op.in]: unCachedIds }
                        },
                        attributes: ["logid"]
                    })).map((log) => log.logid);
                    unCachedIds = unCachedIds.filter(logid => {logidCache.set(logid,true); return !logsFound.includes(logid)});
                    const duplicateLogsFound = (await DuplicateLog.findAll({
                        where: {
                            logid: { [Op.in]: unCachedIds }
                        },
                        attributes: ["logid"]
                    })).map((log) => log.logid);
                    unCachedIds = unCachedIds.filter(logid => {logidCache.set(logid,true); return !duplicateLogsFound.includes(logid)});
                    return batchParseLogs(unCachedIds);
                }
            }
        }
    }),
});

function getPlayerData(args: any) {
    interface LooseObject {
        [key: string]: any
    }
    const data: LooseObject = {};

    if (args.etf2lName) {
        data.etf2lName = { [Op.like]: `%${args.etf2lName}%` }
    }
    if (args.ugcName) {
        data.ugcName = { [Op.like]: `%${args.ugcName}%` }
    }
    if (args.logstfName) {
        data.logstfName = { [Op.like]: `%${args.logstfName}%` }
    }

    return data;
}

function applyOp(event: IMysqlEvent) {
    interface LooseObject {
        [key: string]: any
    }
    const data: LooseObject = {};
    Object.entries(event).forEach((value: [string, number | boolean]) => {
        const key = value[0];
        if (opMap.has(key)) {
            data[key] = { [opMap.get(key) || Op.eq]: value[1] }
        }
        else {
            data[key] = value[1]
        }
    })
    return data
}