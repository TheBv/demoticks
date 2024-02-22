var reqeustLogs;
var returnedPlayers = new Object();
var idToDemoName = new Map();
var searchQuery = new SearchQuery();
var result;
autoSelectTimezone();
disableButtons();
$(function () {
    $('#import-pfx-button').click(function (e) {
        $('#file-input').click();
    });
    $('#file-input').change(handleFileSelect);
});
$("#advancedOptionsButton").click(function (e) {
    $("#advancedOptionsTable").toggle();
});

function handleFileSelect(e) {
    const files = e.target.files;
    if (files.length < 1) {
        alert('select a file...');
        return;
    }
    reqeustLogs = [];
    prepareFileData(files).then(result => {
        reqeustLogs = result;
        createFileTable();

    }).catch(error => { console.log(error); });
}

function createFileTable() {
    const tableBody = $("#outputTable")[0];
    const dataTable = new TableCreator("table outputtable", "outputTable");
    dataTable.setFixedRowLength(5);
    dataTable.addHeader(["File Name", "File Date", "LogFile Date", "Logs.tf", "Format"], "boxfancy tableheading");

    $.each(reqeustLogs, function (index, fileData) {
        dataTable.addRow([fileData.file.name,//FileName
        UnixToDateTime(fileData.date), //File Date
        UnixToDateTime(fileData.logtfData[fileData.selectIndex].date), //Logfile Date
        `<a href =https://logs.tf/${fileData.logtfData.id}>logs.tf/${fileData.logtfData[fileData.selectIndex].id}</a>` + createDropdown(fileData.logtfData, "changeLog", "cog").outerHTML, //Logs.tf
        gameFormat(fileData.logtfData[fileData.selectIndex].players) + '<a class="button remove" onclick="removeFile(this)">-</a>'],//Format
            "", "boxfancy fileTable"); //Settings

    });
    tableBody.innerHTML = dataTable.table.innerHTML;
    for (const index in reqeustLogs) {
        $('select[name=changeLog')[index].selectedIndex = reqeustLogs[index].selectIndex;
    }
    $("#fetchEvents")[0].disabled = false;
    $('select[name=changeLog').change(function (select) {
        select = select.currentTarget;
        const index = select.parentElement.parentElement.rowIndex - 1;
        const selectedIndex = select.selectedIndex;
        reqeustLogs[index].selectIndex = selectedIndex;
        createFileTable();
    });
}
function createDropdown(entries, name, classAttribute, selectedIndex = 0) {
    const select = document.createElement("select");
    select.setAttribute("name", name);
    select.setAttribute("class", classAttribute);
    $.each(entries, function (index, entry) {
        const option = document.createElement("option");
        option.appendChild(document.createTextNode(entry.id));
        option.value = index.toString();
        select.appendChild(option);
    });
    select.selectedIndex = selectedIndex;
    return select;
}

function disableButtons() {
    $("#fetchEvents")[0].disabled = true;
    $("#createVdm")[0].disabled = true;
}

function removeFile(_this) {
    const table = $("#outputTable").children("tbody")[0];
    const rowIndex = _this.parentElement.parentElement.rowIndex - 1;
    table.deleteRow(rowIndex);
    reqeustLogs.remove(rowIndex);
}

