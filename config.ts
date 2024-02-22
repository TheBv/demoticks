interface IConfig {
    port: number
    requestLimit: number
    workerThreads: number
}

export const config: IConfig = {
    port: parseInt(process.env.port|| "4351"), 
    requestLimit: parseInt(process.env.requestLimit || "400"),
    workerThreads: parseInt(process.env.workerThreads || "2")
};

