/*
 * Copyright (c) 2025 michioxd
 * Released under MIT license. See LICENSE for more details.
 * Repository: https://github.com/michioxd/nyaadenwa
 */

import { Badge, Button, IconButton, Link, Text, Tooltip } from "@radix-ui/themes";
import cls from "./Welcome.module.scss";
import Img from "@/assets/nyaadenwa.png";
import Nacho from "@/assets/nacho.png";
import { Trans, useTranslation } from "react-i18next";
import { GitHubLogoIcon, HamburgerMenuIcon } from "@radix-ui/react-icons";

const ManualIcon = () => {
    const { t } = useTranslation();
    return (
        <Tooltip content={t("welcome_manual_tooltip")}>
            <IconButton size="1" variant="soft" color="cyan">
                <HamburgerMenuIcon />
            </IconButton>
        </Tooltip>
    );
};

export default function ScreenWelcome({ shouldShowWelcome }: { shouldShowWelcome: boolean }) {
    const { t } = useTranslation();
    return (
        <div className={cls.Welcome}>
            {shouldShowWelcome ? (
                <>
                    <img src={Img} alt="nyaadenwa" />
                    <Text align="center" size="7">
                        {t("welcome_title")}
                    </Text>
                    <Text align="center" size="1">
                        {t("welcome_description")}
                    </Text>
                    <Badge mt="2" color="red" size="1">
                        {t("working_in_progress")}
                    </Badge>

                    <Text align="center" size="2" className={cls.Manual}>
                        <Trans i18nKey="welcome_manual">
                            <ManualIcon />
                        </Trans>
                    </Text>

                    <Button variant="soft" size="1" asChild className={cls.Link}>
                        <Link href="https://github.com/michioxd/nyaadenwa" color="gray" target="_blank">
                            <GitHubLogoIcon />
                            {t("fork_github")}
                        </Link>
                    </Button>
                </>
            ) : (
                <>
                    <img src={Nacho} className={cls.Nacho} alt="nacho" />
                </>
            )}
        </div>
    );
}
