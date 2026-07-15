import type {Node} from "prosemirror-model"
import type {EditorState, Selection} from "prosemirror-state"
import type {EditorView} from "prosemirror-view"

export interface Email {
    address: string
    primary?: boolean
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

export interface Settings {
    APPS: string[]
    [key: string]: unknown
}

export interface SiteMenuLike {
    app: App
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

export interface App {
    routes: RouteMap
    goTo: (url: string) => void
    settings: Settings
    menuPlugins?: MenuPlugins
    name?: string
}

export interface BaseBodyTemplateOptions {
    user: User
    contents: string
    hasOverview?: boolean
    app: App
}

export interface PartNodeAttrs {
    id: string
    item_title: string
    hidden?: boolean
    locking?: string
    deleted?: boolean
    [key: string]: unknown
}

export interface AddButtonOptions {
    idTypes?: string[]
    onAdd?: (node: Node, view: EditorView, idTypes: string[]) => void
}

export interface AddButtonLike {
    init(): void
    hasFocus(): boolean
    focus(): void
}

export interface AddButtonConstructor {
    new (
        dom: HTMLElement,
        getNode: () => Node,
        getPos: () => number | undefined,
        view: EditorView,
        options?: AddButtonOptions
    ): AddButtonLike
}

export interface ContributorsPartOptions {
    AddButton?: AddButtonConstructor
    onAddContributor?: (node: Node, view: EditorView, idTypes: string[]) => void
    addDeletedPartWidget?: (
        dom: HTMLElement,
        view: EditorView,
        getPos: () => number | undefined
    ) => void
}

export interface TagInputRefs {
    tagInputView: EditorView
    mainView: EditorView
    getPos: () => number | undefined
}

export type CreateTagEditor = (
    view: EditorView,
    getPos: () => number | undefined,
    getNode: () => Node
) => [HTMLElement, EditorView]

export interface TagsPartOptions {
    createTagEditor?: CreateTagEditor
    addDeletedPartWidget?: (
        dom: HTMLElement,
        view: EditorView,
        getPos: () => number | undefined
    ) => void
    shouldPreventTagInputFocus?: () => boolean
}

export type NextSelection = (
    state: EditorState,
    pos: number,
    dir: number
) => Selection | undefined

export type GetNode = () => Node

export type GetPos = () => number | undefined
