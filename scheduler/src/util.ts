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

/* eslint-disable no-console */
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import chalk from 'chalk';

const log = (...msg) => console.log(chalk.blue(`[Scheduler] ${msg}`));
const logWarn = (...msg) => console.log(chalk.yellow(`[Scheduler] ${msg}`));

const getDirectories = (source) =>
  fs
    .readdirSync(source, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name);

const getEnv = () => {
  const erdaRoot = path.resolve(__dirname, '../..');
  const publicDir = `${erdaRoot}/public`;
  const staticDir = `${erdaRoot}/public/static`;
  [publicDir, staticDir].forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
    }
  });
  let envConfig = {};
  let dataAppName = '';
  if (process.env.NODE_ENV !== 'production') {
    const { parsed: envFileConfig } = dotenv.config({ path: `${erdaRoot}/.env` });
    envConfig = envFileConfig;
    if (!envConfig) {
      throw Error('cannot find .env file in erda-ui root directory');
    }

    // get data platform info
    const modulePath = path.resolve(__dirname, '../../../erda-ui-enterprise');
    const children = fs.readdirSync(modulePath, { withFileTypes: true });
    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      if (child.isDirectory()) {
        const configPath = path.resolve(modulePath, child.name, 'erda-build-config.js');
        if (fs.existsSync(configPath)) {
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          const moduleConfig = require(configPath);
          if (moduleConfig.role === 'DataEngineer') {
            dataAppName = moduleConfig.name;
            break;
          }
        }
      }
    }
  } else {
    envConfig = { BACKEND_URL: process.env.OPENAPI_ADDR, GITTAR_ADDR: process.env.GITTAR_ADDR };
    dataAppName = process.env.DATA_APP_NAME;
  }

  return {
    erdaRoot,
    staticDir,
    publicDir,
    envConfig: envConfig as {
      BACKEND_URL: string;
      GITTAR_ADDR?: string;
      MODULES?: string;
      SCHEDULER_URL?: string;
      SCHEDULER_PORT?: number;
    },
    dataAppName,
  };
};

export const getHttpsOptions = () => ({
  key: fs.readFileSync(path.resolve(__dirname, '../..', `cert/dev/server.key`), 'utf8'),
  cert: fs.readFileSync(path.resolve(__dirname, '../..', `cert/dev/server.crt`), 'utf8'),
});

export { log, logWarn, getDirectories, getEnv };
