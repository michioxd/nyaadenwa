/*
 * Copyright (c) 2025 michioxd
 * Released under MIT license. See LICENSE for more details.
 * Repository: https://github.com/michioxd/nyaadenwa
 */

import { ExternalLinkIcon, GitHubLogoIcon } from "@radix-ui/react-icons";
import { Flex, Link, Text } from "@radix-ui/themes";
import { useTranslation } from "react-i18next";

export default function About() {
    const { t } = useTranslation();
    return (
        <Flex direction="column">
            <Text>
                <b>nyaadenwa</b> - {t("welcome_description")}
            </Text>
            <Link href="https://github.com/michioxd/nyaadenwa" my="1" target="_blank">
                <Flex align="center" gap="1">
                    <GitHubLogoIcon />
                    {t("github_repo")}
                </Flex>
            </Link>
            <Text color="gray" mt="2" size="1">
                &copy; 2025 michioxd powered. {t("released_under_mit_license")}.{" "}
                <Link color="gray" href="https://github.com/michioxd/nyaadenwa/graphs/contributors" target="_blank">
                    {t("all_contributors")} <ExternalLinkIcon />
                </Link>
            </Text>
        </Flex>
    );
}
