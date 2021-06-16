import {Sequelize, Model, DataTypes } from "sequelize"
import * as config from './../config'

//TODO: Accuracy for plays_in, implement classes table, add advantageLost,chargeUsed,weapon to events
//TODO: Players from now on don't have a name by default, should get a different name for each website?

const sequelize = new Sequelize(config.MySQLdatabase,config.MySQLUser,config.MySQLPassword,{
    dialect: 'mysql',
    host: config.MySQLHost,
    port: config.MySQLPort,
})

export interface IMysqlEvent {
    logid: number,
    attacker: string,
    victim : string,
    killstreak: number,
    headshot: boolean,
    airshot: boolean,
    medicDrop: boolean,
    tick: number,
    capture: number,
    kill: boolean,
    backstab: boolean,
    medicDeath: boolean
}
export interface IMysqlPlayer{
    steam64: string,
    name: string,
    steamId3: string
}
export interface IMysqlMap {
    logid: number,
    mapName: String
}
export interface IMysqlLog {
    logid: number,
    date: number,
    redPoints: number,
    bluePoints: number,
    timeTaken: number,
    playeramount: number
}
export interface IMysqlDuplicateLog {
    logid: number,
    duplicateof: number
}
export interface IMysqlPlaysIn {
    steam64: string,
    logid: number,
    blue: boolean,
    kills: number,
    assists: number,
    deaths: number
    damage: number,
    damageTaken: number,
    healsReceived: number,
    healsDistributed: number,
    ubers: number,
    drops: number,
    kritz: number,
    class: string
}
//TODO: Create a proper playsin interface/db stuff
export interface IMysqlPlaysInClasses {
    plays_inId: number,
    kills: number,
    assists: number,
    deaths: number
    damage: number,
    damageTaken: number,
    healsReceived: number,
    healsDistributed: number,
    ubers: number,
    drops: number,
    kritz: number,
    class: string
}
export class Event extends Model<IMysqlEvent> implements IMysqlEvent{
    logid!: number
    attacker: string
    victim : string
    killstreak: number
    headshot: boolean
    airshot: boolean
    medicDrop: boolean
    tick: number
    capture: number
    kill: boolean
    backstab: boolean
    medicDeath: boolean
}

export class Player extends Model<IMysqlPlayer> implements IMysqlPlayer{
    steam64: string
    name: string
    steamId3: string
}

export class Map extends Model<IMysqlMap> implements IMysqlMap{
    logid!: number
    mapName: String
}

export class Log extends Model<IMysqlLog> implements IMysqlLog{
    logid!: number
    date: number
    redPoints: number
    bluePoints: number
    timeTaken: number
    playeramount: number
}

export class DuplicateLog extends Model<IMysqlDuplicateLog> implements IMysqlDuplicateLog{
    logid!: number
    duplicateof: number
}
export class PlaysIn extends Model<IMysqlPlaysIn> implements IMysqlPlaysIn {
    steam64!: string
    logid!: number
    blue: boolean
    kills: number
    assists: number
    deaths: number
    damage: number
    damageTaken: number
    healsReceived: number
    healsDistributed: number
    ubers: number
    drops: number
    kritz: number
    class: string
}
export class PlaysInClasses extends Model<IMysqlPlaysInClasses> implements IMysqlPlaysInClasses {
    plays_inId: number
    kills: number
    assists: number
    deaths: number
    damage: number
    damageTaken: number
    healsReceived: number
    healsDistributed: number
    ubers: number
    drops: number
    kritz: number
    class: string
}
//TODO: Think about proper default values
export const defaultMysqlEvent = (): IMysqlEvent => ({
    logid: -1,
    attacker: null,
    victim : null,
    killstreak: null,
    headshot: false,
    airshot: false,
    medicDrop: false,
    tick: null,
    capture: null,
    kill: false,
    backstab: false,
    medicDeath: false
})
export const defaultMysqlPlaysIn = (): IMysqlPlaysIn => ({
    steam64!: "-1",
    logid!: -1,
    blue: false,
    kills: 0,
    assists: 0,
    deaths: 0,
    damage: 0,
    damageTaken: 0,
    healsReceived: 0,
    healsDistributed: 0,
    ubers: 0,
    drops: 0,
    kritz: 0,
    class: null,
})
export const defaultMysqlLog = (): IMysqlLog => ({
    logid!: -1,
    date: -1,
    redPoints: -1,
    bluePoints: -1,
    timeTaken: -1,
    playeramount: -1,
})


Map.init({
    logid: {
        type: DataTypes.BIGINT,
        primaryKey : true,
        allowNull: false
    },
    mapName: {
        type: DataTypes.CHAR,
    }

},{
    sequelize,
    tableName: "map"
});
Event.init({
    logid: {
        type: DataTypes.BIGINT,
        allowNull: false
    },
    attacker: {
        type: DataTypes.CHAR,
        allowNull: false
    },
    victim: {
        type: DataTypes.CHAR,
    },
    killstreak: {
        type: DataTypes.INTEGER,
    },
    headshot: {
        type: DataTypes.BOOLEAN,
        allowNull: false
    },
    airshot: {
        type: DataTypes.BOOLEAN,
        allowNull: false
    },
    medicDrop: {
        type: DataTypes.BOOLEAN,
        allowNull: false
    },
    tick: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    capture: {
        type: DataTypes.BOOLEAN,
        allowNull: false
    },
    kill: {
        type: DataTypes.BOOLEAN,
        allowNull: false
    },
    backstab: {
        type: DataTypes.BOOLEAN,
        allowNull: false
    },
    medicDeath: {
        type: DataTypes.BOOLEAN,
        allowNull: false
    },
},{
    sequelize,
    tableName: "events"
})
Player.init({
    steam64: {
        type: DataTypes.BIGINT,
        allowNull: false
    },
    name: {
        type: DataTypes.CHAR
    },
    steamId3: {
        type: DataTypes.CHAR
    }
},{
    sequelize,
    tableName: "players"
})
Log.init({
    logid: {
        type: DataTypes.BIGINT,
        allowNull: false
    },
    date: {
        type: DataTypes.DATE
    },
    redPoints: 
    {
        type: DataTypes.INTEGER
    },
    bluePoints: {
        type: DataTypes.INTEGER
    },
    timeTaken: {
        type: DataTypes.INTEGER
    },
    playeramount: {
        type: DataTypes.INTEGER
    }
},{
    sequelize,
    tableName: "logs"
})
DuplicateLog.init({
    logid!: {
        type: DataTypes.BIGINT,
        allowNull: false
    },
    duplicateof: {
        type: DataTypes.BIGINT,
        allowNull: false
    }
},{
    sequelize,
    tableName: "duplicatelogids"
})
PlaysIn.init({
    steam64: {
        type: DataTypes.CHAR,
        allowNull: false
    },
    logid: {
        type: DataTypes.BIGINT,
        allowNull: false
    },
    blue: {
        type: DataTypes.BOOLEAN,
        allowNull: false
    },
    kills: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    assists: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    deaths: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    damage: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    damageTaken: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    healsReceived: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    healsDistributed: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    ubers: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    drops: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    kritz: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    class: {
        type: DataTypes.CHAR,
        allowNull: false
    },
},{
    sequelize,
    tableName: 'plays_in'
})