function removeRow(_this) {
    const table = $("#outputTable").children("tbody")[0];
    const rowIndex = _this.parentElement.parentElement.rowIndex - 1;
    table.deleteRow(rowIndex);
}
function removeTitle(_this, index) {
    try {
        const table = $("#outputTable").children("tbody")[0];
        const rowIndex = _this.parentElement.parentElement.rowIndex - 1;
        for (const event of result[index].events) {
            if (event !== null) {
                table.deleteRow(rowIndex);
            }
        }
        table.deleteRow(rowIndex);
    }
    catch (err) { console.log(err); }
}
function autoSelectTimezone() {
    const select = $("#timezone")[0];
    let offset = -Math.round(new Date().getTimezoneOffset() / 60);
    if (offset < 0) {
        offset = Math.abs(12 + offset) + 13;
    }
    select.selectedIndex = offset;
}
async function getFileEvents() {
    await getPlayers();
    if (players.length !== 0) {
        await getPlayers();
        const reqeustIds = []; //Make it update on deletion and stuff

        for (fileData of reqeustLogs) {
            idToDemoName.set(fileData.logtfData[fileData.selectIndex].id, fileData.file.name);
            reqeustIds.push(fileData.logtfData[fileData.selectIndex].id);
        }
        searchQuery.setLogIds(reqeustIds);

        searchQuery.setAttackers([players[0].steam64]);
        updateEvents();
        await addEvents(searchQuery.logIds, 20);

        result = await queryData(searchQuery.toQuery());
        if (result !== undefined) {
            result = result.event;
            const eventArray = searchQuery.events;
            const tableBody = $("#outputTable")[0];
            const eventTable = new TableCreator("table outputtable", "outputTable");

            const eventSorting = ["second", ""].concat(searchQuery.events.map(event => { return event.getAlias(); }));
            eventSorting.push("button");
            eventTable.addHeader(["Date", "Logid"].concat(searchQuery.events.map(event => { return event.getAlias(); })).concat([""]));
            eventTable.setFixedRowLength(eventArray.length + 3);
            for (entryIndex in result) {
                const entry = result[entryIndex];
                const titleRow = appendEmptyString([idToDemoName.get(entry.logid), `<a href =https://logs.tf/${entry.logid}>logs.tf/${entry.logid}</a>`], eventArray.length);
                titleRow.push(`<a class="button remove" onclick="removeTitle(this,${entryIndex});delete result[${entryIndex}]">-</a>`);
                eventTable.addRow(titleRow, ["", ""], "boxfancy tableheading");
                for (values in entry.events) {
                    if (values >= 1) {
                        if (entry.events[values]["attacker"] !== entry.events[values - 1]["attacker"]) {
                            eventTable.addRow([getPlayerName(entry.events[values]["attacker"].toString())], [""], "boxfancy tabledata");
                        }
                    }
                    entry.events[values].button = `<a class="button remove" onclick="removeRow(this);delete result[${entryIndex}].events[${values}]">-</a>`;
                    eventTable.addRow(createEventObject(entry.events[values]), "", "tabletick", eventSorting);
                }
            }
            test = eventTable;
            tableBody.innerHTML = eventTable.table.innerHTML;
            $("#outputTable")[0].setAttribute("class", "table outputtable");
            $("#createVdm")[0].disabled = false;
        }
        else {
            alert("No events found with the given specifications");
        }
    }
    else {
        alert("Please insert player");
    }

}
function createEventObject(events) {
    const values = {};
    values.second = events.second * 66;
    for (thing of searchQuery.events) {
        values[thing.getAlias()] = thing.matches(events);
    }
    return values;
}
function appendEmptyString(array, count) {
    for (let i = 0; i < count; i++) {
        array.push("");
    }
    return array;
}
function createVDM() {
    const vdmMainData = result.flat();
    const allVDM = [];
    $.each(vdmMainData, function (entryIndex, entry) {
        const VDM = new EventVDM();
        VDM.setfileName(idToDemoName.get(entry.logid));

        if (entryIndex !== vdmMainData.length - 1) { //Sets the map it jumps to at the end
            VDM.setLink(idToDemoName.get(vdmMainData[entryIndex + 1].logid));
        }
        entry.events = entry.events.flat();
        for (const event of entry.events) {

            VDM.addEvent(event.second * 66);
        }
        allVDM.push(VDM);
    });
    const zip = new JSZip();
    zip.file("startfile_is_" + allVDM[0].fileName.replace(".dem", ""), "The first demo to play is: " + allVDM[0].fileName);
    for (const VDM of allVDM) {
        zip.file(VDM.fileName.replace(".dem", ".vdm"), VDM.toString());

    }
    zip.generateAsync({ type: "blob" })
        .then(function (content) {
            saveAs(content, "VdmFiles.zip");
        });
}

class EventVDM {
    constructor() {
        this.link;
        this.fileName;
        this.events = [];
        this.recordingMultipliers = [];
    }

    setLink(fileName) {
        this.link = fileName;
    }

    setfileName(fileName) {
        this.fileName = fileName;
    }

