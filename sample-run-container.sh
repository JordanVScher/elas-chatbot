#!/bin/bash

# arquivo de exemplo para iniciar o container
#export SOURCE_DIR='/home/appcivico/projects/De-Olho-Nas-Metas-2017'
export SOURCE_DIR='/home/jordan/Dropbox/Projetos/elas-chatbot'
export DATA_DIR='/tmp/elas-chatbot/data/'

# confira o seu ip usando ifconfig docker0|grep 'inet addr:'
export DOCKER_LAN_IP=$(ifconfig docker0 | grep 'inet addr:' | awk '{ split($2,a,":"); print a[2] }')

# porta que será feito o bind
export LISTEN_PORT=1006
sequelize db:migrate

docker run --name elas-chatbot \
 -v $SOURCE_DIR:/src -v $DATA_DR:/data \
 -p $DOCKER_LAN_IP:$LISTEN_PORT:4000 \
 --cpu-shares=512 \
 --memory 1800m -dit --restart unless-stopped appcivico/elas-chatbot
