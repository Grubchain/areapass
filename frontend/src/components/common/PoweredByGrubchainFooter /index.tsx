import classes from "./FloatingPoweredBy.module.scss";
import classNames from "classnames";
import React from "react";

/**
 * Grubchain footer
 *
 */
export const PoweredByGrubchainFooter = (props: React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>) => {
    return (
        <div {...props} className={classNames(classes.poweredBy, props.className)}>
            <div className={classes.poweredByText}>
                <a href="https://www.grubchain.xyz/"
                    target="_blank"
                    title={'Grubchain'}>
                    <img src="/images/poweredByGrubchain.png" />
                </a>
            </div>
        </div>
    );
}
