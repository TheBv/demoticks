
import {events} from "logstf-parser";
import {IGameState,PlayerInfo} from "logstf-parser";
import {IMysqlEvent,defaultMysqlEvent} from '../DatabaseModel';
interface ISingleCapture extends events.IEvent{
    player: PlayerInfo,
    team: events.Team,
    pointId: number
}

export class EventsModule implements events.IStats{
    public identifier: string;
    private gameStartTime: number | null
    private gameState : IGameState
    private mysqlEvents: IMysqlEvent[]


    constructor(gameState: IGameState) {
        this.identifier = 'Events'
        this.gameStartTime = null
        this.gameState = gameState;
    }
    private killEventToMysql(event: events.IKillEvent,mysql: IMysqlEvent){
        mysql.attacker = event.attacker.id
        mysql.victim = event.victim.id
        mysql.headshot = event.headshot
        mysql.airshot = event.airshot
        mysql.tick = this.gameStartTime - event.timestamp
        mysql.kill = true
        mysql.backstab = event.backstab
        return mysql
    }
    private medicDeathEventToMysql(event: events.IMedicDeathEvent,mysql: IMysqlEvent){
        mysql.attacker = event.attacker.id
        mysql.victim = event.victim.id
        mysql.medicDrop = event.isDrop
        mysql.tick = this.gameStartTime - event.timestamp
        mysql.kill = true
        mysql.medicDeath = true
        return mysql
    }
    private captureEventToMysql(event: ISingleCapture, mysql : IMysqlEvent){
        mysql.attacker = event.player.id
        mysql.tick = this.gameStartTime - event.timestamp
        mysql.capture = event.pointId
        return mysql
    }
    private mergeEvents(events: IMysqlEvent[]): IMysqlEvent[]{
        const mergedEvents : IMysqlEvent[] = []
        for (const eventId in events){
            const event = events[eventId];
            if (eventId === '0'){
                continue;
            }
            const prevEvent = events[parseInt(eventId)-1]
            if (event.tick === prevEvent.tick
                && event.attacker === prevEvent.attacker
                && event.victim === prevEvent.victim){
                prevEvent.airshot = event.airshot || prevEvent.airshot
                prevEvent.backstab = event.backstab || prevEvent.backstab
                prevEvent.headshot = event.headshot || prevEvent.headshot
                prevEvent.kill = event.kill || prevEvent.kill
                prevEvent.medicDeath = event.medicDeath || prevEvent.medicDeath
                prevEvent.medicDrop = event.medicDrop || prevEvent.medicDrop
            }
            else{
                //we might be missing the last/first event?
                mergedEvents.push(prevEvent)
            }
        }
        return mergedEvents;
    }
    onKill(event : events.IKillEvent){
        if (!this.gameState.isLive)
            return
        const mysqlEvent = defaultMysqlEvent();
        this.mysqlEvents.push(this.killEventToMysql(event,mysqlEvent))
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

    finish(){
        this.mysqlEvents = this.mergeEvents(this.mysqlEvents)
    }

    toJSON(): IMysqlEvent[]{
        return this.mysqlEvents;
    }
}