    addEvent(tick, recordingMultiplier = 0) {
        this.events.push(tick);
        this.recordingMultipliers.push(recordingMultiplier);
    }

    toString() { //If record-duration NO OVERLAP!!!
        this.events.sort((a, b) => a - b);
        let vdmString = "demoactions\n {\n";
        let indexAdjust = 0;
        let count = 2;
        const skipBuffer = 500;
        const stopRecordBuffer = parseInt($("#recordDuration")[0].value) * 66;
        const startRecordBuffer = parseInt($("#prerecordDuration")[0].value) * 66;
        const self = this;
        $.each(self.events, function (tickIndex) {
            if (indexAdjust + tickIndex < self.events.length) {
                const tick = self.events[tickIndex + indexAdjust];
                const startTick = tick + stopRecordBuffer + self.recordingMultipliers[tickIndex] * 66;
                const nextTick = self.events[tickIndex + indexAdjust + 1];
                if (tickIndex === 0) {
                    vdmString += self.skipToTickBuilder(count - 1, 1, tick, skipBuffer);
                }
                vdmString += self.buildPart(count, "PlayCommands", "startrec", tick - startRecordBuffer, `commands "startrecording"`); //Initiate first record
                count++;
                vdmString += self.buildPart(count, "PlayCommands", "stoprec", startTick, `commands "stoprecording"`);
                count++;
                if (nextTick > startTick) { //If we can safely skip to the nex tick
                    vdmString += self.skipToTickBuilder(count, tick + stopRecordBuffer + (self.recordingMultipliers[tickIndex] * 66) + 300, self.events[tickIndex + indexAdjust + 1], skipBuffer);
                    count++;
                }
                else {
                    indexAdjust++;
                }
            }
        });
        if (this.link !== undefined) {
            vdmString += this.buildPart(count, "PlayCommands", "nextdem", this.events[this.events.length - 1] + stopRecordBuffer + 300, `commands "playdemo ${this.link}"`);
        }
        vdmString += "}";
        return vdmString;
    }

    skipToTickBuilder(count, starttick, tick, skipBuffer) {
        if (tick - skipBuffer > 1) {
            return this.buildPart(count, "SkipAhead", "skip", starttick, `skiptotick ${tick - skipBuffer}`);
        }
        else {
            return this.buildPart(count, "SkipAhead", "skip", starttick, `skiptotick ${tick}`);
        }
    }

