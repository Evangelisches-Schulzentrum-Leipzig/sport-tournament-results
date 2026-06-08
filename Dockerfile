FROM node:26-slim AS base

ARG BACKEND_URL=http://localhost:8083

WORKDIR /code

COPY package.json /code/package.json

RUN npm install -D --no-audit --no-fund
RUN npm cache clean --force

COPY . /code
RUN npm run build

RUN find /code/js -type f -name "*.js" -exec sed -i \
    -e "s|http://localhost:8083|${BACKEND_URL}|g" \
    -e "s|ws://localhost:8083/ws|$(echo ${BACKEND_URL} | sed 's/^http/ws/')/ws|g" {} +

WORKDIR /code

CMD ["npm", "run", "start"]