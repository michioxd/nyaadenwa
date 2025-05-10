import {
  GearIcon,
  InfoCircledIcon,
  MixIcon,
  MobileIcon,
  PlusIcon,
} from "@radix-ui/react-icons";
import { Box, DropdownMenu, IconButton, Text } from "@radix-ui/themes";
import { Tabs } from "@sinm/react-chrome-tabs";
import { useTranslation } from "react-i18next";
import clsx from "clsx";
import type { AdbDaemonWebUsbDevice } from "@yume-chan/adb-daemon-webusb";
import type { TabProperties } from "@sinm/react-chrome-tabs/dist/chrome-tabs";
import ScreenWelcome from "@/screen/Welcome";
import { ContentTypeProperties, type ContentType } from "@/types/content";
import Locales from "@/locales/list";
import cls from "@/scss/Main.module.scss";

export default function Container({
  listDevices,
  stackNo,
  tabs,
  content,
  handleAddDevice,
  handleOpenNewTab,
  handleGetDevice,
  close,
  reorder,
  active,
  stackController,
  shouldShowWelcome,
}: {
  listDevices: AdbDaemonWebUsbDevice[];
  stackNo: number;
  tabs: TabProperties[];
  content: ContentType[];
  handleAddDevice: () => void;
  handleOpenNewTab: (content: ContentType, stackNo: number) => void;
  handleGetDevice: () => void;
  close: (id: string) => void;
  reorder: (id: string, _: number, toIndex: number, stackNo: number) => void;
  active: (id: string, stackNo: number) => void;
  stackController: React.ReactNode;
  shouldShowWelcome: boolean;
}) {
  const { t, i18n } = useTranslation();

  return (
    <>
      <Tabs
        draggable
        onTabClose={(id) => close(id)}
        onTabReorder={(id, from, toIndex) =>
          reorder(id, from, toIndex, stackNo)
        }
        onTabActive={(id) => active(id, stackNo)}
        tabs={tabs.filter((tab) => tab.stackNo === stackNo)}
        i18nIsDynamicList
        pinnedRight={
          <>
            <Box
              style={{ display: "flex", alignItems: "center", gap: "0.2rem" }}
            >
              <DropdownMenu.Root>
                <DropdownMenu.Trigger>
                  <IconButton
                    style={{ margin: "6px 0 0 6px" }}
                    size="1"
                    color="gray"
                    variant="soft"
                  >
                    <PlusIcon />
                  </IconButton>
                </DropdownMenu.Trigger>
                <DropdownMenu.Content size="1" variant="soft">
                  <DropdownMenu.Item
                    shortcut="Ctrl+Alt+N"
                    onClick={handleAddDevice}
                  >
                    <PlusIcon />
                    {t("add_device")}
                  </DropdownMenu.Item>
                  <DropdownMenu.Item
                    onClick={() =>
                      handleOpenNewTab(
                        {
                          id: "settings",
                          title: t("settings"),
                          type: ContentTypeProperties.Settings,
                          content: () => <div>Settings</div>,
                          stackNo: stackNo,
                        },
                        stackNo
                      )
                    }
                  >
                    <GearIcon />
                    {t("settings")}
                  </DropdownMenu.Item>
                  <DropdownMenu.Sub>
                    <DropdownMenu.SubTrigger>
                      <MixIcon />
                      {t("change_language")}
                    </DropdownMenu.SubTrigger>
                    <DropdownMenu.SubContent>
                      {Locales.map((lc) => (
                        <DropdownMenu.Item
                          key={lc.code}
                          onClick={() => {
                            i18n.changeLanguage(lc.code);
                          }}
                        >
                          <Text
                            weight={
                              i18n.language === lc.code ? "bold" : "regular"
                            }
                          >
                            {lc.flag} {lc.name}{" "}
                            {lc.english.length > 0 && `(${lc.english})`}
                          </Text>
                        </DropdownMenu.Item>
                      ))}
                    </DropdownMenu.SubContent>
                  </DropdownMenu.Sub>
                  <DropdownMenu.Item
                    onClick={() =>
                      handleOpenNewTab(
                        {
                          id: "about",
                          title: t("about_nyaadenwa"),
                          type: ContentTypeProperties.About,
                          content: () => <div>About</div>,
                          stackNo: stackNo,
                        },
                        stackNo
                      )
                    }
                  >
                    <InfoCircledIcon />
                    {t("about_nyaadenwa")}
                  </DropdownMenu.Item>
                  <DropdownMenu.Separator />
                  {listDevices.length < 1 ? (
                    <DropdownMenu.Item disabled>
                      {t("no_device_connected")}
                    </DropdownMenu.Item>
                  ) : (
                    listDevices.map((device) => (
                      <DropdownMenu.Sub>
                        <DropdownMenu.SubTrigger>
                          <MobileIcon />
                          {device.name}
                          <Text
                            size="1"
                            color="gray"
                            style={{ fontSize: "10px" }}
                          >
                            {device.serial}
                          </Text>
                        </DropdownMenu.SubTrigger>
                        <DropdownMenu.SubContent>
                          <DropdownMenu.Item>
                            {t("open_this_device")}
                          </DropdownMenu.Item>
                          <DropdownMenu.Item
                            onClick={() => {
                              device.raw.forget();
                              handleGetDevice();
                            }}
                          >
                            {t("forget_this_device")}
                          </DropdownMenu.Item>
                        </DropdownMenu.SubContent>
                      </DropdownMenu.Sub>
                    ))
                  )}
                </DropdownMenu.Content>
              </DropdownMenu.Root>
              {stackController}
            </Box>
          </>
        }
      />
      <div className={cls.Main}>
        {tabs.filter((tab) => tab.stackNo === stackNo).length > 0 ? (
          content.map((c) => (
            <div
              key={c.uuid}
              className={clsx(
                cls.content,
                tabs.find(
                  (tab) =>
                    tab.id === c.id && tab.stackNo === stackNo && tab.active
                ) && cls.active
              )}
            >
              <c.content />
            </div>
          ))
        ) : (
          <div className={clsx(cls.content, cls.active)}>
            <ScreenWelcome shouldShowWelcome={shouldShowWelcome} />
          </div>
        )}
      </div>
    </>
  );
}
