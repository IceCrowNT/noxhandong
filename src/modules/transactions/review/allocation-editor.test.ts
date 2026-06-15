import { describe, expect, it } from "vitest";

import {
  allocationTotal,
  parseAllocationCodeList,
  splitAllocationAmount,
} from "@/src/modules/transactions/review/allocation-editor";

describe("allocation editor", () => {
  it("đọc danh sách mã căn dán từ Excel hoặc văn bản", () => {
    expect(parseAllocationCodeList("L4A.132\nL4A 202; l4a211a, L4C.130")).toEqual([
      "L4A.132",
      "L4A.202",
      "L4A.211A",
      "L4C.130",
    ]);
  });

  it("loại mã trùng và bỏ nội dung không phải mã căn", () => {
    expect(parseAllocationCodeList("L1.217\nL1.217\nkhông rõ\nL4B.408")).toEqual(["L1.217", "L4B.408"]);
  });

  it("chia đủ tổng tiền cho số căn bất kỳ", () => {
    expect(splitAllocationAmount(3_000_000, 8)).toEqual(Array(8).fill(375_000));
    expect(splitAllocationAmount(10, 3)).toEqual([4, 3, 3]);
  });

  it("tính tổng từ dữ liệu người dùng nhập", () => {
    expect(
      allocationTotal([
        { code: "L1.101", amount: "750.000" },
        { code: "L1.102", amount: "750000" },
      ]),
    ).toBe(1_500_000);
  });
});
