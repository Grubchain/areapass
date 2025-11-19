import classes from "./FloatingPoweredByGrubchain.module.scss";
import classNames from "classnames";
import React from "react";
import { useEffect, useState } from "react";
import { getConfig } from "../../../utilites/config.ts";

/**
 * Grubchain footer
 *
 */
export const PoweredByGrubchainFooter = (props: React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>) => {
    const [tosLink, setTosLink] = useState("");
    const [privacyLink, setPrivacyLink] = useState("");

    useEffect(() => {
        setTosLink(getConfig('VITE_GRUBCHAIN_TOS'));
        setPrivacyLink(getConfig('VITE_GRUBCHAIN_PRIVACY'));
    }, []);
    return (
        <div {...props} className={classNames(classes.poweredBy, props.className)}>
            <div className={classes.poweredByText}>
                <a href="https://www.grubchain.xyz/"
                    target="_blank"
                    title={'Grubchain'}>
                    <img src="/images/poweredByGrubchain.png" />
                </a>
                <div className={classes.poweredByLegal}>
                    <a href={tosLink}
                        target="_blank"
                        title={'Grubchain Terms Of Service'}>
                        Terms Of Service
                    </a>
                    <a href={privacyLink}
                        target="_blank"
                        title={'Grubchain Privacy Policy'}>
                        Privacy Policy
                    </a>
                </div>
            </div>
        </div>
    );
}
