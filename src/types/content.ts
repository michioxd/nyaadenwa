export enum ContentTypeProperties {
  Device = "device",
  Settings = "settings",
  About = "about",
}

export interface ContentType {
  uuid?: string;
  id: string;
  title: string;
  type: ContentTypeProperties;
  stackNo: number;
  content: () => React.ReactNode;
}
