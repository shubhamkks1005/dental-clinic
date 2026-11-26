import {
  parseMedicineSetItems,
  setsUsingMedicine,
  withoutMedicine,
  type ListItem,
} from "@clinic/shared";
import { and, eq, sql } from "drizzle-orm";
import type { Db } from "../client";
import type { Ctx } from "../context";
import { ConflictError } from "../errors";
import { assertAllowed } from "../permissions";
import { listItems } from "../schema";
import { toItem, type listsCore } from "./lists-core";

type Core = ReturnType<typeof listsCore>;

export type HideMedicineResult = { items: ListItem[]; sets: ListItem[]; emptySets: string[] };

// Library Q12 (2026-11-26): hiding a medicine that is in sets asks the doctor to take it out of
// those sets. A set that would be left with no medicine is not changed; its name is returned so
// the screen can say "Edit or hide that set yourself". One batch: the set changes and the hide.
export function listsHide(db: Db, ctx: Ctx, core: Core) {
  return {
    async hideMedicine(
      id: string,
      version: number,
      removeFromSets: boolean,
    ): Promise<HideMedicineResult> {
      assertAllowed(ctx, "settings.write");
      const row = await core.find("medicines", id, version);
      const emptySets: string[] = [];
      if (!removeFromSets) {
        if (row.active)
          await core.change(row, { active: false }, { active: true }, { active: false });
      } else {
        const setRows = await db
          .select()
          .from(listItems)
          .where(and(core.inList("medicine_sets"), eq(listItems.active, true)));
        const using = setsUsingMedicine(
          { id: row.id, label: row.label },
          setRows.map((r) => ({ row: r, ...toItem(r) })),
        );
        const kept = using
          .map((s) => ({ s, data: withoutMedicine(s.data, { id: row.id, label: row.label }) }))
          .filter(({ s, data }) => {
            const left = parseMedicineSetItems(String(data.items ?? "")).length;
            if (left === 0) emptySets.push(s.label);
            return left > 0;
          });
        const changes = kept.map(({ s, data }) =>
          core.changeStatements(
            s.row,
            { dataJson: JSON.stringify(data) },
            { data: s.data },
            { data },
          ),
        );
        // The hide runs only when every set change above happened (each bumps its version by 1).
        const setsChanged = kept.length
          ? sql`(SELECT count(*) FROM list_items WHERE ${sql.join(
              kept.map(({ s }) => sql`(id = ${s.id} AND version = ${s.version + 1})`),
              sql` OR `,
            )}) = ${kept.length}`
          : undefined;
        const hide = core.changeStatements(
          row,
          { active: false },
          { active: row.active },
          { active: false },
          setsChanged,
        );
        const results = await db.batch([...changes.flat(), ...hide] as unknown as Parameters<
          typeof db.batch
        >[0]);
        const hidden = results[results.length - 2] as unknown[];
        if (hidden.length === 0) throw new ConflictError();
      }
      const [items, sets] = await Promise.all([
        core.itemsOf("medicines"),
        core.itemsOf("medicine_sets"),
      ]);
      return { items, sets, emptySets };
    },
  };
}
