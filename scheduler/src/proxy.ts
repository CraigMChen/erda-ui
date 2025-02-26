// Copyright (c) 2021 Terminus, Inc.
//
// This program is free software: you can use, redistribute, and/or modify
// it under the terms of the GNU Affero General Public License, version 3
// or later ("AGPL"), as published by the Free Software Foundation.
//
// This program is distributed in the hope that it will be useful, but WITHOUT
// ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
// FITNESS FOR A PARTICULAR PURPOSE.
//
// You should have received a copy of the GNU Affero General Public License
// along with this program. If not, see <http://www.gnu.org/licenses/>.

import { createProxyMiddleware } from 'http-proxy-middleware';
import { Request } from 'express';
import { getEnv, logWarn } from './util';
import { INestApplication } from '@nestjs/common';

const isProd = process.env.NODE_ENV === 'production';

const { envConfig, dataAppName } = getEnv();
const { BACKEND_URL, GITTAR_ADDR } = envConfig;

const API_URL = BACKEND_URL.startsWith('http') ? BACKEND_URL : `http://${BACKEND_URL}`;
let gittarUrl = isProd ? GITTAR_ADDR : BACKEND_URL;
gittarUrl = gittarUrl.startsWith('http') ? gittarUrl : `http://${gittarUrl}`;

const wsPathRegex = [
  /^\/api\/[^/]*\/websocket/,
  /^\/api\/[^/]*\/terminal/,
  /^\/api\/[^/]*\/apim-ws\/api-docs\/filetree/,
];

export const createProxyService = (app: INestApplication) => {
  app.use(
    `/api/**/${dataAppName}-websocket`,
    createProxyMiddleware({
      target: API_URL,
      ws: true,
      changeOrigin: !isProd,
      pathRewrite: replaceApiOrgPath,
      onProxyReqWs: (proxyReq, req: Request, socket) => {
        proxyReq.setHeader('org', extractOrg(req.headers.referer));
        socket.on('error', (error) => {
          logWarn('Websocket error.', error);
        });
      },
    }),
  );
  app.use(
    createProxyMiddleware(
      (pathname: string) => {
        return wsPathRegex.some((regex) => regex.test(pathname));
      },
      {
        target: API_URL,
        ws: true,
        changeOrigin: !isProd,
        pathRewrite: replaceApiOrgPath,
        onProxyReqWs: (proxyReq, req: Request, socket) => {
          proxyReq.setHeader('org', extractOrg(req.headers.referer));
          socket.on('error', (error) => {
            logWarn('Websocket error.', error); // add error handler to prevent server crash https://github.com/chimurai/http-proxy-middleware/issues/463#issuecomment-676630189
          });
        },
      },
    ),
  );
  app.use(
    '/api',
    createProxyMiddleware(
      (pathname: string) => {
        return pathname.match('^/api') && pathname !== '/api/dice-env';
      },
      {
        target: API_URL,
        changeOrigin: !isProd,
        secure: false,
        pathRewrite: replaceApiOrgPath,
        onProxyReq: (proxyReq, req: Request) => {
          isProd && proxyReq.setHeader('org', extractOrg(req.headers.referer));
        },
      },
    ),
  );
  let dataServiceUIAddr = isProd ? process.env[`${dataAppName.toUpperCase()}_UI_ADDR`] : API_URL;
  dataServiceUIAddr = dataServiceUIAddr.startsWith('http') ? dataServiceUIAddr : `http://${dataServiceUIAddr}`;
  app.use(
    `/${dataAppName}-app/`,
    createProxyMiddleware({
      target: `${dataServiceUIAddr}/`,
      changeOrigin: !isProd,
      pathRewrite: (p: string, req: Request) => {
        if (p === `/${dataAppName}-app/static/menu.json`) {
          const lang = req.headers.lang || 'zh-CN';
          return `/${dataAppName}-app/static/menu-${lang === 'zh-CN' ? 'zh' : 'en'}.json`;
        }
        return p;
      },
    }),
  );
  app.use(
    createProxyMiddleware(
      (pathname: string, req: Request) => {
        const userAgent = req.headers['user-agent'];
        if (userAgent.includes('git')) {
          return /[^/]*\/dop/.test(pathname);
        }
        return false;
      },
      {
        target: gittarUrl,
        changeOrigin: !isProd,
      },
    ),
  );
  app.use(
    '/metadata.json',
    createProxyMiddleware({
      target: API_URL,
      changeOrigin: !isProd,
    }),
  );
};

const replaceApiOrgPath = (p: string) => {
  if (isProd) {
    const match = /\/api\/([^/]*)\/(.*)/.exec(p); // /api/orgName/path => /api/path
    if (match && !p.startsWith('/api/files')) {
      return `/api/${match[2]}`;
    }
  }
  return p;
};

const extractOrg = (p: string) => {
  const match = /https?:\/\/[^/]*\/([^/]*)\/?/.exec(p);
  if (match && !p.startsWith('/api/files')) {
    return match[1];
  }
  return '';
};
