export function normalizeVietnamPhone(value: string) {
  const compact = value.trim().replace(/[\s.\-()]/g, "");
  if (!compact) {
    return "";
  }

  if (/^\+84\d{9,10}$/.test(compact)) {
    return `0${compact.slice(3)}`;
  }

  if (/^84\d{9,10}$/.test(compact)) {
    return `0${compact.slice(2)}`;
  }

  if (/^0\d{9,10}$/.test(compact)) {
    return compact;
  }

  return "";
}

export function isLikelyPhoneLogin(value: string) {
  return normalizeVietnamPhone(value).length > 0;
}

export function normalizeAdminLoginIdentifier(value: string) {
  const trimmed = value.trim();
  const phone = normalizeVietnamPhone(trimmed);
  if (phone) {
    return { type: "phone" as const, value: phone };
  }

  return { type: "username" as const, value: trimmed };
}
