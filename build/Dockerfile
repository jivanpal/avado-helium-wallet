FROM ubuntu:20.04

RUN apt-get update
RUN DEBIAN_FRONTEND=noninteractive TZ=UTC apt-get install -y npm supervisor

# Import wallet binary, add to PATH
RUN mkdir -p /app/wallet
COPY files/wallet/wallet /app/wallet/
ENV PATH="${PATH}:/app/wallet"

# Setup Node app
RUN mkdir -p /app/monitor
WORKDIR /app/monitor
COPY monitor/package-lock.json ./
COPY monitor/package.json ./
COPY monitor/server.js ./
RUN npm i --production

COPY files/supervisord.conf /app/

# Create directory to store wallet data inside
RUN mkdir -p /app/data

WORKDIR /app
ENTRYPOINT supervisord -n -c /app/supervisord.conf
