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
import { Popconfirm, Tooltip, Dropdown, Menu, Progress, Ellipsis, Badge } from 'core/nusi';
import { map, isEmpty, get, isArray, sortBy, filter } from 'lodash';
import { Icon as CustomIcon, MemberSelector, ImgHolder, TagsRow, Copy } from 'common';
import i18n from 'i18n';
import moment from 'moment';
import { Download as IconDownLoad } from '@icon-park/react';
import { WithAuth } from 'user/common';
import Text from '../text/text';

export const getTitleRender = (cItem: CP_TABLE.Column) => {
  const { title, titleTip } = cItem;
  const res = { title } as any;
  if (titleTip) {
    res.title = (
      <div>
        {title}
        <Tooltip title={getTitleTip(titleTip)}>
          <CustomIcon type="info" className="text-sm text-sub ml-2" />
        </Tooltip>
      </div>
    );
  }
  switch (cItem.titleRenderType) {
    case 'gantt':
      {
        let totalDay = 0;
        map(cItem.data, ({ date }) => {
          totalDay += date.length;
        });
        res.title = <GantteTitle dateRange={cItem.data} />;
        res.width = cItem?.width || totalDay * 50 || 400;
      }
      break;
    default:
      break;
  }
  return res;
};

const DAY_WIDTH = 32;
export const getRender = (val: any, record: CP_TABLE.RowData, extra: any) => {
  let Comp = val;
  switch (get(val, 'renderType')) {
    case 'linkText':
      {
        const { operations } = val;
        const _p = {} as any;
        if (operations?.click || extra.customProps?.clickTableItem) {
          _p.onClick = (e: any) => {
            e.stopPropagation();
            operations?.click && extra.execOperation(operations.click);
            extra.customProps?.clickTableItem && extra.customProps.clickTableItem(record);
          };
        }
        Comp = (
          <Tooltip title={val.value}>
            <span className="fake-link nowrap" {..._p}>
              {val.value}
            </span>
          </Tooltip>
        );
      }
      break;
    case 'downloadUrl':
      {
        const { url, value } = val || {};
        Comp = (
          <a className="fake-link nowrap flex flex-wrap justify-start items-center w-full" download={value} href={url}>
            <IconDownLoad /> {value}
          </a>
        );
      }
      break;
    case 'textWithTags': // 文本后带tag的样式渲染
      {
        const { value, prefixIcon, tags, operations = {} } = val;
        const hasPointer = operations?.click || extra.customProps?.clickTableItem;
        const onClick = () => {
          operations?.click && extra.execOperation(operations.click);
          extra.customProps?.clickTableItem && extra.customProps.clickTableItem(record);
        };
        Comp = (
          <div
            className={`table-render-twt w-full pl-2 flex items-center ${hasPointer ? 'cursor-pointer' : ''}`}
            onClick={onClick}
          >
            {prefixIcon ? <CustomIcon type={prefixIcon} /> : null}
            <div className="twt-text">
              <div className="nowrap">{value}</div>
              <TagsRow
                labels={tags.map((l) => ({ label: l.tag, color: l.color }))}
                showCount={2}
                containerClassName="ml-2"
              />
            </div>
          </div>
        );
      }
      break;
    case 'textWithIcon':
      {
        const { value, prefixIcon, colorClassName, hoverActive = '' } = val;
        Comp = (
          <div className={`${hoverActive} flex items-center`}>
            {prefixIcon ? <CustomIcon type={prefixIcon} className={`mr-1 ${colorClassName}`} /> : null}
            <Ellipsis title={value}>{value}</Ellipsis>
          </div>
        );
      }
      break;
    case 'operationsDropdownMenu': // 下拉菜单的操作：可编辑列
      Comp = <DropdownSelector {...val} {...extra} />;
      break;
    case 'progress': // 进度条
      Comp = val?.value ? <Progress percent={+val.value || 0} /> : val.value;
      break;
    case 'tableOperation': // 渲染table后的操作
      Comp = getTableOperation(val, record, extra);
      break;
    case 'string-list': // 文本列
      Comp = (
        <>
          {map(val.value, (item, idx) => {
            return (
              <Tooltip title={item.text} placement="leftTop" key={idx}>
                <div
                  className={`nowrap ${item?.linkStyle ? 'string-list-link' : ''}`}
                  onClick={() => {
                    if (extra.customProps?.clickTableItem) {
                      extra.customProps.clickTableItem(item);
                    }
                  }}
                >
                  {item.text}
                </div>
              </Tooltip>
            );
          })}
        </>
      );
      break;
    case 'userAvatar':
      {
        const curUsers = [];
        if (isArray(val.value)) {
          val.value.forEach((vItem: any) => {
            curUsers.push(get(extra, `userMap.${vItem}`) || {});
          });
        } else {
          curUsers.push(get(extra, `userMap.${val.value}`) || {});
        }
        if (val.showIcon === false) {
          Comp = map(curUsers, (item) => item.nick || item.name || item.id || i18n.t('common:none')).join(', ');
        } else {
          Comp = (
            <div>
              {map(curUsers, (cU, idx) => {
                return (
                  <span key={idx}>
                    {val.showIcon === false ? null : (
                      <ImgHolder
                        src={cU.avatar}
                        text={cU.nick ? cU.nick.substring(0, 1) : i18n.t('none')}
                        rect="20x20"
                        type="avatar"
                      />
                    )}
                    <span className="ml-0.5 mr-1" title={cU.name}>
                      {cU.nick || cU.name || val.value || i18n.t('common:none')}
                    </span>
                  </span>
                );
              })}
            </div>
          );
        }
      }
      break;
    case 'memberSelector':
      Comp = (
        <WithAuth pass={!val?.disabled} noAuthTip={val?.disabledTip}>
          <MemberSelector
            scopeType={val?.scope}
            dropdownMatchSelectWidth={false}
            allowClear={false}
            valueItemRender={memberSelectorValueItem}
            className="dice-config-table-member-selector"
            disabled={val?.disabled}
            value={val?.value}
            onChange={(v) => {
              extra.execOperation(val?.operations?.onChange, v);
            }}
          />
        </WithAuth>
      );
      // Comp = val.value;
      break;
    case 'gantt':
      Comp = (
        <div className="dice-config-table-slide-wrap">
          {map(val.value, ({ restTime, offset, tooltip, delay, actualTime, tooltipPosition = 'leftTop' }, idx) => (
            <Tooltip title={tooltip} placement={tooltipPosition} key={idx}>
              <div
                className="dice-config-table-slide-wrap-item"
                style={{
                  transform: `translate(${offset * DAY_WIDTH}px, 0)`,
                }}
              >
                <div className="slide-actual-time" style={{ width: `${actualTime * DAY_WIDTH}px` }} />
                <div className="slide-rest-time" style={{ width: `${restTime * DAY_WIDTH}px` }} />
                <div className="slide-delay-time" style={{ width: `${delay * DAY_WIDTH}px` }} />
              </div>
            </Tooltip>
          ))}
        </div>
      );
      break;
    case 'datePicker':
      {
        const { displayTip } = val; // 带展示tip的
        const DisplayTipComp = displayTip ? (
          <span className={`date-picker-display-tip text-${displayTip.color} `}>{displayTip.text}</span>
        ) : null;
        // const DateUpdateComp = (
        //   <DatePicker
        //     className={'w-full date-picker '}
        //     allowClear={false}
        //     dropdownClassName={`dc-table-date-picker result-${val.textAlign || 'left'}`}
        //     value={val.value ? moment(val.value) : undefined}
        //     placeholder={i18n.t('unspecified')}
        //     onChange={(v) => extra.execOperation(val?.operations?.onChange, v)}
        //     format="YYYY-MM-DD"
        //     disabledDate={getDisabledDate(val)}
        //     showTime={false}
        //     disabled={val?.disabled}
        //   />
        // );
        // Comp = (
        //   <div className={`dice-config-table-date-picker ${DisplayTipComp ? 'with-display-tip' : ''} `}>
        //     {/* {DateUpdateComp} */}
        //     {/* {DisplayTipComp} */}
        //   </div>
        // );
        Comp = val.value ? moment(val.value).format('YYYY-MM-DD') : '';
      }
      break;
    case 'textWithExtraTag':
      {
        const { text, prefix, suffix } = val;
        Comp = (
          <div className="dice-cp-text-tag w-full pl-2 flex items-center">
            {prefix ? (
              <div className="extra-tags px-2 mr-1" style={{ backgroundColor: prefix.bgColor }}>
                {prefix.text}
              </div>
            ) : null}
            <div className="nowrap">{text}</div>
            {suffix ? (
              <div className="extra-tags px-2 mr-1" style={{ backgroundColor: suffix.bgColor }}>
                {suffix.text}
              </div>
            ) : null}
          </div>
        );
      }
      break;
    case 'textWithBadge':
      Comp = val.status ? <Badge status={val.status || 'default'} text={val.value} /> : val.value;
      break;
    case 'textWithLevel':
      {
        const { data = [] } = val;
        Comp = (
          <div className="dice-cp-level-content w-full pl-2 flex items-center">
            {data.map(({ level, text }: { level: number; text: string }) => {
              return <div className={`mr-1 level-${level}-content`}>{text}</div>;
            })}
          </div>
        );
      }
      break;
    case 'copyText':
      {
        const value: CP_TEXT.ICopyText = val?.value;
        const textProps = {
          renderType: 'copyText' as CP_TEXT.IRenderType,
          value,
        };
        Comp = <Text type="Text" props={textProps} />;
      }
      break;
    case 'bgProgress':
      {
        const value: CP_TEXT.IBgProgress = val?.value;
        Comp = (
          <div className="dice-cp-table-bg-progress">
            <div className="bg-progress-bar" style={{ width: `${value?.percent}%` }} />
            <span className="bg-progress-text">{value?.text || value?.percent}</span>
          </div>
        );
      }
      break;
    case 'tagsRow':
      {
        const { value, operations } = val;
        const onAdd = operations?.add && (() => extra.execOperation(operations?.add));
        const onDelete = operations?.delete && ((record) => extra.execOperation(operations?.delete, record));
        Comp = <TagsRow labels={value} onAdd={onAdd} onDelete={onDelete} />;
      }
      break;
    default:
      Comp = val || val === 0 ? <Ellipsis title={`${val}`}>{`${val}`}</Ellipsis> : null;
      break;
  }
  return Comp;
};

