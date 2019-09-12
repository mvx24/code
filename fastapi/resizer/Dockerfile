FROM node

ENV DEBIAN_FRONTEND noninteractive
RUN apt-get update
RUN apt-get upgrade -y

WORKDIR /opt/resizer
COPY . .
RUN yarn install --production

ENV NODE_ENV production
ENTRYPOINT ["node", "/opt/render-server/index.js"]
