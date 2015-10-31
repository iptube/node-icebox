FROM node:latest
MAINTAINER Joe Hildebrand <joe-github@cursive.net>

VOLUME /root/.npm

ADD . /opt/icebox
WORKDIR /opt/icebox

RUN npm install

CMD ["./node_modules/.bin/gulp", "test"]
