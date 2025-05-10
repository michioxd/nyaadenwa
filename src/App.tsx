import {
  GearIcon,
  InfoCircledIcon,
  MixIcon,
  MobileIcon,
  PlusIcon,
} from "@radix-ui/react-icons";
import { DropdownMenu, IconButton, Text } from "@radix-ui/themes";
import { Tabs } from "@sinm/react-chrome-tabs";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { v4 as uuidv4 } from "uuid";
import Locales from "./locales/list";

function createNewTab() {
  const id = uuidv4();
  return {
    id: `tab-id-${id}`,
    title: `New Tabs ${id}`,
    active: true,
  };
}

function App() {
  const { t, i18n } = useTranslation();
  const [tabs, setTabs] = useState([
    { id: "abc", title: "Google Pixel 9", active: true },
  ]);

  const addTab = () => {
    setTabs([...tabs, createNewTab()]);
  };

  const active = (id: string) => {
    setTabs(tabs.map((tab) => ({ ...tab, active: id === tab.id })));
  };

  const close = (id: string) => {
    setTabs(tabs.filter((tab) => tab.id !== id));
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
              <DropdownMenu.Item shortcut="Ctrl+Alt+N">
                <PlusIcon />
                {t("add_device")}
              </DropdownMenu.Item>
              <DropdownMenu.Item>
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
              <DropdownMenu.Item>
                <InfoCircledIcon />
                {t("about_nyaadenwa")}
              </DropdownMenu.Item>
              <DropdownMenu.Separator />
              <DropdownMenu.Item>
                <MobileIcon />
                Google Pixel 9{" "}
                <Text size="1" color="gray" style={{ fontSize: "10px" }}>
                  abcdef123456
                </Text>
              </DropdownMenu.Item>
              <DropdownMenu.Item>
                <MobileIcon />
                Xiaomi Mi 11 Ultra
                <Text size="1" color="gray" style={{ fontSize: "10px" }}>
                  abcdef123456
                </Text>
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Root>
        }
      />
    </>
  );
}

export default App;
