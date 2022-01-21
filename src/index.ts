import { NestFactory } from '@nestjs/core';
import { INestApplication } from '@nestjs/common';
import { ExpressAdapter } from '@nestjs/platform-express';
import {
  APIGatewayProxyEvent,
  APIGatewayProxyHandler,
  Context,
} from 'aws-lambda';
import { createServer, proxy } from 'aws-serverless-express';
import { Server } from 'http';
import * as express from 'express';

import { AppModule } from './app.module';

let cachedServer: Server;

const bootstrapServer: () => Promise<Server> = async (): Promise<Server> => {
  const expressApp = express();
  const adapter: ExpressAdapter = new ExpressAdapter(expressApp);
  const app: INestApplication = await NestFactory.create(AppModule, adapter);
  app.enableCors();
  await app.init();
  return createServer(expressApp);
};

export const handler: APIGatewayProxyHandler = async (
  event: APIGatewayProxyEvent,
  context: Context,
): Promise<any> => {
  if (!cachedServer) {
    cachedServer = await bootstrapServer();
  }
  return proxy(cachedServer, event, context, 'PROMISE').promise;
};
