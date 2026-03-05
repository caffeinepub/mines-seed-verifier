import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface AppInfo {
    name: string;
    description: string;
    version: string;
}
export interface backendInterface {
    getAppInfo(): Promise<AppInfo>;
    ping(): Promise<string>;
}
