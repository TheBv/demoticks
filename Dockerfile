FROM node:16.8

COPY package.json ./

RUN npm install 

COPY . . 

COPY ./build ./build

EXPOSE 4351

RUN useradd -u 8877 demoticks

USER demoticks

CMD ["npm","run","start"]