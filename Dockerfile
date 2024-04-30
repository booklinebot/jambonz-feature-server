FROM --platform=linux/amd64 node:18.15-alpine3.16 as base

RUN apk --update --no-cache add --virtual .builds-deps build-base python3

RUN apk --update --no-cache add freeswitch freeswitch-sample-config freeswitch-sounds-en-us-callie-8000

WORKDIR /opt/app/

FROM base as build

COPY package.json package-lock.json ./

RUN npm ci

COPY . .

FROM base

COPY --from=build /opt/app /opt/app/

ARG NODE_ENV

ENV NODE_ENV $NODE_ENV

CMD [ "node", "app.js" ]
