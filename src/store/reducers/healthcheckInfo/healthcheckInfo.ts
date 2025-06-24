import {createSelector} from '@reduxjs/toolkit';

import type {IssueLog} from '../../../types/api/healthcheck';
import {StatusFlag} from '../../../types/api/healthcheck';
import type {RootState} from '../../defaultStore';
import {api} from '../api';

import {getLeavesFromTree} from './utils';

export const healthcheckApi = api.injectEndpoints({
    endpoints: (builder) => ({
        getHealthcheckInfo: builder.query({
            queryFn: async (
                {database, maxLevel}: {database: string; maxLevel?: number},
                {signal},
            ) => {
                try {
                    const data = await window.api.viewer.getHealthcheckInfo(
                        {database, maxLevel},
                        {signal},
                    );
                    return {
                        data,
                    };
                } catch (error) {
                    return {error};
                }
            },
            providesTags: ['All'],
        }),
    }),
    overrideExisting: 'throw',
});

const mapStatusToPriority: Record<StatusFlag, number> = {
    [StatusFlag.RED]: 0,
    [StatusFlag.ORANGE]: 1,
    [StatusFlag.YELLOW]: 2,
    [StatusFlag.BLUE]: 3,
    [StatusFlag.GREEN]: 4,
    [StatusFlag.GREY]: 5,
    [StatusFlag.UNSPECIFIED]: 6,
};

const sortIssues = (data: IssueLog[]): IssueLog[] => {
    return data.slice().sort((a, b) => {
        const aPriority = mapStatusToPriority[a.status ?? StatusFlag.UNSPECIFIED];
        const bPriority = mapStatusToPriority[b.status ?? StatusFlag.UNSPECIFIED];

        return aPriority - bPriority;
    });
};

const getRoots = (data: IssueLog[]): IssueLog[] => {
    return sortIssues(
        data.filter((item) => {
            return !data.find((issue) => issue.reason && issue.reason.indexOf(item.id) !== -1);
        }),
    );
};

const createGetHealthcheckInfoSelector = createSelector(
    (database: string) => database,
    (database) => healthcheckApi.endpoints.getHealthcheckInfo.select({database}),
);

export const selectCheckStatus = createSelector(
    (state: RootState) => state,
    (_state: RootState, database: string) => createGetHealthcheckInfoSelector(database),
    (state: RootState, selectGetPost) => selectGetPost(state).data?.self_check_result,
);

const getIssuesLog = createSelector(
    (state: RootState) => state,
    (_state: RootState, database: string) => createGetHealthcheckInfoSelector(database),
    (state: RootState, selectGetPost) => selectGetPost(state).data?.issue_log || [],
);

const selectIssuesTreesRoots = createSelector(getIssuesLog, (issues = []) => getRoots(issues));

export const selectLeavesIssues = createSelector(
    [getIssuesLog, selectIssuesTreesRoots],
    (data = [], roots = []) => {
        const leaves = roots.map((root) => getLeavesFromTree(data, root)).flat();
        return sortIssues(leaves);
    },
);

export const selectAllHealthcheckInfo = createSelector(
    (state: RootState) => state,
    (_state: RootState, database: string) => createGetHealthcheckInfoSelector(database),
    (state: RootState, selectGetPost) => selectGetPost(state).data,
);
