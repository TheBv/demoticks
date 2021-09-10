import { GraphQLBoolean, GraphQLInputObjectType, GraphQLInt, GraphQLList, GraphQLNonNull, GraphQLObjectType, GraphQLSchema, GraphQLString } from "graphql";
const graphQlSeq = require('graphql-sequelize');
import {Event,IMysqlEvent,Log,logEvents, Player} from './DatabaseModel';
import {Op} from 'sequelize';
import { batchParseLogs } from "./DatabaseHelper";

//TODO: update query to include custom Op's
//TODO: return reasons: {success,markedAsDuplicate,duplicate,parsingError+reason}
const opMap = new Map<string,symbol>();
opMap.set("killstreak",Op.gte);
opMap.set("advantageLost",Op.gte)
opMap.set("weapon",Op.like)

const eventType = new GraphQLObjectType({
    name: 'Event',
    description : 'An Event',
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
            description: 'The steam3 id from the attacker'
        },
        victim: {
            type: GraphQLString,
            description: 'The steam3 id from the victim'
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
        tick: {
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
    description : 'An Event',
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
            description: 'The steam3 id from the attacker'
        },
        victim: {
            type: GraphQLString,
            description: 'The steam3 id from the victim'
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
        tick: {
            type: GraphQLInt,
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
})

const player = new GraphQLObjectType({
    name: 'PlayerInput',
    description: 'Attributes of a player you want to receive data from',
    fields: {
        steam64:{
            type: GraphQLString,
        },
        etf2lName:{
            type: GraphQLString
        },
        ugcName:{
            type: GraphQLString
        },
        logstfName:{
            type: GraphQLString
        },
        steamId3: {
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
                resolve: (parent:any, args:any) => Log.findAll({
                            where: {
                                logid: {[Op.in]: args.logid},
                            },
                            include: [{
                                model: Event,
                                as: 'events',
                                where: {[Op.or]: 
                                    args.events.map((event:IMysqlEvent)=>{return {[Op.and]:applyOp(event)}})
                                  }
                                
                            }]
                })
            },
            player: {
                type: GraphQLList(player),
                args: {
                    steam64: {
                        type: GraphQLString
                    },
                    etf2lName:{
                        type: GraphQLString
                    },
                    ugcName:{
                        type: GraphQLString
                    },
                    logstfName:{
                        type: GraphQLString
                    },
                    steamId3: {
                        type: GraphQLString
                    }
                },
                resolve: graphQlSeq.resolver(Player,{
                    //TODO: fix undefined issues
                    before: (findOptions:any, args:any) => {
                        findOptions.where = {
                            [Op.or]: getPlayerData(args)
                            
                        };
                        return findOptions;
                      },
                })
            },
            addLog: {
                type: GraphQLList(GraphQLBoolean),
                args:{
                    logid: {
                        type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLInt)))
                    }
                },
                resolve: async (parent: any, args: any) => {
                    let logids : number[] = args.logid;
                    const logsFound = (await Log.findAll({
                        where:{
                            logid: {[Op.in] : logids} 
                        }
                    })).map((log) => log.logid);
                    logids = logids.filter(logid => !logsFound.includes(logid));
                    //TODO: duplicateLogs check
                    return await batchParseLogs(logids)
                }
            }
            
        }
        
    }),
    
});


function getPlayerData(args: any ){
    interface LooseObject {
        [key: string]: any
    }
    const data : LooseObject = {};
    if (args.etf2lName){
        data.etf2lName = { [Op.like]: `%${args.etf2lName}%` }
    }
    if (args.ugcName){
        data.ugcName = { [Op.like]: `%${args.ugcName}%` }
    }
    if (args.logstfName){
        data.logstfName = { [Op.like]: `%${args.logstfName}%` }
    }
    if (args.steam64){
        data.steam64 = args.steam64;
    }
    if (args.steamId3){
        data.steamId3 = args.steamId3;
    }

    return data;
}
function applyOp(event:IMysqlEvent){
    interface LooseObject {
        [key: string]: any
    }
    const data : LooseObject = {};
    Object.entries(event).forEach((value:[string,number|boolean])=>{
        const key = value[0];
        if (opMap.has(key)){
            data[key] = {[opMap.get(key)||Op.eq]: value[1]}
        }
        else {
            data[key] = value[1]
        }
    })
    return data
}