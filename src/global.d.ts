/**
 * Global functions and values provided by Fidus Writer's runtime environment.
 * These are injected by the Django JavaScript catalog and other runtime scripts.
 */
declare function gettext(msgid: string): string

declare function interpolate(
    fmt: string,
    args: Array<string | number>,
    named?: boolean
): string
declare function interpolate(
    fmt: string,
    args: Record<string, string | number | undefined>,
    named: true
): string

declare function staticUrl(path: string): string

declare const settings: Record<string, unknown>

declare const csrfToken: string
