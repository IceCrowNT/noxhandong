"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Filter } from "lucide-react";
import { OPERATION_TASK_DEPARTMENTS } from "@/src/modules/operation-tasks/operation-tasks";
import { Button } from "@/components/ui/button";

export function DepartmentFilterSelect({ defaultValue }: { defaultValue: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("department", e.target.value);
    // Soft navigation without scrolling to top
    router.push(`/admin/operation-tasks?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        className="h-9 rounded-md border border-[var(--line)] bg-white px-3 py-1 text-sm text-[var(--text)] shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent)]"
        value={defaultValue}
        onChange={handleChange}
        name="department"
      >
        <option value="all">Tất cả bộ phận</option>
        {OPERATION_TASK_DEPARTMENTS.map((item) => (
          <option key={item.value} value={item.value}>
            {item.label}
          </option>
        ))}
      </select>
      <noscript>
        <Button type="submit" variant="outline">
          <Filter size={16} aria-hidden="true" />
          Lọc
        </Button>
      </noscript>
    </div>
  );
}
