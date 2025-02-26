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

import React, { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import produce from 'immer';
import { map, get, find, isEmpty } from 'lodash';
import DC from '@erda-ui/dashboard-configurator/dist';
import { Button } from 'core/nusi';
import { PureBoardGrid } from 'common';
import { goTo } from 'common/utils';
import i18n from 'i18n';
import routeInfoStore from 'core/stores/route';
import dashboardStore from 'app/common/stores/dashboard';
import monitorCommonStore from 'common/stores/monitorCommon';
import topologyServiceStore from 'msp/stores/topology-service-analyze';
import mspStore from 'msp/stores/micro-service';

import './index.scss';

interface GlobalVariable {
  terminusKey: string;
  startTime: number;
  endTime: number;
  serviceName?: string;
  serviceId?: string;
  host?: string;
}

const childrenKeyMap = {
  apigateway: ['Endpoints', 'APIs'],
  registercenter: ['Services'],
  configcenter: ['Configs'],
};

const TopologyDashboard = () => {
  const params = routeInfoStore.useStore((s) => s.params);
  const timeSpan = monitorCommonStore.useStore((s) => s.timeSpan);
  const activedNode = topologyServiceStore.useStore((s) => s.activedNode);
  const mspMenu = mspStore.useStore((s) => s.mspMenu);
  const { serviceName, name, type: sourceType, serviceId, applicationId } = activedNode || {};
  const type = sourceType?.toLowerCase();
  const { getCustomDashboard } = dashboardStore;
  const [overviewBoard, setOverviewBoard] = useState<DC.Layout>([]);
  const [nodeDashboard, setNodeDashboard] = useState<DC.Layout>([]);
  const nodeGlobalVariable = useRef({});
  // 缓存同类型节点加载的大盘模板
  const loadedDashBoardMap = useRef<Map<string, DC.Layout>>(new Map());

  const globalVariable: Partial<GlobalVariable> = useMemo(
    () =>
      params.terminusKey
        ? {
            terminusKey: params.terminusKey,
            startTime: timeSpan.startTimeMs,
            endTime: timeSpan.endTimeMs,
          }
        : {},
    [params.terminusKey, timeSpan.endTimeMs, timeSpan.startTimeMs],
  );

  const goToParams = {
    query: {
      start: timeSpan.startTimeMs,
      end: timeSpan.endTimeMs,
    },
    jumpOut: true,
  };

  useEffect(() => {
    if (params.terminusKey) {
      getCustomDashboard({ id: 'global_overview', isSystem: true }).then((res) => {
        setOverviewBoard(res);
      });
    }
  }, [getCustomDashboard, params.terminusKey]);

  nodeGlobalVariable.current = useMemo(
    () =>
      produce(globalVariable, (draft) => {
        draft.serviceName = serviceName;
        draft.serviceId = serviceId || ' '; // 后端数据升级可能没有
        draft.host = name;
      }),
    [serviceId, globalVariable, name, serviceName],
  );

  const nodeDashboardProps = useMemo(
    () => ({
      layout: nodeDashboard,
      globalVariable: {
        ...nodeGlobalVariable.current,
        startTime: timeSpan.startTimeMs,
        endTime: timeSpan.endTimeMs,
      },
    }),
    [nodeDashboard, timeSpan.endTimeMs, timeSpan.startTimeMs],
  );

  useEffect(() => {
    const dashboardId = activedNode?.dashboardId || 'global_request';
    const loadedDashBoard = loadedDashBoardMap.current.get(dashboardId);
    if (loadedDashBoard) {
      setNodeDashboard([...loadedDashBoard]);
    } else {
      getCustomDashboard({
        id: dashboardId,
        isSystem: true,
      }).then((res) => {
        setNodeDashboard(res);
        loadedDashBoardMap.current.set(dashboardId, res);
      });
    }
  }, [activedNode, getCustomDashboard, params.terminusKey]);

  const handleGotoServiceAnalyze = useCallback(() => {
    goTo(goTo.pages.mspServiceAnalyze, {
      ...params,
      serviceName,
      serviceId: window.encodeURIComponent(serviceId || ''),
      applicationId,
      query: {
        start: timeSpan.startTimeMs,
        end: timeSpan.endTimeMs,
      },
      jumpOut: true,
    });
  }, [params, serviceName, serviceId, applicationId, timeSpan.startTimeMs, timeSpan.endTimeMs]);

  return (
    <div className="topology-dashboard">
      {/* 全局概览 */}
      <div className="topology-global-dashboard">
        {!isEmpty(globalVariable) && <PureBoardGrid layout={overviewBoard} globalVariable={globalVariable} />}
      </div>
      {/*
        可跳转 node type case:
        [service] to 服务分析
        [getaway] to 网关页面
        [registerCenter] to 注册中心
        [configCenter] to 配置中心
     */}
      <If condition={activedNode}>
        <div className="topology-node-dashboard-header flex justify-between items-center mb-2">
          <div className="node-name font-bold text-sub">
            {type === 'service' ? `${i18n.t('common:service')}：${serviceName}` : name}
          </div>
          <If condition={type && name}>
            <Choose>
              <When condition={type === 'service'}>
                <Button type="link" onClick={handleGotoServiceAnalyze}>
                  {i18n.t('msp:service analysis')}
                </Button>
              </When>
              <When condition={type === 'apigateway'}>
                <Button type="link" onClick={() => goTo('./gateway-ingress', goToParams)}>
                  {i18n.t('detail')}
                </Button>
              </When>
              <When condition={type === 'http'}>
                <Button
                  type="link"
                  onClick={() => goTo(`./ei/${encodeURIComponent(name as string)}/affairs`, goToParams)}
                >
                  {i18n.t('detail')}
                </Button>
              </When>
              <When condition={childrenKeyMap[type as string]}>
                <Button
                  type="link"
                  onClick={() => {
                    const curChildrenKey = childrenKeyMap[type as string];
                    const subMenuList = get(
                      find(mspMenu, ({ key }) => key.toLowerCase() === type),
                      'subMenu',
                      [],
                    );
                    let targetPath = '';
                    map(curChildrenKey, (item) => {
                      if (!targetPath) {
                        targetPath = get(find(subMenuList, { key: item }), 'href', '');
                      }
                    });
                    targetPath && goTo(targetPath, goToParams);
                  }}
                >
                  {i18n.t('detail')}
                </Button>
              </When>
            </Choose>
          </If>
        </div>
      </If>
      {/* 节点情况 */}
      <div className="topology-node-dashboard">
        <PureBoardGrid {...nodeDashboardProps} />
      </div>
    </div>
  );
};

export default React.memo(TopologyDashboard);
