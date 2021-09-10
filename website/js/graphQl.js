const queryData = function(query) {
    return new Promise(function (resolve, reject) {
        fetch(`./graphql`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                query: query
            })
        }).catch(function (error) {
            console.log(error);
            reject(error);
        })
            .then(res => res.json())
            .then(res => resolve(res.data));
    });
}