import {postJson} from "fwtoolkit"

export class ContactInvite {
    app: any
    key: string

    constructor({app}: {app: any}, key: string) {
        this.app = app
        this.key = key
    }

    init(): Promise<any> {
        if (!this.app.config.user.is_authenticated) {
            this.app.inviteKey = this.key
            this.app.page = this.app.openLoginPage()
            return this.app.page.init()
        }

        return postJson("/api/user/invite/", {key: this.key}).then(({json}: any) => {
            window.history.replaceState({}, "", json.redirect)
            return this.app.selectPage()
        })
    }
}
