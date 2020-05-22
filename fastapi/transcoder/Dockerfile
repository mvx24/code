FROM jrottenberg/ffmpeg:4.1-alpine

# Upgrade from alpine 3.8 to 3.11
# https://wiki.alpinelinux.org/wiki/Upgrading_Alpine
RUN sed -i -e 's/v3\.8/v3.11/g' /etc/apk/repositories

RUN apk update
RUN apk upgrade --available
RUN apk add nodejs
RUN apk add yarn

WORKDIR /opt/transcoder
COPY . .
RUN yarn install --production

ENV NODE_ENV production
EXPOSE 8006
ENTRYPOINT ["node", "/opt/transcoder/index.js"]
