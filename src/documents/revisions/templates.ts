import {escapeText, localizeDate} from "fwtoolkit"

export const documentrevisionsTemplate = ({doc}: {doc: Record<string, unknown>}): string =>
    `<table class="fw-data-table" style="width:342px;">
        <thead class="fw-data-table-header">
            <th width="80">${gettext("Time")}</th>
            <th width="300">${gettext("Description")}</th>
            <th width="50">${gettext("Recreate")}</th>
            <th width="50">${gettext("Download")}</th>
            ${doc.is_owner ? `<th width="50">${gettext("Delete")}</th>` : ""}
        </thead>
        <tbody class="fw-data-table-body fw-middle">
            ${((doc.revisions as Array<Record<string, unknown>>) || [])
                .slice()
                .sort((a, b) => (a.date as number) > (b.date as number) ? 1 : -1)
                .map(
                    (rev: Record<string, unknown>) =>
                        `<tr class="revision-${rev.pk}" data-document="${doc.id}">
                        <td width="80"><span class="fw-inline">
                            ${localizeDate((rev.date as number) * 1000)}
                        </span></td>
                        <td width="300"><span class="fw-inline">${escapeText((rev.note as string) || "")}</span></td>
                        <td width="50"><span class="fw-inline recreate-revision" data-id="
                                ${rev.pk}"><i class="fa-solid fa-download"></i></span></td>
                        <td width="50"><span class="fw-inline download-revision" data-id="
                                ${rev.pk}" data-filename="${escapeText((rev.file_name as string) || "")}">
                            <i class="fa-solid fa-download"></i>
                        </span></td>
                        ${
                            doc.is_owner
                                ? `<td width="50">
                                <span class="fw-inline delete-revision" data-id="${rev.pk}">
                                    <i class="fa-solid fa-trash"></i>
                                </span>
                            </td>`
                                : ""
                        }
                    </tr>`
                )
                .join("")}
        </tbody>
    </table>`
