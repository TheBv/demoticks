var players = [];
let returnedPlayers = new Object();
const searchQuery = new SearchQuery();
let test = "";
insertPlayers();
randomImage();

const ResponseIssues = {
    noRetry: 0,
    noResponse: 1
};

const steamIds = function () {//returns a couple of steamIds for testing
    return ["76561198048943710", "76561198097506221", "76561198011936672"]; //Bv,Kosuke,Cinder
};
const addPlayer = function (_this) { //logic behind addPlayer could create Template instead?
    const table = $("#playerTable").children("tbody")[0];
    if (table.rows.length <= 8) {
        const clone = $(_this).parent().parent()[0].cloneNode(true);
        $(clone).find("input[type='text']").val("");
        const button = $(clone).find('a[class="button add"]')[0];
        button.innerHTML = "-";
        button.setAttribute("class", "button remove");
        button.setAttribute("onclick", "removePlayer(this)");
        table.appendChild(clone);
    }
};
const addTarget = function (_this) {
    const a = document.createElement("a");
    a.setAttribute("class", "button add");
    a.setAttribute("onclick", "addTarget(this)");
    a.innerHTML = "+";
    const table = _this.parentElement.parentElement.parentElement;
    _this.setAttribute("class", "button remove");
    _this.setAttribute("onclick", "removeTarget(this)");
    _this.innerHTML = "-";
    const row = table.insertRow(table.rows.length);
    row.innerHTML = _this.parentElement.parentElement.innerHTML;
    var wrap = document.createElement('div');
    wrap.appendChild(a.cloneNode(true));
    _this.parentNode.innerHTML = wrap.innerHTML;//COuldn't I use outerHTML?
}

async function insertPlayers() {
    await getPlayers();
    if (players.length !== 0) {
        const cell = document.createElement("td");
        const div = document.createElement("div");
        div.setAttribute("class", "form-select customform");
        const select = document.createElement("select");
        let option = document.createElement("option");
        option.appendChild(document.createTextNode("Players"));
        option.value = "players";
        select.appendChild(option);
        option = document.createElement("option");
        option.appendChild(document.createTextNode("Anyone"));
        option.value = "anyone";
        select.appendChild(option);
        console.log(players);
        for (const player of players) {
            option = document.createElement("option");
            option.appendChild(document.createTextNode(player.name));
            option.value = player.steam64.toString();
            select.appendChild(option);
        }
        div.appendChild(select);
        cell.appendChild(div);
        for (const victim of getVictimTrays()) {
            victim.getElementsByTagName("td")[0].innerHTML = cell.innerHTML;
            $(victim).find("select")[0].selectedIndex = 1;
        }
        for (const attacker of getAttackerTrays()) {
            attacker.getElementsByTagName("td")[0].innerHTML = cell.innerHTML;
        }
    }
}

function removeTarget(_this) {
    const table = _this.parentNode.parentNode.parentNode.parentNode;
    table.deleteRow(_this.parentNode.parentNode.rowIndex);
}

function removePlayer(_this) { //logic behind the remove button same as remove Element
    const table = $("#playerTable").children("tbody")[0];
    table.deleteRow(_this.parentNode.parentNode.rowIndex - 1);
}
//If the button next to the event is pressed another event dropdownlist is created
function addJointEvent(_this) { //adds Event (better variable names)
    const table = _this.closest("table");
    if (table.rows.length <= 4) {
        const newRow = table.insertRow(table.rows.length);
        const cell0 = newRow.insertCell(0);
        const newElement = document.createElement("div");
        newElement.className = "form-select customform"; //Creates a form select-div
        const childElement = $("#eventTable").find("select")[0];
        const cln = childElement.cloneNode(true);
        newElement.appendChild(cln);
        cell0.appendChild(newElement);
        const cell1 = newRow.insertCell(1);
        const newText2 = document.createElement("a");
        newText2.className = "button remove";
        newText2.text = "-";
        newText2.setAttribute("onclick", "removeJointEvent(this)");
        cell1.appendChild(newText2);
    }
}

function removeJointEvent(_this) { //logic behind the remove button for events
    const table = _this.closest("table");
    table.deleteRow(_this.parentNode.parentNode.rowIndex);
    updateEvents();
    updateTab();
}

function selectTab(_this) {
    for (const div of document.getElementsByClassName("button tab")) {
        div.className = div.className.replace("selected", "");
    }
    for (const table of $('table[id="eventTable"]')) {
        $(table).hide();
    }
    _this.className += "selected";
    const tableId = $(_this.parentElement).find("div").index(_this);
    $($('table[id="eventTable"]')[tableId]).show();
}

function updateTab() {
    const tab = $('div[class="button tab selected"]')[0];
    const tabId = $(tab.parentElement).find("div").index(tab);
    tab.innerHTML = searchQuery.events[tabId].getAlias();
}

