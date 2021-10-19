var players = [];

class SearchQuery {
    attackers = []; //array of steamIds
    victims = []; //array of steamIds
    logIds = []; //array of logIds
    events = [];
    constructor(attackers = [null], victims = [null], logIds = [null], events = [null]) {
        this.attackers = attackers;
        this.victims = victims;
        this.logIds = logIds;
        this.events = events;
    }
    setAttackers(attackers) {
        this.attackers = attackers;
    }
    setVictims(victims) {
        this.victims = victims;
    }
    setLogIds(logIds) {
        this.logIds = logIds;
    }
    setEvents(events) {
        this.events = events;
    }
    toQuery() {
        let query = `{event(logid: [${this.logIds}]`;

        const queryInput = [];
        let queryOutput = "";
        for (const attacker of this.attackers){
            for (const victim of this.victims) {
                for (const event of this.events) {
                    let currEvent = "";
                    if (attacker) {
                        currEvent += `attacker: "${attacker}"`;
                    }
                    if (victim) {
                        currEvent += `victim: "${victim}"`;
                    }
                    currEvent += event.toInput();
                    queryOutput += event.toOutput();
                    queryInput.push(`{${currEvent}}`);
                }
            }
        }
        query += `events:[${queryInput}]) { logid date map events{ attacker ${queryOutput} second }}}`;
        console.log(query);
        return query;
    }
}

class Event {
    EventsI = new Map(Object.entries({
        KS: "killstreak : 3",
        HS: "headshot : true",
        AS: "airshot : true",
        MD: "medicDrop : true",
        BS: "backstab : true",
        MK: "medicDeath : true",
        K: "kill : true"
    }));
    EventsO = new Map(Object.entries({
        KS: "killstreak",
        HS: "headshot",
        AS: "airshot",
        MD: "medicDrop",
        BS: "backstab",
        MK: "medicDeath",
        K: "kill"
    }));
    subEvents = [];

    add(eventTag) {
        this.subEvents.push(eventTag);
    }
    toInput() {
        let input = "";
        for (const eventTag of this.subEvents) {
            input += ` ${this.EventsI.get(eventTag)} `;
        }
        return input;
    }
    toOutput() {
        let output = "";
        for (const eventTag of this.subEvents) {
            output += ` ${this.EventsO.get(eventTag)} `;
        }
        return output;
    }
    getAlias() {
        return this.subEvents.toString().replaceAll(",", "");
    }
    matches(response) {
        let matches = true;
        for (const eventTag of this.subEvents) {
            if (response[this.EventsO.get(eventTag)] !== true) {
                matches = false;
            }
            if (typeof response[this.EventsO.get(eventTag)] == "number") {
                matches = response[this.EventsO.get(eventTag)];
            }
        }
        return matches;
    }
}

const getPlayers = function () { //Needs updating
    return new Promise(function (resolve, reject) {
        const playerarray = [];
        const table = $("#playerTable").children("tbody")[0];
        new Promise(function (resolve, reject) {
            const promises = [];
            $.each(table.rows, function (player) {
                let checkagainst = "";
                if (players[player] !== undefined) {
                    checkagainst = players[player].steam64;
                }
                if (table.rows[player].cells[0].getElementsByTagName("input")[0].value !== checkagainst) {
                    promises.push(queryData("{player(steam64: \"" + table.rows[player].cells[0].getElementsByTagName("input")[0].value + "\") {steam64 name}}").then(function (data) {
                        playerarray.push(data.player[0]);
                    }).catch((err) => { console.log("Invalid SearchInput", err); }));
                }
                else if (players[player] !== undefined) {
                    playerarray.push(players[player]);
                }
            });
            Promise.all(promises).then(function () {
                resolve();
            });
        }).then(function () {
            console.log(playerarray);
            players = playerarray;
            resolve(playerarray);
        });
    });
};
//Returns the playername from a given steam64 id
const getPlayerName = function (steam64) { //Will be replaced with global player class
    for (const player of players) {
        if (player.steam64 === steam64) {
            return player.name;
        }
    }
    return null;
};

const getPlayerNameFromSteam64 = function (_this) {
    if (_this.value.length === 17) {
        const cubes = $('div[name="requestingPlayerName"]');
        const name = _this.parentNode.parentNode.getElementsByTagName("td")[2].getElementsByTagName("input")[0];
        const querry = `{player(steam64: "${_this.value}") {name}}`;
        cubes.show();
        queryData(querry).then(function (data) {
            if (data["player"].length !== 0) {
                name.value = data["player"][0]["name"];
                cubes.hide();
            }

        }).catch(reason => { name.value = "Player not found"; cubes.hide(); });
    }
};

function insertSteamId(_this) {
    const name = _this.value;
    const steamIdNeighbour = _this.parentNode.parentNode.getElementsByTagName("td")[0].getElementsByTagName("input")[0];
    if (returnedPlayers.length !== undefined) {
        for (const data of returnedPlayers) {
            if (data["name"] === name) {
                steamIdNeighbour.value = data["steam64"];
            }
        }
    }
}

const updateDatalist = function (_this) { //Needs updating
    if (_this.value.length >= 2) {
        let querry = `{player(name: "${_this.value}" ) {steam64 name}}`;
        queryData(querry).then(function (data) {
            console.log(data);
            data = data["player"];
            if (data !== null) {
                let list = $("#playernames")[0];//_this.parentNode.getElementsByTagName("datalist")[0];
                returnedPlayers = new Object(); //This isn't useless returnedPlayers is a var in search (Do need to change that though)
                returnedPlayers = data;
                list.innerHTML = "";
                let names = [];
                for (let index in data) {
                    let option = document.createElement("option");
                    let name = data[index]["name"];
                    if (!names.includes(name)) {
                        names.push(data[index]["name"]);
                        option.value = name;
                    }
                    else {
                        let newName = data[index]["name"] + "(" + names.filter(i => i === name).length + ")";
                        names.push(newName);
                        data[index]["name"] = newName;
                        option.value = newName;
                    }
                    list.appendChild(option);
                }
            }
        });
    }
};

const addEvents = async function (logs, chunkSize, callbackFunction = () => { }) {
    try {
        const chunks = chunkArray(logs, chunkSize);
        for (const chunk of chunks){
            const query = `{addLog(logid: [${chunk.toString()}] )}`;
            await queryData(query).then(function(){
                callbackFunction(chunk.length, 1);
            });
        }
        return true;
    }
    catch (err){
        console.error(err);
        return false;
    }
};
