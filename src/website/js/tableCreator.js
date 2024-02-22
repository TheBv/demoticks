//A class to create a Table and add rows to it
//Constructor:
//  customClass: String; the dom class the table should use
//  id: String; the dom id the table should have
//setFixedRowLength: makes each row added, "length" long
//  length: Int; the amount of cells each row should have
//addRow:
//  rowData: Object/Array;
//  cellSettings: [String]/String; The dom classes each cell should have
//  rowSettings: String; The dom classes a row should have
//  rowSortingArray: [String]; if rowData is an object: defines the cell index each rowData value should have
class TableCreator {
    constructor(customClass, id) {
        this.table = document.createElement("table");
        this.table.setAttribute("class", customClass);
        this.table.setAttribute("id", id);
        this.tbody = document.createElement("tbody");
        this.theader = document.createElement("thead");
        this.table.appendChild(this.tbody);
        this.table.appendChild(this.theader);
        this.fixedRowLength = 0;
    }
    setFixedRowLength(length) {
        this.fixedRowLength = length;
    }
    addHeader(headerData, cellSettings, rowSettings, rowSortingArray = []) {
        const headerRow = this.theader.insertRow(this.theader.rows.length);
        headerRow.setAttribute("class", rowSettings);
        let columns = this.fixedRowLength;
        //Defines the amount of columns
        if (!this.fixedRowLength) {
            columns = headerData.length;
        }
        for (let index = 0; index < columns; index++) {
            const cell = headerRow.insertCell(headerRow.cells.length);
            //If cellSettings is an Array
            if (Array.isArray(cellSettings)) {
                if (cellSettings[index] !== undefined){
                    cell.setAttribute("class", cellSettings[index]);
                }
                else{
                    cell.setAttribute("class", cellSettings[rowSettings.length - 1]);
                }
            }
            //Else each cell same dom class
            else {
                cell.setAttribute("class", cellSettings);
            }
            //If rowData is an Array
            if (Array.isArray(headerData)) {
                if (headerData[index] !== undefined) {
                    cell.innerHTML = headerData[index];
                }
            }
            //If rowData is a object
            else {
                cell.setAttribute("class", cellSettings);
                const currentHeaderData = headerData[rowSortingArray[index]];
                if (currentHeaderData !== undefined) {
                    if (currentHeaderData === true) {
                        cell.setAttribute("class", cellSettings + " cellgreen");
                    }
                    else {
                        cell.innerHTML = headerData[rowSortingArray[index]];
                    }
                }
            }
        }
    }
    addRow(rowData, cellSettings, rowSettings, rowSortingArray = []) {
        let columns = this.fixedRowLength;
        //Defines the amount of columns
        if (!this.fixedRowLength) {
            columns = rowData.length;
        }
        const row = this.tbody.insertRow(this.tbody.rows.length);

        row.setAttribute("class", rowSettings);
        //For each cell which should be created
        for (let index = 0; index < columns; index++) {
            const cell = row.insertCell(row.cells.length);
            //If cellSettings is an Array
            if (Array.isArray(cellSettings)) {
                if (cellSettings[index] !== undefined){
                    cell.setAttribute("class", cellSettings[index]);
                }
                else{
                    cell.setAttribute("class", cellSettings[rowSettings.length - 1]);
                }
            }
            //Else each cell same dom class
            else {
                cell.setAttribute("class", cellSettings);
            }
            //If rowData is an Array
            if (Array.isArray(rowData)) {
                if (rowData[index] !== undefined) {
                    cell.innerHTML = rowData[index];
                }
            }
            //If rowData is a object
            else {
                cell.setAttribute("class", cellSettings);
                const currentRowData = rowData[rowSortingArray[index]];
                if (currentRowData !== undefined) {
                    if (currentRowData === true) {
                        cell.setAttribute("class", cellSettings + " cellgreen");
                    }
                    else if (currentRowData === false || currentRowData === null ) {
                        cell.setAttribute("class", cellSettings + " cellred");
                    }
                    else {
                        cell.innerHTML = rowData[rowSortingArray[index]];
                    }
                }
            }
        }
    }
}