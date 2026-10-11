import pino from "pino";
import { config } from "../config";

const rawLogger = pino({
  level: config.LOG_LEVEL ?? "info",
  transport: config.NODE_ENV === "development"
    ? { target: "pino-pretty", options: { colorize: true } }
    : undefined,
});

export const logger = {
  info: (msg: string | object, data?: any) => {
    if (typeof msg === "string") {
      if (data !== undefined) rawLogger.info(data, msg);
      else rawLogger.info(msg);
    } else {
      rawLogger.info(msg, data);
    }
  },
  warn: (msg: string | object, data?: any) => {
    if (typeof msg === "string") {
      if (data !== undefined) rawLogger.warn(data, msg);
      else rawLogger.warn(msg);
    } else {
      rawLogger.warn(msg, data);
    }
  },
  error: (msg: string | object, data?: any) => {
    if (typeof msg === "string") {
      if (data !== undefined) rawLogger.error(data, msg);
      else rawLogger.error(msg);
    } else {
      rawLogger.error(msg, data);
    }
  },
  debug: (msg: string | object, data?: any) => {
    if (typeof msg === "string") {
      if (data !== undefined) rawLogger.debug(data, msg);
      else rawLogger.debug(msg);
    } else {
      rawLogger.debug(msg, data);
    }
  },
};