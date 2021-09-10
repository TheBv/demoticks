const graphql = require('graphql');
//import express from 'express';
//TODO: Use graphql-sequilize
//TODO: Switch to sequilize-dataloader


import mysql from 'mysql2';
const database = require('./database');
const knex = require("knex")({
    client: "mysql"
});
const config = require('./config');
const schema = graphql.buildSchema(`
    type Event {
        eventid: Int!
        logid: Int!
        attacker: String
        victim: String
        killstreak: Int
        headshot: Boolean
        airshot: Boolean
        medicDrop: Boolean
        tick: Int!
        cap: Boolean
        lastcap: Boolean
        kill: Boolean
        backstab: Boolean
        medicDeath: Boolean
    }
    type Log {
        logid: Int
        date: Int
        redPoints: Int
        bluePoints: Int
        timeTaken: Int
        playeramount: String
        events: [Event]
        map: String
    }
    input InputPlayer {
        steam64: String
        name: String
        steam3: String
    }
    type Player {
        steam64: String
        name: String
        steamId3: String
    }
    input LogId {
        logid: [Int!]!
    }
    input Events {
        killstreak: Int
        headshot: Boolean
        airshot: Boolean
        medicDrop: Boolean
        tick: Int
        cap: Boolean
        lastcap: Boolean
        kill: Boolean
        backstab: Boolean
        medicDeath: Boolean
        andEvents: [Events]
        }
    input SearchEvent {
        logid: [Int]!
        attacker: [String!]
        victim: [String]
        orEvents: Events!
    }
    type Query {
        SearchEvents(input: SearchEvent): [Log]
        SearchPlayers(input: InputPlayer): [Player]
        AddLog(input: LogId): [Boolean]
    }
`);
//TODO: andEvents doesn't need to be array
interface IEvent {

}

interface ILogData {
    logid : number
    date: number
    redPoints : number
    bluePoints : number
    timeTaken : number
    playerAmount : number
    mapName: string
}

