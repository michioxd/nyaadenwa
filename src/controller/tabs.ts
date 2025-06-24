/*
 * Copyright (c) 2025 michioxd
 * Released under GNU General Public License 3.0. See LICENSE for more details.
 * Repository: https://github.com/michioxd/nyaadenwa
 */

import connectedDevices from "@/controller/devices";
import type { ContentType } from "@/types/content";
import type { TabProperties } from "@sinm/react-chrome-tabs/dist/chrome-tabs";
import { makeAutoObservable, observable } from "mobx";
import { v4 as uuidv4 } from "uuid";

class Tabs {
    public tabs: TabProperties[] = [];
    public readonly contents = observable.map<string, ContentType>();

    constructor() {
        makeAutoObservable(this);
    }

    public openTab(content: ContentType, stackNo: number) {
        const existing = this.tabs.find((tab) => tab.id === content.id);

        if (existing) {
            this.tabs = this.tabs.map((tab) =>
                tab.stackNo === existing.stackNo
                    ? {
                          ...tab,
                          active: tab.id === existing.id,
                      }
                    : tab,
            );
            return;
        }

        const uuid = uuidv4();

        this.contents.set(content.id, {
            ...content,
            uuid: uuid,
        });

        this.tabs = [
            ...this.tabs.map((tab) =>
                tab.stackNo === stackNo
                    ? {
                          ...tab,
                          active: false,
                      }
                    : tab,
            ),
            {
                id: content.id,
                title: content.title,
                active: true,
                stackNo: stackNo,
            },
        ];
    }

    public makeTabActive(id: string, stackNo: number) {
        this.tabs = this.tabs.map((tab) =>
            stackNo === tab.stackNo
                ? {
                      ...tab,
                      active: id === tab.id,
                  }
                : tab,
        );
    }

    public closeTab(id: string) {
        const filteredTabs = this.tabs.filter((tab) => tab.id !== id);
        const newIndex = Math.min(
            this.tabs.findIndex((tab) => tab.id === id),
            filteredTabs.length - 1,
        );

        this.contents.delete(id);
        this.tabs = filteredTabs.map((tab, i) => ({ ...tab, active: i === newIndex }));
        if (id.length === 40) connectedDevices.removeDevice(id);
    }

    public tabReorder(tabId: string, _: number, toIndex: number, stackNo: number) {
        const beforeTab = this.tabs.find((tab) => tab.id === tabId && tab.stackNo === stackNo);
        if (!beforeTab) {
            return;
        }
        const newTabs = this.tabs.filter((tab) => tab.id !== tabId && tab.stackNo === stackNo);
        newTabs.splice(toIndex, 0, beforeTab);
        this.tabs = newTabs;
    }

    public moveTabAndContent(id: string, toIndex: number, stackNo: number) {
        const activeTab = this.tabs.find((tab) => tab.active && tab.stackNo === toIndex);
        this.tabs = this.tabs.map((tab) =>
            tab.stackNo === stackNo ? { ...tab, stackNo: toIndex, active: !activeTab } : tab,
        );

        const newContents = this.contents.get(id);
        if (!newContents) {
            return;
        }
        if (id.length === 40) {
            connectedDevices.removeDevice(id);
        }
        setTimeout(
            () => {
                this.contents.set(id, {
                    ...newContents,
                    stackNo: toIndex,
                });
            },
            id.length === 40 ? 100 : 0,
        );
    }
}

const tabsController = new Tabs();

export default tabsController;