function addEvent(_this) {
    const table = $("#eventTable")[0].cloneNode(true);
    test = table;
    while ($(table).find("tr").length > 2) {//Get's rid of extra entries
        $(table).find("tr").last().remove();
    }
    const div = $("#events")[0];
    const adjacentTab = _this.previousElementSibling.cloneNode(true);
    div.appendChild(table);
    adjacentTab.innerHTML = "NA";
    _this.parentElement.insertBefore(adjacentTab, _this);
    if ($(_this.parentElement).find("div").length >= 6) {
        $(_this).hide();
    }
    selectTab(adjacentTab);

}

function removeEvent(_this) {
    test = _this;
    const table = $(_this).parents()[3];
    if ($(table.parentElement).find("table").length > 1) {
        const buttons = document.getElementsByClassName("button tab");
        const tableIndex = $(table.parentElement).find("table").index(table);
        if (tableIndex > 0) {
            selectTab(buttons[tableIndex - 1]);
        }
        else {
            selectTab(buttons[tableIndex + 1]);
        }
        buttons[tableIndex].remove();
        table.remove();
        if (!$('div[class="button tab append"]').is(":visible")) {
            $('div[class="button tab append"]').show();
        }
    }
}
//Randomly changes the logo
function randomImage() {
    const r = Math.floor(Math.random() * 100);
    if (r <= 2) {
        $("#logoImage")[0].src = "/images/demoticks_logo_Guakala.png";
    }
}
//Updates the "Count" dom object by an increment of amount
function updateCount(amount, index) {
    const text = $("#Count")[0].innerHTML;
    const numbers = text.split("/");
    numbers[index] = (parseInt(numbers[index]) + amount).toString();
    $("#Count")[0].innerHTML = numbers[0] + "/" + numbers[1];
}

async function getLogsTfResponse(steamIds, retries = 5) {
    if (retries <= 0) {
        return new Promise.reject(ResponseIssues.noRetry);
    }
    console.log(`https://logs.tf/json_search?player=${steamIds.toString()}&limit=10000`);
    const data = await $.getJSON(`https://logs.tf/json_search?player=${steamIds.toString()}&limit=10000`).catch(async err => {
        if (err.getAllResponseHeaders() === "") {
            await sleep(1000);
            return getLogsTfResponse(steamIds, retries - 1);
        }
    });
    if (data["success"] === true) {
        return data;
    }
    return new Promise.reject(ResponseIssues.noResponse);
}
function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}
//Returns an array of logids in the given date-range and specified format
function getLogs() {
    const fromDate = $("#startdate")[0].value;
    const toDate = $("#enddate")[0].value;
    let logs = [];
    return new Promise(function (resolve, reject) {
        const steamIds = [];
        getPlayers().then(async function (data) {
            for (const index in data) {
                steamIds.push(data[index].steam64);
            }
            if (steamIds.length !== 0) {

                const data = await getLogsTfResponse(steamIds).catch(err => {
                    if (err === ResponseIssues.noResponse) {
                        alert("Invalid Input");
                        reject(err);
                    }
                    else if (err === ResponseIssues.noRetry) {
                        alert("Logs.tf api issue please try again");
                        reject(err);
                    }
                    else {
                        alert("Something went wrong. Please try again.");
                        reject();
                    }
                });
                logloop: for (const index in data["logs"]) { //iterate through each log
                    if (data["logs"][index]["date"] * 1000 >= dateTimeToUnixJS(fromDate) &&
                        data["logs"][index]["date"] * 1000 <= dateTimeToUnixJS(toDate) && //if the logs are withing the specified timeframe
                        playerAmountNotExcluded(data["logs"][index]["players"])) {

                        logs.push(data["logs"][index]["id"]);
                    }
                    if (data["logs"][index]["date"] * 1000 < dateTimeToUnixJS(fromDate)) {
                        break logloop;
                    }
                }
                logs = logs.slice(0, 400); //Limit the amount of logs sent to the database
                updateCount(logs.length, 0);
                resolve(logs);

            }
            else {
                alert("No Players specified");
                reject("No Players specified");
            }
        });
    });
}
//return true if the log file with the amount of players shouldn't be excluded otherwise false
function playerAmountNotExcluded(playeramount) {
    const cb2v2Value = $("#2v2")[0].checked;
    const cb6v6Value = $("#6v6")[0].checked;
    const cb9v9Value = $("#9v9")[0].checked;
    if (!cb2v2Value && (playeramount <= 7)) {
        return true;
    }
    else if (!cb6v6Value && ((8 <= playeramount) && (playeramount <= 15))) {
        return true;
    }
    else if (!cb9v9Value && (16 <= playeramount)) {
        return true;
    }
    else { return false; }
}
//Queries a graphql query to add each log to the database
async function startSearch() {
    if ($("#startdate")[0].value > $("#enddate")[0].value) {
        alert("ERROR: The Startdate is specified as a date after the Enddate");
        return 0;
    }
    $("#Count")[0].innerHTML = "0/0";
    $('div[name= "requestingLogs"]').show();
    updateAttackers(); updateVictims(); updateEvents();
    const logs = await getLogs().catch(err => { $('div[name="requestingLogs"]').hide(); return 0; });
    if (logs.length === 0) {
        alert("No logs found within the given date-range");
        return 0;
    }
    searchQuery.setLogIds(logs);
    await addEvents(searchQuery.logIds, 30, updateCount);
    let queryResults = await queryData(searchQuery.toQuery()).catch(error => {
        if (error === SyntaxError) {
            alert("Something with the selected data is wrong.");
        }
    });
    if (queryResults !== undefined) { //Maybe do a lot more of the table coloring with css. Would make this a lot nicer
        queryResults = queryResults.event;
        const eventTable = new TableCreator("table outputtable", "outputTable");
        const eventSorting = ["second", ""].concat(searchQuery.events.map(event => event.getAlias()));
        eventTable.addHeader(["Date", "Map"].concat(searchQuery.events.map(event => event.getAlias())));
        eventTable.setFixedRowLength(searchQuery.events.length + 2);
        for (const result of queryResults) {
            eventTable.addRow([`<a href='https://logs.tf/${result["logid"]}'>${unixToDateTime(result["date"]).toUTCString()}</a>`,
            result["map"]], ["", ""], "boxfancy tableheading");
            eventTable.addRow([getPlayerName(result["events"][0]["attacker"].toString())], [""], "boxfancy tabledata");
            for (values in result["events"]) {
                {
                    if (values >= 1) {
                        if (result["events"][values]["attacker"] !== result["events"][values - 1]["attacker"]) {
                            eventTable.addRow([getPlayerName(result["events"][values]["attacker"].toString())], [""], "boxfancy tabledata");
                        }
                    }
                    eventTable.addRow(createEventObject(result["events"][values]), "", "tabletick", eventSorting);

                }
            }
        }
        $("#outputTable")[0].innerHTML = eventTable.table.innerHTML;

    }
    else {
        alert("No events found with the given specifications");
    }
    $('div[name="requestingLogs"]').hide();
}
//Fine for now... Maybe rework after css rework
function createEventObject(events) {
    const values = {};
    values.second = events.second * 66;
    for (thing of searchQuery.events) {
        values[thing.getAlias()] = thing.matches(events);
    }
    return values;
}

