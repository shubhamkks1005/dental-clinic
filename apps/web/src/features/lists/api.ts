import type { ListItem, ListItemInput, ListKey } from "@clinic/shared";
import { api } from "../../api/client";

// Every call replies with the fresh items; changes send the version the doctor saw.
type Reply = { items: ListItem[] };
const items = (reply: Reply) => reply.items;
const base = (key: ListKey) => `/api/staff/lists/${key}`;

export const getList = (key: ListKey) => api<Reply>(base(key)).then(items);

export const addItem = (key: ListKey, input: ListItemInput) =>
  api<Reply>(base(key), { method: "POST", body: input }).then(items);

export const updateItem = (key: ListKey, item: ListItem, input: ListItemInput) =>
  api<Reply>(`${base(key)}/${item.id}`, {
    method: "PUT",
    body: { ...input, version: item.version },
  }).then(items);

export const setItemActive = (key: ListKey, item: ListItem, active: boolean) =>
  api<Reply>(`${base(key)}/${item.id}/active`, {
    method: "POST",
    body: { active, version: item.version },
  }).then(items);

export const moveItem = (key: ListKey, item: ListItem, direction: "up" | "down") =>
  api<Reply>(`${base(key)}/${item.id}/move`, {
    method: "POST",
    body: { direction, version: item.version },
  }).then(items);
