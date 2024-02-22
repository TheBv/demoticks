import { players, maps, logs, Prisma } from '@prisma/client'
import plays_inCreateManyLogsInput = Prisma.plays_inCreateManyLogsInput
import eventsCreateManyLogsInput = Prisma.eventsCreateManyLogsInput


export const defaultPlayer = (): players => ({
    name: null,
    etf2lName: null,
    ugcName: null,
    ozFortressName: null,
    logstfName: null,
    steam64: BigInt(-1),
    updatedAt: new Date()
})

export const defaultMap = (): maps => ({
    mapName: "",
    logid: -1
})

export const defaultEvent = (): eventsCreateManyLogsInput => ({
    attacker: BigInt(-1),
    victim: null,
    killstreak: null,
    headshot: false,
    airshot: 0,
    medicDrop: false,
    second: -1,
    capture: null,
    kill: false,
    backstab: false,
    medicDeath: false,
    advantageLost: null,
    chargeUsed: false,
    weapon: null
})
export const defaultPlaysIn = (): plays_inCreateManyLogsInput => ({
    steam64: BigInt(-1),
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
    class: null
})
export const defaultLog = (): logs => ({
    logid: -1,
    date: -1,
    redPoints: -1,
    bluePoints: -1,
    timeTaken: -1,
    playeramount: -1,
    official: false
})