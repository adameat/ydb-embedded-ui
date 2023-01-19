import React from 'react';
import {useSelector} from 'react-redux';
import cn from 'bem-cn-lite';

import {INVERTED_DISKS_KEY} from '../../../utils/constants';
import {getSettingValue} from '../../../store/reducers/settings';

import './DiskStateProgressBar.scss';

const b = cn('storage-disk-progress-bar');

// numeric enum to allow ordinal comparison
export enum EDiskStateSeverity {
    Grey = 0,
    Green = 1,
    Blue = 2,
    Yellow = 3,
    Orange = 4,
    Red = 5,
}

const severityToColor = Object.entries(EDiskStateSeverity).reduce(
    (acc, [color, severity]) => ({...acc, [severity]: color}),
    {} as Record<EDiskStateSeverity, keyof typeof EDiskStateSeverity>,
);

interface DiskStateProgressBarProps {
    diskAllocatedPercent?: number;
    severity?: EDiskStateSeverity;
}

export function DiskStateProgressBar({
    diskAllocatedPercent = -1,
    severity,
}: DiskStateProgressBarProps) {
    const inverted = useSelector((state) => JSON.parse(getSettingValue(state, INVERTED_DISKS_KEY)));

    const renderAllocatedPercent = () => {
        return (
            diskAllocatedPercent >= 0 && (
                <React.Fragment>
                    <div
                        className={b('filled')}
                        style={{width: `${inverted ? 100 - diskAllocatedPercent : diskAllocatedPercent}%`}}
                    />
                    <div className={b('filled-title')}>
                        {`${Math.round(diskAllocatedPercent)}%`}
                    </div>
                </React.Fragment>
            )
        );
    };

    const mods: Record<string, boolean | undefined> = {inverted};

    const color = severity && severityToColor[severity];
    if (color) {
        mods[color.toLocaleLowerCase()] = true;
    }

    return (
        <div
            className={b(mods)}
            role="meter"
            aria-label="Disk allocated space"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={diskAllocatedPercent}
        >
            {renderAllocatedPercent()}
        </div>
    );
}
