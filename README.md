# Demoticks.tf

# About
This is the repository for both the back and frontend for [demoticks.tf](demoticks.tf).

Demoticks.tf allows the user to find relevant events in their recent Team Fortress 2 matches uploaded to logs.tf

## Docker image

A docker image can be found here: [docker-hub](https://hub.docker.com/r/thebv/demoticks-node-app)

> You'll also need a working mysql server. See [docker-compose.yml](https://github.com/TheBv/demoticks/blob/master/docker-compose.yml) for more details

## Building
Node.js and npm are required to build the project.
Simply run `npm install --force` and you're ready to go!

## Running
Either use `npm run buildcjs` and `npm run start` to build and then run the js files or run the project with typescript "directly" using the `tsconfig.json`
