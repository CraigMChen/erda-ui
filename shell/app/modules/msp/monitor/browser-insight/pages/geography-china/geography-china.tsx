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

import React from 'react';
import { Row, Col } from 'core/nusi';
import { TimeSelector } from 'common';
import monitorCommonStore from 'common/stores/monitorCommon';
import GeographyMap from './config/chartMap';

const GeographyChina = () => {
  const chosenSortItem = monitorCommonStore.useStore((s) => s.chosenSortItem);
  const getAllChart = () => {
    return (
      <React.Fragment>
        <GeographyMap.regionalLoadingTime />
        <GeographyMap.performanceInterval />
      </React.Fragment>
    );
  };
  const getDetailChart = () => {
    const query = chosenSortItem ? { filter_province: chosenSortItem } : {};
    return (
      <React.Fragment>
        <GeographyMap.performanceInterval query={query} />
        <GeographyMap.pagePerformanceTrends query={query} />
        <GeographyMap.slowTrack query={query} />
      </React.Fragment>
    );
  };
  return (
    <div>
      <TimeSelector />
      <Row gutter={20}>
        <Col span={8}>
          <div className="monitor-sort-panel">
            <GeographyMap.sortTab />
            <GeographyMap.sortList />
          </div>
        </Col>
        <Col span={16}>{chosenSortItem ? getDetailChart() : getAllChart()}</Col>
      </Row>
    </div>
  );
};

export default GeographyChina;
