import {Sequelize, Model, DataTypes } from "sequelize"
import {config} from './../config'

//TODO: Accuracy for plays_in, implement classes table, add advantageLost,chargeUsed,weapon to events
//TODO: Players from now on don't have a name by default, should get a different name for each website?
//TODO: Should players/logs have timestamps?
//TODO: Update default pooling settings?
const sequelize = new Sequelize(config.MySQLdatabase,config.MySQLUser,config.MySQLPassword,{
    dialect: 'mysql',
    host: config.MySQLHost,
    port: config.MySQLPort,
    logging: true,
})
export interface IMysqlEvent {
    eventid: string | null,
    logid: number,
    attacker: string | null,
    victim : string | null,
    killstreak: number | null,
    headshot: boolean,
    airshot: boolean,
    medicDrop: boolean,
    tick: number | null,
    capture: number | null,
    kill: boolean,
    backstab: boolean,
    medicDeath: boolean,
    advantageLost: number | null,
    chargeUsed: boolean,
    weapon: string | null
}
export interface IMysqlPlayer{
    steam64: string,
    etf2lName: string | null,
    ugcName: string | null,
    ozFortressName: string | null,
    logstfName: string | null,
    steamId3: string
}
export interface IMysqlMap {
    logid: number,
    mapName: String | null
}
export interface IMysqlLog {
    logid: number,
    date: number,
    redPoints: number,
    bluePoints: number,
    timeTaken: number,
    playeramount: number,
    official: boolean
}
export interface IMysqlDuplicateLog {
    logid: number,
    duplicateof: number
}
export interface IMysqlPlaysIn {
    id: string | null,
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
    class: string | null
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
    class: string
}
export class Event extends Model<IMysqlEvent> implements IMysqlEvent{
    eventid!: string | null
    logid!: number
    attacker!: string | null
    victim! : string | null
    killstreak!: number | null
    headshot!: boolean
    airshot!: boolean
    medicDrop!: boolean
    tick!: number | null
    capture!: number | null
    kill!: boolean
    backstab!: boolean
    medicDeath!: boolean
    advantageLost!: number | null
    chargeUsed! : boolean
    weapon! : string | null
}

export class Player extends Model<IMysqlPlayer> implements IMysqlPlayer{
    steam64!: string
    etf2lName!: string | null
    ugcName!: string | null
    ozFortressName!: string | null
    logstfName!: string | null
    steamId3!: string
}

export class Map extends Model<IMysqlMap> implements IMysqlMap{
    logid!: number
    mapName!: String | null
}

export class Log extends Model<IMysqlLog> implements IMysqlLog{
    logid!: number
    date!: number
    redPoints!: number
    bluePoints!: number
    timeTaken!: number
    playeramount!: number
    official!: boolean
}

export class DuplicateLog extends Model<IMysqlDuplicateLog> implements IMysqlDuplicateLog{
    logid!: number
    duplicateof!: number
}
export class PlaysIn extends Model<IMysqlPlaysIn> implements IMysqlPlaysIn {
    id!: string | null
    steam64!: string
    logid!: number
    blue!: boolean
    kills!: number
    assists!: number
    deaths!: number
    damage!: number
    damageTaken!: number
    healsReceived!: number
    healsDistributed!: number
    ubers!: number
    drops!: number
    kritz!: number
    class!: string | null
}
export class PlaysClasses extends Model<IMysqlPlaysInClasses> implements IMysqlPlaysInClasses {
    plays_inId!: number
    kills!: number
    assists!: number
    deaths!: number
    damage!: number
    damageTaken!: number
    healsReceived!: number
    healsDistributed!: number
    class!: string
}
//TODO: Think about proper default values

export const defaultMysqlPlayer = (): IMysqlPlayer => ({
    etf2lName: null,
    ugcName: null,
    ozFortressName: null,
    logstfName: null,
    steam64: "",
    steamId3: ""
})

export const defaultMysqlEvent = (): IMysqlEvent => ({
    eventid: null,
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
    medicDeath: false,
    advantageLost: null,
    chargeUsed: false,
    weapon: null
})
export const defaultMysqlPlaysIn = (): IMysqlPlaysIn => ({
    id: null,
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
    official: false
})


Map.init({
    logid: {
        type: DataTypes.INTEGER,
        primaryKey : true,
        allowNull: false
    },
    mapName: {
        type: DataTypes.CHAR,
    }

},{
    timestamps: false,
    sequelize,
    tableName: "map"
});
Event.init({
    eventid: {
        type: DataTypes.BIGINT,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
    },
    logid: {
        type: DataTypes.INTEGER,
        allowNull: false,
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
    advantageLost: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    chargeUsed: {
        type: DataTypes.BOOLEAN,
        allowNull: false
    },
    weapon: {
        type: DataTypes.CHAR,
        allowNull: true
    }
},{
    timestamps: false,
    sequelize,
    tableName: "events"
})
Player.init({
    steam64: {
        type: DataTypes.BIGINT,
        allowNull: false,
        primaryKey: true
    },
    steamId3: {
        type: DataTypes.CHAR
    },
    etf2lName: {
        type: DataTypes.CHAR,
    },
    ugcName: {
        type: DataTypes.CHAR,
    },
    ozFortressName: {
        type: DataTypes.CHAR,
    },
    logstfName: {
        type: DataTypes.CHAR,
    }
},{
    timestamps: true,
    createdAt: false,
    sequelize,
    tableName: "players"
})
Log.init({
    logid: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true
    },
    date: {
        type: DataTypes.INTEGER
    },
    redPoints: {
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
    },
    official: {
        type: DataTypes.BOOLEAN
    }
},{
    timestamps: false,
    sequelize,
    tableName: "logs"
})
DuplicateLog.init({
    logid: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true
    },
    duplicateof: {
        type: DataTypes.INTEGER,
        allowNull: false
    }
},{
    timestamps: false,
    sequelize,
    tableName: "duplicatelogids"
})
PlaysIn.init({
    id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
    },
    steam64: {
        type: DataTypes.CHAR,
        allowNull: false
    },
    logid: {
        type: DataTypes.INTEGER,
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
    timestamps: false,
    sequelize,
    tableName: 'plays_in'
})
PlaysClasses.init({
    plays_inId: {
        type: DataTypes.BIGINT,
        allowNull: false
    },
    class: {
        type: DataTypes.STRING,
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
    }
},{
    timestamps: false,
    sequelize,
    tableName: 'plays_classes'
})

export const logEvents =  Log.hasMany(Event,{foreignKey: 'logid',as:'events'});

Event.hasOne(Map);
Event.hasMany(PlaysIn);