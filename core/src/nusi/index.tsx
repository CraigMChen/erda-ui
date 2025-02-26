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

import {
  Affix,
  Alert,
  Anchor,
  Avatar,
  Button,
  BackTop,
  Badge,
  Breadcrumb,
  Card,
  Carousel,
  Cascader,
  Checkbox,
  Col,
  Collapse,
  ConfigProvider as AntdConfigProvider,
  Comment,
  Divider,
  DatePicker,
  Drawer,
  Dropdown,
  Empty,
  Form,
  Input,
  InputNumber,
  message,
  Menu,
  Modal,
  notification,
  Pagination,
  Popconfirm,
  Popover,
  Progress,
  Radio,
  Rate,
  Row,
  Skeleton,
  Slider,
  Spin,
  Steps,
  Switch,
  Tabs,
  Tooltip,
  Transfer,
  Tree,
  TreeSelect,
  Timeline,
  TimePicker,
  Upload,
  version,
} from 'antd';
import { FixedSelect } from './fixed-select';
import FixRangePicker from './range-picker';
import Table from './wrapped-table';
import Tag from './wrapped-tag';
import '@terminus/nusi/dist/nusi.scss';
import 'antd/dist/antd.less';
import {
  // Input,
  Container,
  Filter,
  FormBuilder,
  Shell,
  Search,
  SideNavigation,
  PageHeader,
  GlobalNavigation,
  Title,
  Panel,
  List,
  Ellipsis,
  SelectCategory,
  SelectCombo,
  ConfigProvider as NusiConfigProvider,
  Tree as NusiTree,
  Popover as NusiPopover,
} from '@terminus/nusi';

const locale = window.localStorage.getItem('locale');
const isZh = locale === 'zh';

// 直接修改使用时会有ts警告
let temp = Tooltip;
temp.defaultProps.type = 'shallow';

temp = Pagination;
temp.defaultProps = {
  showSizeChanger: false,
  ...Pagination.defaultProps,
  pageSize: 15,
  pageSizeOptions: ['15', '30', '45', '60'],
  showTotal: (total) => (isZh ? `共计 ${total} 条` : `total ${total} items`),
};

export {
  Affix,
  Anchor,
  // AutoComplete,
  Alert,
  Avatar,
  BackTop,
  Badge,
  Breadcrumb,
  Button,
  // Calendar,
  Card,
  Container,
  Collapse,
  Carousel,
  Cascader,
  Checkbox,
  Col,
  Comment,
  DatePicker,
  Divider,
  Dropdown,
  Drawer,
  Ellipsis,
  Empty,
  Filter,
  Form,
  FormBuilder,
  Input,
  InputNumber,
  List,
  message,
  Menu,
  Modal,
  notification,
  Pagination,
  Popconfirm,
  Popover,
  Progress,
  Panel,
  FixRangePicker as RangePicker,
  Radio,
  Rate,
  Row,
  FixedSelect as Select,
  Skeleton,
  Slider,
  Spin,
  Steps,
  Switch,
  Search,
  Table,
  Transfer,
  Tree,
  TreeSelect,
  Tabs,
  Tag,
  TimePicker,
  Timeline,
  Tooltip,
  Title,
  // Mention,
  Upload,
  version,
  Shell,
  SideNavigation,
  PageHeader,
  GlobalNavigation,
  SelectCategory,
  SelectCombo,
  AntdConfigProvider,
  NusiConfigProvider,
  NusiTree,
  NusiPopover,
};
