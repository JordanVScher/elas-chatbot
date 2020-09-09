FROM node:11.13.0
ENV NPM_CONFIG_LOGLEVEL warn

ENV TZ=America/Sao_Paulo
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

EXPOSE 2700

USER root
RUN mkdir src
RUN chown -R node:node /src
RUN apt-get update
RUN apt-get install -y runit
RUN apt-get install -y build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev


USER node
ADD package.json /src/
WORKDIR /src

#RUN npm install bottender dotenv
#RUN npm install
#ADD . /src

USER root
COPY services/ /etc/service/
RUN chmod +x /etc/service/*/run

# RUN npx sequelize-cli db:migrate

ENTRYPOINT ["runsvdir"]
CMD ["/etc/service/"]
