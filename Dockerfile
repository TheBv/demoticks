FROM node:16.8

COPY package.json ./

RUN npm install --force

COPY . . 

RUN npx prisma generate

EXPOSE 4351

RUN useradd -u 8877 demoticks

USER demoticks

CMD ["npm","run","start"]