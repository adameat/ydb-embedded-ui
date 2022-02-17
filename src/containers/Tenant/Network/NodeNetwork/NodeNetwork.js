import React from 'react';
import cn from 'bem-cn-lite';
import PropTypes from 'prop-types';
import './NodeNetwork.scss';
const b = cn('node-network');

const getNodeModifier = (connected, capacity) => {
    const percents = Math.floor((connected / capacity) * 100);
    if (percents === 100) {
        return 'green';
    } else if (percents >= 70) {
        return 'yellow';
    } else if (percents >= 1) {
        return 'red';
    } else {
        return 'gray';
    }
};

export class NodeNetwork extends React.Component {
    static propTypes = {
        onMouseEnter: PropTypes.func,
        onMouseLeave: PropTypes.func,
        nodeId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
        connected: PropTypes.number,
        capacity: PropTypes.number,
        rack: PropTypes.string,
        status: PropTypes.string,
        onClick: PropTypes.func,
        showID: PropTypes.bool,
        isBlurred: PropTypes.bool,
    };

    static defaultProps = {
        onMouseEnter: () => {},
        onMouseLeave: () => {},
        onClick: () => {},
    };

    node = React.createRef();

    _onNodeHover = () => {
        const {onMouseEnter, nodeId, connected, capacity, rack} = this.props;
        const popupData = {nodeId, connected, capacity, rack};
        onMouseEnter(this.node.current, popupData, 'node');
    };
    _onNodeLeave = () => {
        this.props.onMouseLeave();
    };

    render() {
        const {nodeId, connected, capacity, status, onClick, showID, isBlurred} = this.props;
        return (
            <div
                ref={this.node}
                className={b({
                    [status?.toLowerCase() || getNodeModifier(connected, capacity)]: true,
                    id: showID,
                    blur: isBlurred,
                })}
                onMouseEnter={this._onNodeHover}
                onMouseLeave={this._onNodeLeave}
                onClick={() => onClick(nodeId)}
            >
                {showID && nodeId}
            </div>
        );
    }
}

export default NodeNetwork;
