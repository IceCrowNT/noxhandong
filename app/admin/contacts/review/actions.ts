"use server";

import { redirect } from "next/navigation";

import { requirePermission } from "@/src/modules/auth/current-user";
import {
  createDirectoryContact,
  deleteDirectoryContact,
  isContactDirectoryStatus,
  isContactRole,
  updateDirectoryContact,
} from "@/src/modules/contacts/directory";

function getString(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function getBoolean(formData: FormData, name: string) {
  return formData.get(name) === "on";
}

function getNumber(formData: FormData, name: string) {
  const raw = Number(getString(formData, name));
  return Number.isInteger(raw) && raw > 0 ? raw : 0;
}

function buildReturnHref(formData: FormData, status: string, selectedId?: number) {
  const params = new URLSearchParams();
  const query = getString(formData, "returnQuery");
  const filterStatus = getString(formData, "returnStatus");
  const page = getString(formData, "returnPage");

  if (query) params.set("q", query);
  if (filterStatus) params.set("status", filterStatus);
  if (page) params.set("page", page);
  if (selectedId) params.set("contactId", String(selectedId));
  params.set(status, "1");

  return `/admin/contacts/review?${params.toString()}`;
}

function parseStatus(value: string) {
  return isContactDirectoryStatus(value) ? value : "DANG_DUNG";
}

function parseRole(value: string) {
  return isContactRole(value) ? value : null;
}

export async function createContactAction(formData: FormData) {
  await requirePermission("REVIEW_CONTACTS");

  let createdId: number;
  try {
    const created = await createDirectoryContact({
      maCan: getString(formData, "maCan"),
      displayName: getString(formData, "displayName"),
      phoneNumber: getString(formData, "phoneNumber"),
      isPrimary: getBoolean(formData, "isPrimary"),
      receivesNotification: getBoolean(formData, "receivesNotification"),
      zaloLink: getString(formData, "zaloLink"),
      role: parseRole(getString(formData, "role")),
      status: parseStatus(getString(formData, "contactStatus")),
      note: getString(formData, "note"),
    });
    createdId = created.id;
  } catch {
    return redirect(buildReturnHref(formData, "error_create"));
  }

  redirect(buildReturnHref(formData, "created", createdId));
}

export async function updateContactAction(formData: FormData) {
  await requirePermission("REVIEW_CONTACTS");

  const contactId = getNumber(formData, "contactId");
  if (!contactId) {
    redirect(buildReturnHref(formData, "error_update"));
  }

  try {
    await updateDirectoryContact({
      contactId,
      displayName: getString(formData, "displayName"),
      phoneNumber: getString(formData, "phoneNumber"),
      isPrimary: getBoolean(formData, "isPrimary"),
      receivesNotification: getBoolean(formData, "receivesNotification"),
      zaloLink: getString(formData, "zaloLink"),
      role: parseRole(getString(formData, "role")),
      status: parseStatus(getString(formData, "contactStatus")),
      note: getString(formData, "note"),
    });
  } catch {
    return redirect(buildReturnHref(formData, "error_update", contactId));
  }

  redirect(buildReturnHref(formData, "updated", contactId));
}

export async function deleteContactAction(formData: FormData) {
  await requirePermission("REVIEW_CONTACTS");

  const contactId = getNumber(formData, "contactId");
  if (!contactId) {
    redirect(buildReturnHref(formData, "error_delete"));
  }

  try {
    await deleteDirectoryContact(contactId);
  } catch {
    return redirect(buildReturnHref(formData, "error_delete", contactId));
  }

  redirect(buildReturnHref(formData, "deleted"));
}
