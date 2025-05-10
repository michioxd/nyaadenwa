import Locales from "@/locales/list";
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
      <Text mt="1">{t("commit")}: local</Text>
      <Text>{t("commit_date")}: 00:00:00 1970-01-01</Text>

      <Text color="gray" mt="2" size="1">
        &copy; 2025 michioxd powered. {t("released_under_mit_license")}.{" "}
        <Link
          color="gray"
          href="https://github.com/michioxd/nyaadenwa/graphs/contributors"
          target="_blank"
        >
          {t("all_contributors")} <ExternalLinkIcon />
        </Link>
      </Text>

      <Text size="4" mt="2" weight="medium">
        {t("translation_authors")}:
      </Text>

      {Locales.map((lc) => (
        <Text key={lc.code}>
          {lc.flag} {lc.name}:{" "}
          {lc.author.map((a, index) => (
            <span key={index + a.github}>
              <Link href={a.github} target="_blank">
                {a.name}
              </Link>
              {index < lc.author.length - 1 && ", "}
            </span>
          ))}
        </Text>
      ))}
    </Flex>
  );
}
