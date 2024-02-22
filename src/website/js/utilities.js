//Removes element from an array without creating an empty Element
Array.prototype.remove = function (from, to) {
    const rest = this.slice((to || from) + 1 || this.length);
    this.length = from < 0 ? this.length + from : from;
    return this.push.apply(this, rest);
};
Object.defineProperty(Array.prototype, "remove", {
    enumerable: false
});

//Splits an array into chunks with the maximum size of chunk_size
function chunkArray(array, chunkSize) {
    const tempArray = [];

    for (let index = 0; index < array.length; index += chunkSize) {
        const chunk = array.slice(index, index + chunkSize);
        tempArray.push(chunk);
    }

    return tempArray;
}