FROM node:26-slim AS base

WORKDIR /code

COPY package.json /code/package.json

RUN npm install -D --no-audit --no-fund
RUN npm cache clean --force

COPY . /code
RUN npm run build

WORKDIR /code

CMD ["npm", "run", "start"]