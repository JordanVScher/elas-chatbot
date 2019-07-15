FROM node:11.13.0
ENV NPM_CONFIG_LOGLEVEL warn

EXPOSE 4000

USER root
RUN mkdir src
RUN chown -R node:node /src
RUN apt-get update
RUN apt-get install -y runit
RUN apt-get install -y build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev
USER node
ADD package.json /src/
WORKDIR /src

RUN npm install bottender dotenv
RUN npm install
ADD . /src

USER root
# Installing ffmpeg
RUN echo "deb http://security.debian.org/ stretch/updates main contrib non-free" | tee -a /etc/apt/sources.list
RUN apt-get update
# RUN apt-get install ffmpeg -y

COPY services/ /etc/service/
RUN chmod +x /etc/service/*/run
RUN chown -R node:node /src

ENTRYPOINT ["runsvdir"]
CMD ["/etc/service/"]