const memberSelectorValueItem = (user: any) => {
  const { avatar, nick, name, label, value } = user;
  const displayName = nick || label || value || i18n.t('common:none');
  return (
    <div className="flex items-center dice-config-table-member-field-selector">
      {/* <ImgHolder src={avatar} text={nick ? nick.substring(0, 1) : i18n.t('none')} rect={'20x20'} type="avatar" /> */}
      <span className={'ml-1 text-sm nowrap'} title={name}>
        {displayName}
      </span>
      <CustomIcon className="arrow-icon" type="di" />
    </div>
  );
};

interface IDropdownSelectorProps {
  disabled: boolean;
  disabledTip?: string;
  value: string;
  prefixIcon: string;
  operations: Obj;
  execOperation: any;
  onChange: () => void;
}

const DropdownSelector = (props: IDropdownSelectorProps) => {
  const { disabled, disabledTip, operations, prefixIcon, value, execOperation } = props;
  const ValueRender = (
    <div className="flex items-center hover-active dropdown-field-selector" onClick={(e: any) => e.stopPropagation()}>
      <div className="flex items-center">
        {prefixIcon ? <CustomIcon type={prefixIcon} /> : null}
        {value || <span className="text-desc">{i18n.t('unspecified')}</span>}
      </div>
      <CustomIcon type="di" className="arrow-icon" />
    </div>
  );

  if (disabled === true)
    return (
      <WithAuth pass={false} noAuthTip={disabledTip}>
        {ValueRender}
      </WithAuth>
    );

  const onClick = (e: any) => {
    e.domEvent.stopPropagation();
    execOperation(operations[e.key]);
  };
  const menu = (
    <Menu onClick={onClick}>
      {map(operations, (op) => (
        <Menu.Item disabled={op.disabled} key={op.key}>
          <Tooltip title={op.disabledTip}>
            <div className="flex items-center">
              {op.prefixIcon ? <CustomIcon type={op.prefixIcon} /> : null}
              {op.text}
            </div>
          </Tooltip>
        </Menu.Item>
      ))}
    </Menu>
  );
  return (
    <Dropdown overlay={menu} trigger={['click']}>
      {ValueRender}
    </Dropdown>
  );
};

