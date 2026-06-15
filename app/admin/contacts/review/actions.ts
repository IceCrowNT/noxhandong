"use server";

import { redirect } from "next/navigation";

import { requirePermission } from "@/src/modules/auth/current-user";
import {
  approveContactCandidate,
  isContactRole,
  rejectContactCandidate,
} from "@/src/modules/contacts/review";

function getString(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function getBoolean(formData: FormData, name: string) {
  return formData.get(name) === "on";
}

function getCandidateId(formData: FormData) {
  const id = Number(getString(formData, "candidateId"));
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error("Candidate id không hợp lệ.");
  }
  return id;
}

function redirectWithStatus(status: string) {
  redirect(`/admin/contacts/review?${status}=1`);
}

export async function approveContactAction(formData: FormData) {
  const account = await requirePermission("REVIEW_CONTACTS");
  const roleValue = getString(formData, "role");

  try {
    await approveContactCandidate({
      candidateId: getCandidateId(formData),
      displayName: getString(formData, "displayName"),
      phoneNumber: getString(formData, "phoneNumber"),
      role: isContactRole(roleValue) ? roleValue : undefined,
      isPrimary: getBoolean(formData, "isPrimary"),
      receivesNotification: getBoolean(formData, "receivesNotification"),
      note: getString(formData, "note"),
      reviewedBy: account.ten_dang_nhap,
    });
  } catch {
    redirectWithStatus("error");
  }

  redirectWithStatus("approved");
}

export async function rejectContactAction(formData: FormData) {
  const account = await requirePermission("REVIEW_CONTACTS");

  try {
    await rejectContactCandidate({
      candidateId: getCandidateId(formData),
      note: getString(formData, "rejectNote"),
      reviewedBy: account.ten_dang_nhap,
    });
  } catch {
    redirectWithStatus("error");
  }

  redirectWithStatus("rejected");
}
