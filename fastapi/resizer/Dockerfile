# Use alpine because the node image wouldn't install sharp correctly without errors
FROM alpine:3.11.6

RUN apk update
RUN apk upgrade
RUN apk add nodejs
RUN apk add yarn

WORKDIR /opt/resizer
COPY . .
RUN yarn install --production --frozen-lockfile

ENV NODE_ENV production
EXPOSE 8005
ENTRYPOINT ["node", "/opt/resizer/index.js"]