// 渲染table操作列
const getTableOperation = (val: any, record: any, extra: any) => {
  const getTableOperationItem = (op: CP_COMMON.Operation, key: string, _record: any) => {
    const { confirm, disabled, disabledTip, text, ..._rest } = op;
    if (disabled === true) {
      // 无权限操作
      return (
        <WithAuth noAuthTip={disabledTip} key={key} pass={false}>
          <span className="table-operations-btn ">{text}</span>
        </WithAuth>
      );
    } else if (confirm) {
      // 需要确认的操作
      return (
        <Popconfirm
          title={confirm}
          onConfirm={(e) => {
            e && e.stopPropagation();
            extra.execOperation({ ...op, key });
          }}
          key={key}
          onCancel={(e: any) => e && e.stopPropagation()}
        >
          <span className="table-operations-btn" onClick={(e: any) => e.stopPropagation()}>
            {text}
          </span>
        </Popconfirm>
      );
    } else {
      // 普通的操作
      return (
        <span
          className="table-operations-btn"
          key={key}
          onClick={(e: any) => {
            e.stopPropagation();
            extra.execOperation({ ...op, key });
            const customFunc = get(extra, `customProps.operations.${key}`);
            if (customFunc) {
              customFunc(op);
            }
          }}
        >
          {text}
        </span>
      );
    }
  };

  const operationList = [] as any[];
  if (val.operations) {
    // 根据配置的operations展示
    const ops = sortBy(
      filter(map(val.operations) || [], (item: CP_COMMON.Operation) => item.show !== false),
      'showIndex',
    );

    map(ops, (item: CP_COMMON.Operation) => {
      if (item) {
        operationList.push(getTableOperationItem(item, item.key, record));
      }
    });
  }
  // else { // 若不配，则默认认为所有数据拥有所有操作
  //   map(val, (op, key) => {
  //     operationList.push(getTableOperationItem(op, key, record));
  //   });
  // }
  return <div className="table-operations">{operationList}</div>;
};