    buildPart(count, factory, name, starttick, arg) {
        let string = `\t"${count}"\n`;
        string += "\t{\n";
        string += `\t\t factory "${factory}"\n`;
        string += `\t\t name "${name}"\n`;
        string += `\t\t starttick "${starttick}"\n`;
        string += `\t\t ${arg}\n`;
        string += "\t}\n";
        return string;
    }
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
        if (tableIndex > 0)
            selectTab(buttons[tableIndex - 1]);
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



//Create function to return the event name

function prepareFileData(files) {
    return new Promise(function (resolve, reject) {
        let reqeustLogs = [];
        const reqeustData = [];
        const promises = [];
        new Promise(function (resolve, reject) {
            for (let fileIndex = 0; fileIndex < files.length; fileIndex++) {
                promises.push(new Promise(function (resolve, reject) {
                    const reader = new FileReader();
                    const file = files[fileIndex];
                    reader.onload = async function () {
                        try {
                            const demoData = GetDemoInfo(reader.result.slice(0, 1073));
                            const date = getTimeStamp(file, demoData.time);
                            const element = new Object();
                            element.file = file;
                            element.demoData = demoData;
                            element.date = date;
                            element.selectIndex = 0;
                            reqeustData.push(element);
                            resolve();
                        }
                        catch (err) {
                            reject(err);
                        }

                    };
                    reader.readAsArrayBuffer(file);
                }));
            }
            Promise.all(promises).then(async function () {
                reqeustLogs = await groupReqeusts(reqeustData);
                resolve();
            }).catch(err => { console.log(err); });
        }).then(function () {
            resolve(reqeustLogs);
        });
    });
}
async function groupReqeusts(reqeustData) {
    const steamId = document.getElementById("steam64Id").value.toString();
    const returnArray = [];
    if (steamId !== "") {
        const groupedObject = groupBy(reqeustData, "map_name");
        for (const groupHead of Object.entries(groupedObject)) {
            const mapName = groupHead[0];
            const groupData = groupHead[1];
            const data = await $.getJSON(`https://logs.tf/json_search?player=${steamId}&map=${mapName}&limit=1000`);
            for (const entry of groupData) {
                entry.logtfData = getClosestLog(data, entry.date);
                returnArray.push(entry);
            }
        }
        returnArray.sort((a, b) => a.date - b.date);
    }
    return returnArray;
}
function groupBy(xs, key) {
    return xs.reduce(function (rv, x) {
        (rv[x.demoData[key]] = rv[x.demoData[key]] || []).push(x);
        return rv;
    }, {});
}

function gameFormat(playeramount) {
    if (playeramount <= 7) {
        return "2v2";
    }
    else if ((8 <= playeramount) && (playeramount <= 15)) {
        return "6v6";
    }
    else if (16 <= playeramount) {
        return "9v9";
    }
    else "NA";
}


function getTimeStamp(file, timePlayed) {
    const fileName = file.name;
    const regExs = new Map();
    let custom = $("#dateFormat")[0].value;
    for (const letter of ["Y", "M", "D", "H", "m", "s"]) {
        custom = custom.split(letter).join("\\d{1}");
    }
    const timezone = $("#timezone")[0].value;
    regExs.set(new RegExp(custom), $("#dateFormat")[0].value);
    regExs.set(/\d{8}_\d{4}/, "YYYYMMDD_HHmm");
    regExs.set(/\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}/, "YYYY-MM-DD_HH-mm-ss");
    regExs.set(/\d{4}-\d{2}-\d{2}-\d{2}-\d{2}/, "YYYY-MM-DD_HH-mm");
    for (const [key, value] of regExs) {
        const timeExec = key.exec(fileName);
        if (timeExec !== null) {
            const timeString = timeExec[0];
            return (moment.tz(timeString, value, timezone)).add(timePlayed, 'seconds').unix();
        }
    }
    console.log("Last Modified date used");
    return moment.tz(Math.round(file.lastModified / 1000), timezone).unix();

}

function getClosestLog(jsonData, date) {
    jsonData.logs.sort((a, b) => Math.abs(a.date - date) - Math.abs(b.date - date));
    return [...jsonData.logs];
}
class DemoReader {
    constructor() {
        this.dem_prot;
        this.net_prot;
        this.host_name;
        this.client_name;
        this.map_name;
        this.gamedir;
        this.time;
        this.ticks;
        this.frames;
        this.signon;
    }

}
function GetDemoInfo(data) {
    const demoReader = new DemoReader();
    const view = new DataView(data);
    const array = new Uint8Array(data);
    if (ReadString(array.slice(0, 8)) === "HL2DEMO") {
        demoReader.dem_prot = view.getInt32(8, true);
        demoReader.net_prot = view.getInt32(12, true);
        demoReader.host_name = ReadString(array.slice(16, 276));
        demoReader.client_name = ReadString(array.slice(276, 536));
        demoReader.map_name = ReadString(array.slice(536, 796));
        demoReader.gamedir = ReadString(array.slice(796, 1056));
        demoReader.time = view.getFloat32(1056, true);
        demoReader.ticks = view.getInt32(1060, true);
        demoReader.frames = view.getInt32(1064, true);
        demoReader.signon = view.getInt32(1068, true);
    }
    return demoReader;
}
function ReadString(int8Array) {
    let returnString = "";
    int8Array.forEach(item => {
        if (item !== 0)
            returnString += String.fromCharCode(item);
    });
    return returnString;
}

function DateTimeToUnixJS(date) { //when working with dates from JS
    return Date.parse(date);
}
function UnixToDateTimeJS(unix) {//when working with dates from JS
    return moment.unix(unix)._d;
}
function DateTimeToUnix(date) { //literally everything else
    return Date.parse(date) / 1000;
}
function UnixToDateTime(unix) { //literally everything else
    //let date = new Date(unix * 1000)
    return moment.unix(unix).format("YYYY-MM-DD HH:mm:ss");
}

