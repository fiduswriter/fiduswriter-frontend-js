// Changing this number will make clients flush their database.
const DB_VERSION = 4

interface DbTableProperties {
    keyPath?: string
    autoIncrement?: boolean
}

interface RouteEntry {
    app: string
    dbTables?: Record<string, DbTableProperties>
    [key: string]: unknown
}

export type RouteMap = Record<string, RouteEntry>

export class IndexedDB {
    private dbName: string
    private routes?: RouteMap

    constructor(dbName: string, routes?: RouteMap) {
        this.dbName = dbName
        this.routes = routes
    }

    init(): Promise<void> {
        const request = window.indexedDB.open(this.dbName, DB_VERSION)

        request.onerror = (event: Event) => {
            this.reset(event)
        }
        return new Promise<void>(resolve => {
            request.onsuccess = (event: Event) => {
                const database = (event.target as IDBOpenDBRequest).result
                database.close()
                resolve()
            }

            request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
                this.onUpgradeNeeded(event)
            }
        })
    }

    onUpgradeNeeded(event: IDBVersionChangeEvent): void {
        const db = (event.target as IDBOpenDBRequest).result
        Array.from(db.objectStoreNames).forEach(name =>
            db.deleteObjectStore(name)
        )
        if (this.routes) {
            Object.entries(this.routes).forEach(([route, props]) => {
                if (props.dbTables) {
                    Object.entries(props.dbTables).forEach(
                        ([tableName, tableProperties]) =>
                            db.createObjectStore(
                                `${route}_${tableName}`,
                                tableProperties
                            )
                    )
                }
            })
        }
    }

    updateData(objectStoreName: string, data: Record<string, unknown>): void {
        const request = window.indexedDB.open(this.dbName, DB_VERSION)
        request.onerror = (event: Event) => {
            this.reset(event).then(() => this.updateData(objectStoreName, data))
        }

        request.onsuccess = (event: Event) => {
            const db = (event.target as IDBOpenDBRequest).result
            const objectStore = db
                .transaction(objectStoreName, "readwrite")
                .objectStore(objectStoreName)
            for (const d in data) {
                objectStore.put(d)
            }
        }

        request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
            this.onUpgradeNeeded(event)
        }
    }

    insertData(
        objectStoreName: string,
        data: Record<string, unknown>[] | undefined,
        retry: boolean = true
    ): void {
        const request = window.indexedDB.open(this.dbName, DB_VERSION)
        request.onerror = (event: Event) => {
            return this.reset(event).then(() =>
                this.insertData(objectStoreName, data, false)
            )
        }
        request.onsuccess = (event: Event) => {
            const db = (event.target as IDBOpenDBRequest).result
            try {
                const transaction = db.transaction(objectStoreName, "readwrite")
                const objectStore = transaction.objectStore(objectStoreName)
                if (data !== undefined) {
                    data.forEach(document => {
                        objectStore.put(document)
                    })
                }
            } catch (error) {
                if (retry) {
                    // Before resetting IndexedDB make sure to close connections to avoid blocking the
                    // delete IndexedDB process
                    db.close()
                    this.reset().then(() =>
                        this.insertData(objectStoreName, data, false)
                    )
                    return
                } else {
                    throw error
                }
            }
        }

        request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
            this.onUpgradeNeeded(event)
        }
    }

    reset(event: Event | false = false): Promise<void> {
        if (event) {
            const database = (event.target as IDBOpenDBRequest | null)?.result
            if (database) {
                database.close()
            }
        }
        return new Promise<void>(resolve => {
            const delRequest = window.indexedDB.deleteDatabase(this.dbName)
            delRequest.onerror = () => {
                this.init().then(() => resolve())
            }
            delRequest.onsuccess = () => {
                // Resolve the promise after the indexedDB is set up.
                this.init().then(() => resolve())
            }
        })
    }

    clearData(objectStoreName: string): Promise<void> {
        return new Promise<void>(resolve => {
            const request = window.indexedDB.open(this.dbName, DB_VERSION)
            request.onerror = () => {}
            request.onsuccess = (event: Event) => {
                const db = (event.target as IDBOpenDBRequest).result
                try {
                    const objectStore = db
                        .transaction(objectStoreName, "readwrite")
                        .objectStore(objectStoreName)
                    const objectStoreReq = objectStore.clear()
                    objectStoreReq.onsuccess = () => {
                        db.close()
                        // Resolve the promise after the ObjectStore has been cleared.
                        resolve()
                    }
                } catch (error) {
                    // Before resetting IndexedDB make sure to close connections to avoid blocking the
                    // delete IndexedDB process
                    db.close()
                    if (
                        error instanceof DOMException &&
                        error.name === "NotFoundError"
                    ) {
                        // Resolve the promise after indexed DB is set up.
                        this.reset().then(() => resolve())
                    } else {
                        throw error
                    }
                }
            }
            request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
                this.onUpgradeNeeded(event)
            }
        })
    }

    readAllData(objectStoreName: string): Promise<unknown[]> {
        return new Promise<unknown[]>((resolve, reject) => {
            const request = window.indexedDB.open(this.dbName, DB_VERSION)
            request.onerror = (event: Event) => {
                reject(event)
            }
            request.onsuccess = (event: Event) => {
                const db = (event.target as IDBOpenDBRequest).result
                if (
                    !Array.from(db.objectStoreNames).includes(objectStoreName)
                ) {
                    db.close()
                    this.reset()
                        .then(() => this.readAllData(objectStoreName))
                        .then(readPromise => resolve(readPromise))
                    return
                }
                const objectStore = db
                    .transaction(objectStoreName, "readwrite")
                    .objectStore(objectStoreName)
                const readAllRequest = objectStore.getAll()
                readAllRequest.onerror = (event: Event) => {
                    reject(event)
                }
                readAllRequest.onsuccess = () => {
                    // Do something with the request.result!
                    resolve(readAllRequest.result as unknown[])
                }
            }
            request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
                this.onUpgradeNeeded(event)
            }
        })
    }
}