class Log {
    logid : number
    date: number
    redPoints : number
    bluePoints : number
    timeTaken : number
    playeramount : number
    events: IEvent[]
    map: string
    constructor(logData: ILogData, events: IEvent[]) {
        this.logid = logData.logid;
        this.date = logData.date;
        this.redPoints = logData.redPoints;
        this.bluePoints = logData.bluePoints;
        this.timeTaken = logData.timeTaken;
        this.playeramount = logData.playerAmount;
        this.events = events;
        if (logData.mapName != undefined) {
            this.map = logData.mapName;
        }
        else {
            this.map = "Map not Found";
        }
    }
}
class Player {
    steam64: string
    name : string
    steamId3 : string
    constructor(steam64 : string, name: string, steamId3: string ) {
        this.steam64 = steam64;
        this.name = name;
        this.steamId3 = steamId3;
    }
}
const root = {
    SearchEvents: (data) => {
        return new Promise(async function (resolve, reject) {
            try {
                data.input.logid = data.input.logid.slice(0, config.requestLimit); //Caps the amount of logs request to specified value
                let sqlknex = knex("events");
                if (data.input.attacker !== undefined) {
                    sqlknex = sqlknex.whereIn("attacker", Object.values(data.input.attacker));
                    const SteamID = require("steamid");
                    const steamid = new SteamID(Object.values(data.input.attacker)[0]);
                    //Add check to see if the maps are in db or not here or in function
                    await database.updateMapTable(steamid,10000).catch(err => console.log(err));
                }
                if (data.input.victim !== undefined) {
                    sqlknex.whereIn("victim", Object.values(data.input.victim));
                }
                if (data.input.logid !== undefined) {
                    sqlknex.whereIn("logid", Object.values(data.input.logid));
                }
                sqlknex.andWhere((stuff) => {
                    const eventMap = new Map(Object.entries(data.input.orEvents));
                    if (Object.keys(data.input.orEvents).length !== 0) {
                        for (const orEventKey of Object.keys(data.input.orEvents)) { //Switch statements
                            if (typeof eventMap.get(orEventKey) === "boolean") {
                                stuff.orWhere(orEventKey, eventMap.get(orEventKey));
                            }
                            else if (typeof eventMap.get(orEventKey) === "number") {
                                if (orEventKey === "killstreak") {
                                    stuff.orWhere(orEventKey, ">=", eventMap.get(orEventKey));
                                }
                                else {
                                    stuff.orWhere(orEventKey, "=", eventMap.get(orEventKey));
                                }
                            }
                            else if (typeof eventMap.get(orEventKey) === "object") {
                                const eventMap2 = new Map(Object.entries(eventMap.get(orEventKey)[0]));
                                stuff.orWhere((test) => {
                                for (const andEventKey of Object.keys(eventMap.get(orEventKey)[0])) {
                                    
                                        if (typeof eventMap2.get(andEventKey) === "boolean") {
                                            test.andWhere(andEventKey, eventMap2.get(andEventKey));
                                        }
                                        else if (typeof eventMap2.get(andEventKey) === "number") {
                                            test.andWhere(andEventKey, "=", eventMap2.get(andEventKey));
                                        }
                                    }
                                });
                            }
                        }
                    }
                });
                sqlknex.orderBy("logid", "desc");
                sqlknex.orderBy("attacker", "desc");
                console.log(sqlknex.toString());
                database.executeQuery(sqlknex.toString()).then(async result => {
                    let previouslogid;
                    const Logs = [];
                    let Events = [];
                    for (let index in result) { //Groups results by logid could improve?
                        let currentlogid = result[index].logid;
                        if ((previouslogid != currentlogid && previouslogid !== undefined)) {
                            Logs.push(await getLogData(previouslogid, Events).catch(error => { reject(error); }));
                            Events = [];
                        }
                        Events.push(result[index]);
                        previouslogid = currentlogid;
                        if (parseInt(index) + 1 === result.length) { //If the last entry was detected flush 
                            Logs.push(await getLogData(previouslogid, Events).catch(error => { reject(error); }));
                        }
                    }
                    resolve(Logs);
                }).catch(error => { console.log(error); reject(error); });
            }
            catch (error) {
                console.log(error);
                reject(error);
            }
        });
    },
    //Make it arrayable
    SearchPlayers: data => {
        return new Promise(function (resolve, reject) {
            try {
                const sqlknex = knex("players");
                for (const key in data.input) {
                    sqlknex.where(key, "like", "%" + data.input[key] + "%").orderBy("name", "asc");
                }
                database.executeQuery(sqlknex.toString()).then(result => {
                    if (result.length !== 0){
                        resolve(result);
                    }
                    else {
                        if (data.input.steam64 !== undefined) {
                            try {
                                const SteamID = require("steamid");
                                if (new SteamID(data.input.steam64).isValid()) {
                                    database.addPlayer(data.input.steam64).then(function (result) {
                                        console.log("RESULT", result);
                                        resolve([new Player(result[0], result[1], result[2])]);
                                    }).catch(reason => { reject(reason); });
                                }
                                else {
                                    reject(new Error("Invalid SteamId"));
                                }
                            }
                            catch{
                                reject(new Error("Invalid Input"));
                            }
                        }
                        else {
                            reject(new Error("Name not found"));
                        }
                    }
                }, error => {
                    console.log(error);
                    reject(error);
                });
            }
            catch (error) {
                console.log(error);
                reject(error);
            }
        });
    },
    AddLog: data => {
        return new Promise(async function (resolve, reject) {
            try {
                let check = knex("logs").whereIn("logid", Object.values(data.input.logid)).select("logid");
                let result = await database.executeQuery(check.toString());
                const logsfound = [];
                for (const log of result) {
                    logsfound.push(log.logid);
                }
                let getLogs = data.input.logid.filter(value => !logsfound.includes(value));
                if (data.input.logid.length != getLogs.length && getLogs.length !== 0) {
                    check = knex("duplicatelogids").whereIn("logid", Object.values(data.input.logid));
                    result = await database.executeQuery(check.toString());
                    getLogs = getLogs.filter(value => !result.includes(value));
                }
                const results = [];
                for (const log of getLogs) {
                    results.push(await database.send(mysql.escape(log)));
                }
                resolve(results);
            }
            catch (error) {
                console.log(error);
                reject(error);
            }
        });
    }
};
/*
function AddLog2(data) {

    return new Promise(async function (resolve, reject) {
        try {
            let check = knex("logs").whereIn("logid", data).select("logid");
            let result = await database.executeQuery(check.toString());
            const logsfound = [];
            for (const log of result) {
                logsfound.push(log.logid);
            }
            let getLogs = data.filter(value => !logsfound.includes(value));
            if (data.length != getLogs.length && getLogs.length !== 0) {
                check = knex("duplicatelogids").whereIn("logid", data);
                result = await database.executeQuery(check.toString());
                getLogs = getLogs.filter(value => !result.includes(value));
            }
            const results = [];
            for (const log of getLogs) {
                results.push(database.send(mysql.escape(log)));
            }
            Promise.allSettled(results).then(stuff => resolve(results)).catch(err => { console.log(err); reject(); });
            //resolve(results);
        }
        catch (error) {
            console.log(error);
            reject(error);
        }
    });

}*/

function getLogData(previouslogid, Events) {
    return new Promise(function (resolve, reject) {
        try {
            database.executeQuery("SELECT * FROM logs LEFT JOIN maps ON logs.logid = maps.logid WHERE logs.logid= " + mysql.escape(previouslogid)).then(result => {
                if (result.length != 0) {
                    if (result[0].logid == null) {
                        result[0].logid=previouslogid;
                    }
                    resolve(new Log(result[0], Events));
                }
            }).catch(error => { console.log(error); reject(error);});
        }
        catch (error) {
            reject(error);
        }
    });

}
function checkForMapUpdate(logids,steamid) {
    return new Promise(function (resolve, reject) {
        try {
            logids.sort((a, b) => a - b);
            const latestLogid = logids[logids.length - 1];
            database.executeQuery("SELECT * FROM maps WHERE logid=" + mysql.escape(latestLogid)).then(async result => {
                if (result.length == 0) {
                    await database.updateMapTable(steamid).catch(error => { reject(error); });                 
                }
                resolve(true);
            }).catch(err => { reject(err); });
        }
        catch (err){
            reject(err);
        }
    });
}


exports.root = root;
exports.schema = schema;
