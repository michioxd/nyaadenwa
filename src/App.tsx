import {
  GearIcon,
  InfoCircledIcon,
  MixIcon,
  MobileIcon,
  PlusIcon,
} from "@radix-ui/react-icons";
import { DropdownMenu, IconButton, Text } from "@radix-ui/themes";
import { Tabs } from "@sinm/react-chrome-tabs";
import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { v4 as uuidv4 } from "uuid";
import Locales from "./locales/list";
import DeviceManager, { DeviceManagerTrackDevices } from "./controller/manager";
import type { AdbDaemonWebUsbDevice } from "@yume-chan/adb-daemon-webusb";
import type { TabProperties } from "@sinm/react-chrome-tabs/dist/chrome-tabs";
import cls from "@/scss/Main.module.scss";
import clsx from "clsx";
import ScreenWelcome from "@/screen/Welcome";

enum ContentTypeProperties {
  Device = "device",
  Settings = "settings",
  About = "about",
}

interface ContentType {
  uuid?: string;
  id: string;
  title: string;
  type: ContentTypeProperties;
  content: () => React.ReactNode;
}

function App() {
  const { t, i18n } = useTranslation();
  const [listDevices, setListDevices] = useState<AdbDaemonWebUsbDevice[]>([]);
  const [content, setContent] = useState<ContentType[]>([]);
  const [tabs, setTabs] = useState<TabProperties[]>([]);

  const handleOpenNewTab = useCallback(
    (content: ContentType) => {
      const findOpenedTab = tabs.find((tab) => tab.id === content.id);

      if (findOpenedTab) {
        setTabs(tabs.map((tab) => ({ ...tab, active: tab.id === content.id })));
        return;
      }

      const uuid = uuidv4();

      setContent((p) => [
        ...p,
        {
          uuid: uuid,
          ...content,
        },
      ]);
      setTabs((p) => [
        ...p.map((tab) => ({ ...tab, active: false })),
        {
          id: content.id,
          title: content.title,
          active: true,
        },
      ]);
    },
    [tabs]
  );

  const active = (id: string) => {
    setTabs(tabs.map((tab) => ({ ...tab, active: id === tab.id })));
  };

  const close = (id: string) => {
    const filteredTabs = tabs.filter((tab) => tab.id !== id);
    const newIndex = Math.min(
      tabs.findIndex((tab) => tab.id === id),
      filteredTabs.length - 1
    );

    setContent(content.filter((c) => c.id !== id));
    setTabs(filteredTabs.map((tab, i) => ({ ...tab, active: i === newIndex })));
  };

  const reorder = (tabId: string, _: number, toIndex: number) => {
    const beforeTab = tabs.find((tab) => tab.id === tabId);
    if (!beforeTab) {
      return;
    }
    const newTabs = tabs.filter((tab) => tab.id !== tabId);
    newTabs.splice(toIndex, 0, beforeTab);
    setTabs(newTabs);
  };

  const handleGetDevice = useCallback(async () => {
    try {
      const dv = await DeviceManager?.getDevices();
      setListDevices(dv ?? []);
    } catch (error) {
      console.error(error);
    }
  }, []);

  const handleAddDevice = useCallback(async () => {
    try {
      await DeviceManager?.requestDevice();
      handleGetDevice();
    } catch (error) {
      console.error(error);
    }
  }, [handleGetDevice]);

  useEffect(() => {
    DeviceManagerTrackDevices.onDeviceAdd(() => {
      handleAddDevice();
    });

    DeviceManagerTrackDevices.onDeviceRemove(() => {
      handleAddDevice();
    });

    handleAddDevice();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <Tabs
        draggable
        onTabClose={close}
        onTabReorder={reorder}
        onTabActive={active}
        tabs={tabs}
        i18nIsDynamicList
        pinnedRight={
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
                  handleOpenNewTab({
                    id: "settings",
                    title: t("settings"),
                    type: ContentTypeProperties.Settings,
                    content: () => <div>Settings</div>,
                  })
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
                      {lc.flag} {lc.name}
                    </DropdownMenu.Item>
                  ))}
                </DropdownMenu.SubContent>
              </DropdownMenu.Sub>
              <DropdownMenu.Item
                onClick={() =>
                  handleOpenNewTab({
                    id: "about",
                    title: t("about_nyaadenwa"),
                    type: ContentTypeProperties.About,
                    content: () => <div>About</div>,
                  })
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
                      <Text size="1" color="gray" style={{ fontSize: "10px" }}>
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
        }
      />
      <div className={cls.Main}>
        {content.length > 0 ? (
          content.map((c) => (
            <div
              key={c.uuid}
              className={clsx(
                cls.content,
                tabs.find((tab) => tab.id === c.id)?.active && cls.active
              )}
            >
              <c.content />
            </div>
          ))
        ) : (
          <div className={clsx(cls.content, cls.active)}>
            <ScreenWelcome />
          </div>
        )}
      </div>
    </>
  );
}

export default App;
