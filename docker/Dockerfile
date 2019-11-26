FROM ethereum/client-go:v1.9.5
ADD /docker/chain_data /chain_data
ADD /docker/configs /configs
ADD /docker/root /root
ADD /docker/startup.sh /
RUN apk update && apk upgrade && apk add bash && apk add bash-doc && apk add bash-completion
RUN chmod +x ./startup.sh
RUN export PATH=$PATH:/startup.sh
ENTRYPOINT ["./startup.sh"]
CMD [""]
EXPOSE 8545 8546
