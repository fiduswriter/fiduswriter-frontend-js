export interface Email {
    address: string
    primary?: boolean
    verified?: boolean
}

export interface User {
    username: string
    emails: Email[]
    name?: string
    avatar?: string
}

export interface Route {
    app: string
    [key: string]: unknown
}

export type RouteMap = Record<string, Route>

export interface SiteMenuLike {
    app: FrontendApp
    navItems: NavItem[]
}

export interface NavItem {
    text: string
    url: string
    title: string
    id: string
    order: number
    keys?: string
    active?: boolean
}

export interface MenuPluginExport {
    new (siteMenu: SiteMenuLike): {init(): void}
}

export type MenuPlugin = Record<string, MenuPluginExport>

export type MenuPlugins = Array<[string, MenuPlugin]>

import type {Settings as FwSettings} from "fwtoolkit/settings"
import type {ApiConnectors} from "./api/index.js"

export interface App {
    routes: RouteMap
    goTo: (url: string) => void
    settings: Settings
    menuPlugins?: MenuPlugins
    apiConnectors: ApiConnectors
    name: string
}

export interface Settings extends FwSettings {
    APPS: string[]
}

export interface FrontendApp extends App {
    app: FrontendApp
    user: User & {
        is_authenticated?: boolean
        id?: number
        waiting_invites?: boolean
        [key: string]: unknown
    }
    isOffline: () => boolean
    bibDB?: unknown
    csl?: {getStyles(): Promise<unknown>}
    imageDB?: unknown
    indexedDB?: {
        readAllData(store: string): Promise<unknown[]>
        clearData(store: string): Promise<void>
        insertData(store: string, data: Record<string, unknown>[] | undefined): void
    }
    page?: unknown
    plugins?: Record<string, unknown>
    ws?: {
        connectionCount?: number
        connected?: boolean
        init(): void
        close(): void
    }
    ws_url_base?: string
    socialaccount_providers?: Array<Record<string, unknown>>
    inviteKey?: string
    getConfiguration(): Promise<void>
    selectPage(): Promise<void>
    goTo(url: string): Promise<void>
    init(): Promise<any>
    openLoginPage(): {init(): Promise<any>; [key: string]: unknown}
    openOfflinePage(): {init(): Promise<any>; [key: string]: unknown}
    openSetupPage(): {init(): Promise<any>; [key: string]: unknown}
    open404Page(): {init(): Promise<any>; [key: string]: unknown}
    handleSWUpdate(): void
    [key: string]: unknown
}

export interface BaseBodyTemplateOptions {
    user: User
    contents: string
    hasOverview?: boolean
    app: FrontendApp
}



