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

import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { HealthController } from './controllers/health.controller';
import { LegacyRouteController } from './controllers/legacy-route.controller';
import { getEnv } from './util';
import { MarketController } from './controllers/market.controller';
import { envController } from './controllers/env.controller';

const { publicDir } = getEnv();
@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: publicDir,
      serveRoot: '/',
      serveStaticOptions: {
        maxAge: 30 * 60 * 60 * 24, // 30d
        index: false,
      },
    }),
  ],
  controllers: [HealthController, LegacyRouteController, MarketController, envController],
  providers: [],
})
export class AppModule {}
