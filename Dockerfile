FROM node:18.11

WORKDIR /src

COPY package.json ./

RUN npm install

COPY . . 

RUN npx prisma generate

EXPOSE 4351

CMD ["npm","run","docker"]