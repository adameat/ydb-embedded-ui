import {ReactNode, useCallback, useMemo} from 'react';
import {shallowEqual, useDispatch, useSelector} from 'react-redux';
import cn from 'bem-cn-lite';

import {Loader} from '@gravity-ui/uikit';

//@ts-ignore
import SchemaInfoViewer from '../../Schema/SchemaInfoViewer/SchemaInfoViewer';
import {
    CDCStreamInfo,
    TableIndexInfo,
    PersQueueGroupInfo,
} from '../../../../components/InfoViewer/schemaInfo';

import {
    EPathType,
    TEvDescribeSchemeResult,
} from '../../../../types/api/schema';
import {
    isEntityWithMergedImplementation,
    isColumnEntityType,
    isTableType,
} from '../../utils/schema';
//@ts-ignore
import {
    getSchema,
    getSchemaBatched,
    resetLoadingState,
    selectSchemaMergedChildrenPaths,
} from '../../../../store/reducers/schema';
//@ts-ignore
import {
    getOlapStats,
    resetLoadingState as resetOlapLoadingState,
} from '../../../../store/reducers/olapStats';
import {useAutofetcher, useTypedSelector} from '../../../../utils/hooks';

import './Overview.scss';

function prepareOlapTableGeneral(item?: TEvDescribeSchemeResult, olapStats?: any[]) {
    const tableData = item?.PathDescription?.ColumnTableDescription;

    const Bytes = olapStats?.reduce((acc, el) => {
        acc += parseInt(el.Bytes) || 0;
        return acc;
    }, 0);
    const Rows = olapStats?.reduce((acc, el) => {
        acc += parseInt(el.Rows) || 0;
        return acc;
    }, 0);
    const tabletIds = olapStats?.reduce((acc, el) => {
        acc.add(el.TabletId);
        return acc;
    }, new Set());

    return {
        PathDescription: {
            Self: item?.PathDescription?.Self,
            TableStats: {
                ColumnShardCount: tableData?.ColumnShardCount,
                Bytes: Bytes?.toLocaleString('ru-RU', {useGrouping: true}) ?? 0,
                Rows: Rows?.toLocaleString('ru-RU', {useGrouping: true}) ?? 0,
                Parts: tabletIds?.size ?? 0,
            },
        },
    };
}

interface OverviewProps {
    type?: EPathType;
    className?: string;
    tenantName?: string;
}

const b = cn('kv-tenant-overview');

function Overview({type, tenantName, className}: OverviewProps) {
    const dispatch = useDispatch();

    const {
        currentSchema: currentItem = {},
        loading: schemaLoading,
        wasLoaded,
        autorefresh,
        currentSchemaPath,
    } = useSelector((state: any) => state.schema);

    const {data: {result: olapStats} = {result: undefined}, loading: olapStatsLoading} =
        useSelector((state: any) => state.olapStats);

    const loading = schemaLoading || olapStatsLoading;

    const isEntityWithMergedImpl = isEntityWithMergedImplementation(type);

    // There is a circular dependency here. Fetch data depends on children paths
    // When data in store updated on fetch request,
    // new object is set there, so source children array is updated
    // This updates selector, the selector returns a new array, and data is fetched again
    // To prevent it, shallowEqual, which compares array content, was added
    const mergedChildrenPaths = useTypedSelector(
        (state) => selectSchemaMergedChildrenPaths(state, currentSchemaPath, type),
        shallowEqual,
    );

    const fetchData = useCallback(
        (isBackground: boolean) => {
            if (!isBackground) {
                dispatch(resetLoadingState());
            }

            const schemaPath = currentSchemaPath || tenantName;

            if (!isEntityWithMergedImpl) {
                dispatch(getSchema({path: schemaPath}));
            } else if (mergedChildrenPaths) {
                dispatch(getSchemaBatched([schemaPath, ...mergedChildrenPaths]));
            }

            if (isTableType(type) && isColumnEntityType(type)) {
                if (!isBackground) {
                    dispatch(resetOlapLoadingState());
                }
                dispatch(getOlapStats({path: schemaPath}));
            }
        },
        [
            tenantName,
            currentSchemaPath,
            type,
            isEntityWithMergedImpl,
            mergedChildrenPaths,
            dispatch,
        ],
    );

    useAutofetcher(fetchData, [fetchData], autorefresh);

    const schemaData = useMemo(() => {
        return isTableType(type) && isColumnEntityType(type)
            ? // process data for ColumnTable
              prepareOlapTableGeneral(currentItem, olapStats)
            : currentItem;
    }, [type, olapStats, currentItem]);

    const renderLoader = () => {
        return (
            <div className={b('loader')}>
                <Loader size="m" />
            </div>
        );
    };

    const renderContent = () => {
        // verbose mapping to guarantee a correct render for new path types
        // TS will error when a new type is added but not mapped here
        const pathTypeToComponent: Record<EPathType, (() => ReactNode) | undefined> = {
            [EPathType.EPathTypeInvalid]: undefined,
            [EPathType.EPathTypeDir]: undefined,
            [EPathType.EPathTypeTable]: undefined,
            [EPathType.EPathTypeSubDomain]: undefined,
            [EPathType.EPathTypeTableIndex]: () => <TableIndexInfo data={schemaData} />,
            [EPathType.EPathTypeExtSubDomain]: undefined,
            [EPathType.EPathTypeColumnStore]: undefined,
            [EPathType.EPathTypeColumnTable]: undefined,
            [EPathType.EPathTypeCdcStream]: () => (
                <CDCStreamInfo data={schemaData} childrenPaths={mergedChildrenPaths} />
            ),
            [EPathType.EPathTypePersQueueGroup]: () => <PersQueueGroupInfo data={schemaData} />,
        };

        return (
            (type && pathTypeToComponent[type]?.()) || (
                <SchemaInfoViewer fullPath={currentItem.Path} data={schemaData} />
            )
        );
    };

    return (loading && !wasLoaded) || (isEntityWithMergedImpl && !mergedChildrenPaths) ? (
        renderLoader()
    ) : (
        <div className={className}>{renderContent()}</div>
    );
}

export default Overview;