interface IGantteTitle {
  dateRange: Array<{ month: number; date: string[] }>;
}
const GantteTitle = ({ dateRange }: IGantteTitle) => {
  if (isEmpty(dateRange)) {
    return <div style={{ height: '40px', lineHeight: '40px', textAlign: 'center' }}>{i18n.t('default:date')}</div>;
  }
  return (
    <div className="gantt-date-title">
      <div className="month-list">
        {map(dateRange, ({ month, date }, idx) => {
          return (
            <div className="date-range" style={{ width: `${date.length * DAY_WIDTH}px` }} key={idx}>
              <div key={month} className="month">
                {month}
                {i18n.t('month')}
              </div>
              <div>
                {date.map((day) => {
                  return (
                    <span key={day} className={'day'}>
                      <span>{day}</span>
                    </span>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const colorKey = {
  red: ['#red#', '#>red#'],
  gray: ['#gray#', '#>gray#'],
  blue: ['#blue#', '#>blue#'],
};
const getTitleTip = (tip: string | string[]) => {
  if (!tip) return null;
  const tipArr = isArray(tip) ? [...tip] : [tip];
  const tipComp = [] as any[];
  map(tipArr, (item, idx) => {
    let _s = item;
    map(colorKey, (v, k) => {
      if (item.includes(v[0])) {
        _s = _s.replaceAll(v[0], `<span class="text-${k}">`);
        _s = _s.replaceAll(v[1], '</span>');
      }
    });
    tipComp.push(<div key={idx} dangerouslySetInnerHTML={{ __html: _s }} />);
  });
  return tipComp;
};
