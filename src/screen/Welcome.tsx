/*
 * Copyright (c) 2025 michioxd
 * Released under MIT license. See LICENSE for more details.
 * Repository: https://github.com/michioxd/nyaadenwa
 */

import { Button, IconButton, Link, Text } from "@radix-ui/themes";
import cls from "./Welcome.module.scss";
import Img from "@/assets/nyaadenwa.png";
import Nacho from "@/assets/nacho.png";
import { Trans, useTranslation } from "react-i18next";
import { GitHubLogoIcon } from "@radix-ui/react-icons";

export default function ScreenWelcome({ shouldShowWelcome }: { shouldShowWelcome: boolean }) {
    const { t } = useTranslation();
    return (
        <div className={cls.Welcome}>
            {shouldShowWelcome ? (
                <>
                    <img src={Img} alt="nyaadenwa" />
                    <Text size="7">{t("welcome_title")}</Text>
                    <Text size="1">{t("welcome_description")}</Text>
                    <Text size="1">still in development aaaaaaaaaaaaaaaaaaaa</Text>

                    <Text size="2" className={cls.Manual}>
                        <Trans i18nKey="welcome_manual">
                            <IconButton size="1" variant="soft" color="gray"></IconButton>
                        </Trans>
                    </Text>

                    <Button variant="soft" size="1" asChild className={cls.Link}>
                        <Link href="https://github.com/michioxd/nyaadenwa" target="_blank">
                            <GitHubLogoIcon />
                            {t("fork_github")}
                        </Link>
                    </Button>
                    <Text color="gray" className={cls.License} size="1">
                        &copy; 2025 michioxd powered. {t("released_under_mit_license")}
                    </Text>
                </>
            ) : (
                <>
                    <img src={Nacho} className={cls.Nacho} alt="nacho" />
                </>
            )}
        </div>
    );
}
