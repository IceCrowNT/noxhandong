"use client";

import { Trash2 } from "lucide-react";
import { deleteHistoricalSupplementAction } from "./actions";

export function DeleteSupplementButton({ supplementId }: { supplementId: number }) {
  return (
    <form 
      action={deleteHistoricalSupplementAction} 
      onSubmit={(e) => {
        if (!confirm("Bạn có chắc chắn muốn xóa bản nháp bù trừ này không?")) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="supplementId" value={supplementId} />
      <button 
        type="submit" 
        className="rounded-md p-1.5 text-red-500 hover:bg-red-50 hover:text-red-700 transition-colors" 
        title="Xóa bản nháp"
      >
        <Trash2 size={16} />
      </button>
    </form>
  );
}
