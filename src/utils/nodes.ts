import type {TSystemStateInfo} from '../types/api/nodes';
import type {TNodeInfo} from '../types/api/nodesList';
import type {NodesPreparedEntity} from '../store/reducers/nodes/types';
import type {NodesMap} from '../types/store/nodesList';
import type {ValueOf} from '../types/common';
import type {ProblemFilterValue} from '../store/reducers/settings/types';
import {ProblemFilterValues} from '../store/reducers/settings/settings';
import {EFlag} from '../types/api/enums';

import {calcUptime} from './dataFormatters/dataFormatters';
import {HOUR_IN_SECONDS} from './constants';

export enum NodesUptimeFilterValues {
    'All' = 'All',
    'SmallUptime' = 'SmallUptime',
}

export const NodesUptimeFilterTitles = {
    [NodesUptimeFilterValues.All]: 'All',
    [NodesUptimeFilterValues.SmallUptime]: 'Uptime < 1h',
};

export const isUnavailableNode = (node: NodesPreparedEntity | TSystemStateInfo) =>
    !node.SystemState || node.SystemState === EFlag.Grey;

export const prepareNodesMap = (nodesList?: TNodeInfo[]) => {
    return nodesList?.reduce<NodesMap>((nodesMap, node) => {
        if (node.Id && node.Host) {
            nodesMap.set(Number(node.Id), node.Host);
        }
        return nodesMap;
    }, new Map());
};

export interface PreparedNodeSystemState extends TSystemStateInfo {
    Rack?: string;
    DC?: string;
    Uptime: string;
}

export const prepareNodeSystemState = (
    systemState: TSystemStateInfo = {},
): PreparedNodeSystemState => {
    // There is no Rack in Location field for din nodes
    const Rack = systemState.Location?.Rack || systemState.Rack;
    const DC = systemState.Location?.DataCenter || systemState.DataCenter;

    const Uptime = calcUptime(systemState.StartTime);

    return {
        ...systemState,
        Rack,
        DC,
        Uptime,
    };
};

export const getProblemParamValue = (problemFilter: ProblemFilterValue | undefined) => {
    return problemFilter === ProblemFilterValues.PROBLEMS;
};

export const getUptimeParamValue = (nodesUptimeFilter: NodesUptimeFilterValues | undefined) => {
    return nodesUptimeFilter === NodesUptimeFilterValues.SmallUptime ? HOUR_IN_SECONDS : undefined;
};

/**
 * Values to sort /compute v2 and /nodes responses
 *
 * For actual values go to:\
 * /nodes: https://github.com/ydb-platform/ydb/blob/main/ydb/core/viewer/json_nodes.h\
 * /compute: https://github.com/ydb-platform/ydb/blob/main/ydb/core/viewer/json_compute.h
 */
export const NODES_SORT_VALUES = {
    NodeId: 'NodeId',
    Host: 'Host',
    DC: 'DC',
    Rack: 'Rack',
    Version: 'Version',
    Uptime: 'Uptime',
    Memory: 'Memory',
    CPU: 'CPU',
    LoadAverage: 'LoadAverage',
} as const;

export type NodesSortValue = ValueOf<typeof NODES_SORT_VALUES>;

export const isSortableNodesProperty = (value: string): value is NodesSortValue =>
    Object.values(NODES_SORT_VALUES).includes(value as NodesSortValue);
