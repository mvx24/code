# Use alpine because the node image wouldn't install sharp correctly without errors
FROM jrottenberg/ffmpeg:4.1-alpine

RUN apk update
RUN apk upgrade
RUN apk add nodejs
RUN apk add yarn

WORKDIR /opt/transcoder
COPY . .
RUN yarn install --production --frozen-lockfile

ENV NODE_ENV production
EXPOSE 8006
ENTRYPOINT ["node", "/opt/transcoder/index.js"]
