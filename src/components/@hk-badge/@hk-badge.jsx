import classNames from 'classnames'
import { Badge } from 'react-bootstrap'

const HkBadge = ({ children, as, bg, pill, outline, indicator, text, bsPrefix, className, size, soft, ...rest }) => {
    // When outline is true, don't pass bg to Bootstrap (bg-* sets opaque background
    // which overrides badge-outline's transparent bg). Use badge-{bg} class instead.
    const bootstrapBg = outline ? null : (!soft ? bg : `bg-${bg}-light-5`);

    return (
        <Badge
            as={as}
            bg={bootstrapBg}
            pill={pill}
            text={text}
            bsPrefix={bsPrefix}
            {...rest}
            className={classNames(className, { "badge-sm": size === "sm" }, { "badge-outline": outline }, (outline ? `badge-${bg}` : ""), (soft ? `badge-soft-${bg}` : ""), { "badge-indicator": indicator })}
        >
            {children}
        </Badge>
    )
}

export default HkBadge
