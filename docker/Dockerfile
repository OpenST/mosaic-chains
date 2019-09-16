FROM ethereum/client-go:v1.8.23
ADD /docker/origin_volume /origin_volume
ADD /docker/auxiliary_volume /auxiliary_volume
ADD /docker/origin /origin_chain_data
ADD /docker/1000 /auxiliary_chain_data_1000
ADD /docker/startup.sh /
RUN apk update && apk upgrade && apk add bash && apk add bash-doc && apk add bash-completion
RUN chmod +x ./startup.sh
RUN export PATH=$PATH:/startup.sh
ENTRYPOINT ["./startup.sh"]
CMD [""]
EXPOSE 8545 8546