function updateEvents() {
    const events = [];
    const eventTables = $('table[id="eventTable"]');
    for (const eventTable of eventTables) {
        const event = new Event();
        const htmlEvents = $(eventTable).find("select");
        for (const htmlEvent of htmlEvents) {
            event.add(htmlEvent.value);
        }
        events.push(event);
    }
    searchQuery.setEvents(events);
}

async function updateAttackers() {
    await getPlayers();
    const playerArray = [];
    const table = $("#attackerTable").children("tbody")[0];
    $.each(table.rows, function (attacker) {
        const row = $(table.rows[attacker]).find("select")[0];//.getElementsByTagName("div")[0].getElementsByTagName("select")[0];
        if (row.options[row.selectedIndex].value == "players") {
            for (const index in players) {
                playerArray.push(players[index].steam64);
            }
        }
        else if (row.options[row.selectedIndex].value == "anyone") {
            playerArray.push(null);
        }
        else {
            playerArray.push(row.options[row.selectedIndex].value);
        }
    });
    searchQuery.setAttackers(playerArray);
}

async function updateVictims() {
    await getPlayers();
    const playerArray = [];
    const table = $("#victimTable").children("tbody")[0];
    $.each(table.rows, function (victim) {
        const row = $(table.rows[victim]).find("select")[0];//.getElementsByTagName("div")[0].getElementsByTagName("select")[0];
        if (row.options[row.selectedIndex].value == "players") {
            for (const index in players) {
                playerArray.push(players[index].steam64);
            }
        }
        else if (row.options[row.selectedIndex].value == "anyone") {
            playerArray.push(null);
        }
        else {
            playerArray.push(row.options[row.selectedIndex].value);
        }
    });
    searchQuery.setVictims(playerArray);
}
//returns the dom trays from the dom object: attackerTable
function getAttackerTrays() {
    const attackerTrays = [];
    const table = $("#attackerTable").children("tbody")[0];
    for (const tray of table.rows) {
        attackerTrays.push(tray);
    }
    return attackerTrays;
}
//returns the dom trays from the dom object: victimTable
function getVictimTrays() {
    const victimTrays = [];
    const table = $("#victimTable").children("tbody")[0];
    for (const tray of table.rows) {
        victimTrays.push(tray);
    }
    return victimTrays;
}

function dateTimeToUnixJS(date) { //when working with dates from JS
    return Date.parse(date);
}

function unixToDateTimeJS(unix) {//when working with dates from JS
    return new Date(unix);
}

function dateTimeToUnix(date) { //literally everything else
    return Date.parse(date) / 1000;
}

function unixToDateTime(unix) { //literally everything else
    return new Date(unix * 1000);
}
