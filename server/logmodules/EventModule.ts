
import {events} from "logstf-parser";
import {IGameState,PlayerInfo} from "logstf-parser";
import { ILostUberAdvantageEvent } from "logstf-parser/lib/cjs/events";
import {IMysqlEvent,defaultMysqlEvent} from '../DatabaseModel';
interface ISingleCapture extends events.IEvent{
    player: PlayerInfo,
    team: events.Team,
    pointId: number
}
//TODO: Killstreaks
export class EventsModule implements events.IStats{
    public identifier: string;
    private gameStartTime: number | null
    private gameState : IGameState
    private mysqlEvents: IMysqlEvent[]
    private kills: Map<string, number[]>

    constructor(gameState: IGameState) {
        this.identifier = 'Events'
        this.gameStartTime = null
        this.gameState = gameState;
        this.mysqlEvents = []
        this.kills = new Map<string, number[]>()
    }
    private damageEventToMysql(event: events.IDamageEvent,mysql: IMysqlEvent){
        mysql.attacker = event.attacker.id
        mysql.victim = event.victim?.id || null
        mysql.headshot = event.headshot
        mysql.airshot = event.airshot
        if (this.gameStartTime)
            mysql.tick = event.timestamp - this.gameStartTime
        mysql.weapon = event.weapon || null
        return mysql
    }
    private killEventToMysql(event: events.IKillEvent, mysql: IMysqlEvent){
        mysql.attacker = event.attacker.id
        mysql.victim = event.victim.id
        mysql.headshot = event.headshot
        mysql.airshot = event.airshot
        if (this.gameStartTime)
            mysql.tick = event.timestamp - this.gameStartTime
        mysql.kill = true
        mysql.backstab = event.backstab
        mysql.weapon = event.weapon || null
        return mysql
    }
    private medicDeathEventToMysql(event: events.IMedicDeathEvent, mysql: IMysqlEvent){
        mysql.attacker = event.attacker.id
        mysql.victim = event.victim.id
        mysql.medicDrop = event.isDrop
        if (this.gameStartTime)
            mysql.tick = event.timestamp - this.gameStartTime
        mysql.kill = true
        mysql.medicDeath = true
        return mysql
    }
    private chargeEventToMysql(event: events.IChargeEvent, mysql: IMysqlEvent){
        mysql.attacker = event.player.id
        if (this.gameStartTime)
            mysql.tick = event.timestamp - this.gameStartTime
        mysql.chargeUsed = true
        mysql.weapon = event.medigunType
        return mysql
    }
    private advLostEventToMysql(event: ILostUberAdvantageEvent, mysql: IMysqlEvent){
        mysql.attacker = event.player.id
        if (this.gameStartTime)
            mysql.tick = event.timestamp - this.gameStartTime
        mysql.advantageLost = event.time
        return mysql
    }
    private captureEventToMysql(event: ISingleCapture, mysql : IMysqlEvent){
        mysql.attacker = event.player.id
        if (this.gameStartTime)
            mysql.tick = event.timestamp - this.gameStartTime
        mysql.capture = event.pointId
        return mysql
    }
    //TODO: rewrite this mess
    private getKillstreaks(events:IMysqlEvent[]){
        interface IKillstreak {
            steamid: string
            streak: number
            time: number
        }
        const killstreaks:IKillstreak[] = []
        this.kills.forEach(function(value,attacker,map){
            let streak = 1
            for (let killIndex =0; killIndex < value.length-1; killIndex++){
                const killTime = value[killIndex]
                if (killTime + 11 >= value[killIndex+1]){
                    streak++
                }
                else{
                    if (streak >= 3){
                        const killstreak = {
                            steamid: attacker,
                            streak: streak,
                            time: value[killIndex-streak+1]
                        }
                        killstreaks.push(killstreak)
                    }
                    streak = 1
                }
            }

        })
        killstreaks.sort((a,b) => a.time - b.time);
        for (const killstreak of killstreaks){
            const defEvent = defaultMysqlEvent();
            defEvent.attacker = killstreak.steamid
            defEvent.killstreak = killstreak.streak
            defEvent.tick = killstreak.time
            events.push(defEvent)
        }
        return events
    }
    private mergeEvents(events: IMysqlEvent[]): IMysqlEvent[]{
        const mergedEvents : IMysqlEvent[] = []
        let prevEvent;
        for (const eventId in events){
            const event = events[eventId]
            if (!prevEvent){
                prevEvent = event
            }
            if (eventId === '0'){
                continue;
            }
            if (event.tick === prevEvent.tick
                && event.attacker === prevEvent.attacker
                && event.victim === prevEvent.victim){
                prevEvent.airshot = event.airshot || prevEvent.airshot
                prevEvent.backstab = event.backstab || prevEvent.backstab
                prevEvent.headshot = event.headshot || prevEvent.headshot
                prevEvent.kill = event.kill || prevEvent.kill
                prevEvent.medicDeath = event.medicDeath || prevEvent.medicDeath
                prevEvent.medicDrop = event.medicDrop || prevEvent.medicDrop
                prevEvent.chargeUsed = event.chargeUsed || prevEvent.chargeUsed
                prevEvent.weapon = event.weapon || prevEvent.weapon
            }
            else{
                //we might be missing the last/first event?
                mergedEvents.push(prevEvent)
                prevEvent = event
            }
        }
        return mergedEvents;
    }
    onRoundStart(event: events.IRoundStartEvent) {
        if (!this.gameStartTime)
            this.gameStartTime = event.timestamp
    }
    onDamage(event: events.IDamageEvent){
        if (!this.gameState.isLive)
            return
        if (event.airshot||event.headshot){
            const mysqlEvent = defaultMysqlEvent();
            this.mysqlEvents.push(this.damageEventToMysql(event,mysqlEvent));
        }
    }
    onKill(event : events.IKillEvent){
        if (!this.gameState.isLive)
            return
        const mysqlEvent = defaultMysqlEvent();
        this.mysqlEvents.push(this.killEventToMysql(event,mysqlEvent))
        let gameTime = 0
        if (this.gameStartTime) {
            gameTime = event.timestamp - this.gameStartTime
            if (gameTime < 0) gameTime = 0
        }
        if (this.kills.has(event.attacker.id)){
            this.kills.get(event.attacker.id)?.push(gameTime)
        }
        else{
            this.kills.set(event.attacker.id,[gameTime])
        }
    }
    onMedicDeath(event: events.IMedicDeathEvent){
        if (!this.gameState.isLive)
            return
        const mysqlEvent = defaultMysqlEvent();
        this.mysqlEvents.push(this.medicDeathEventToMysql(event,mysqlEvent));
    }
    onCapture(event: events.ICaptureEvent){
        if (!this.gameState.isLive)
            return
        for (const player of event.players){
            const singleCapture : ISingleCapture = ({
                player: player,
                team: event.team,
                timestamp: event.timestamp,
                pointId : event.pointId
            });
            const mysqlEvent = defaultMysqlEvent();
            this.mysqlEvents.push(this.captureEventToMysql(singleCapture,mysqlEvent));
        }
    }
    onCharge(event: events.IChargeEvent){
        if (!this.gameState.isLive)
        return
        const mysqlEvent = defaultMysqlEvent();
        this.mysqlEvents.push(this.chargeEventToMysql(event, mysqlEvent))
    }
    onLostUberAdv(event: events.ILostUberAdvantageEvent){
        if (!this.gameState.isLive)
        return
        const mysqlEvent = defaultMysqlEvent();
        this.mysqlEvents.push(this.advLostEventToMysql(event, mysqlEvent))
    }

    finish(){
        this.mysqlEvents = this.mergeEvents(this.mysqlEvents)
        this.getKillstreaks(this.mysqlEvents);
    }

    toJSON(): IMysqlEvent[]{
        return this.mysqlEvents;
    }
}