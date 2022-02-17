import cn from 'bem-cn-lite';

import {Link} from 'react-router-dom';

const bLink = cn('yc-link');

export default function InternalLink({to, children, onClick, className}) {
    return to ? (
        <Link className={bLink({view: 'normal'}, className)} to={to} onClick={onClick}>
            {children}
        </Link>
    ) : (
        children
    );
}
