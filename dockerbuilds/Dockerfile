FROM ubuntu:23.04
COPY . /app/network/


WORKDIR /app

RUN apt-get update && apt-get install -y wget curl jq unzip netcat-openbsd && \
    PLATFORM=`uname -a | awk '{print $(NF-1)}'` && \
    VERSION=v1.8.2 && \
    TARNAME="hermes-${VERSION}-${PLATFORM}-unknown-linux-gnu.tar.gz" && \
    wget "https://github.com/informalsystems/hermes/releases/download/${VERSION}/${TARNAME}" && \
    tar -xf "$TARNAME" && \
    mv ./hermes /usr/local/bin/ && \
    rm -rf "$TARNAME"


CMD /app/network/hermes/restore-keys.sh && \
    /app/network/hermes/create-conn.sh && \
    /app/network/hermes/create-channel.sh && \
    /app/network/start.sh && \
    sleep 18 && \
    /app/network/hermes/start.sh
