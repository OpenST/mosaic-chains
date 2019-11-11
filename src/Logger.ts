import * as winston from 'winston';

export default winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.simple(),
  ),
  defaultMeta: { service: 'mosaic-chains' },
  transports: [new winston.transports.Console()],
  exceptionHandlers: [new winston.transports.Console()],
});
