import type { CaseStatus } from "@/lib/status";

export type { CaseRow, HistoryEntry, ProcessStep } from "@/lib/case";
import type { CaseRow, HistoryEntry, ProcessStep } from "@/lib/case";

type Seed = [code: string, title: string, topic: string, ward: string, unit: string, handler: string,
  submitted: string, due: string, status: CaseStatus, sender: string, phone: string];

const SEEDS: Seed[] = [
  ["PA-2611-0012", "Đèn đường hẻm 12 không sáng", "Hạ tầng – Giao thông", "Khu phố 3", "Phòng KT-HT-ĐT", "Trần Minh", "2026-11-02", "2026-11-14", "dang_xu_ly", "Nguyễn Văn An", "0904123843"],
  ["PA-2611-0015", "Rác tồn đọng đầu hẻm chợ", "Môi trường", "Khu phố 1", "—", "—", "2026-11-04", "2026-11-05", "cho_dieu_phoi", "Lê Thị Hoa", "0912555210"],
  ["PA-2610-0198", "Quán karaoke gây ồn sau 22h", "An ninh – Trật tự", "Khu phố 5", "Công an phường", "Võ Hải", "2026-10-28", "2026-11-11", "cho_duyet_ket_qua", "Phạm Quốc Bảo", "0388777901"],
  ["PA-2610-0187", "Ống nước vỡ tràn mặt đường", "Hạ tầng – Giao thông", "Khu phố 3", "Phòng KT-HT-ĐT", "Trần Minh", "2026-10-20", "2026-11-03", "dang_xu_ly", "Ngô Thị Mai", "0977123456"],
  ["PA-2611-0021", "Lấn chiếm vỉa hè bán hàng", "Đô thị – Xây dựng", "Khu phố 2", "Phòng KT-HT-ĐT", "—", "2026-11-05", "2026-11-19", "da_giao", "Bùi Văn Tâm", "0903222111"],
  ["PA-2611-0008", "Cây xanh nghiêng sắp đổ", "Môi trường", "Khu phố 3", "Phòng KT-HT-ĐT", "Trần Minh", "2026-11-01", "2026-11-09", "cho_bo_sung", "Đặng Thu Trang", "0935666777"],
  ["PA-2610-0170", "Xây dựng sai phép nhà số 45", "Đô thị – Xây dựng", "Khu phố 4", "Phòng KT-HT-ĐT", "Nguyễn Hữu Phúc", "2026-10-15", "2026-10-29", "de_nghi_gia_han", "Trịnh Văn Long", "0908111222"],
  ["PA-2610-0150", "Ngập nước sau mưa đường Lê Lợi", "Hạ tầng – Giao thông", "Khu phố 1", "Phòng KT-HT-ĐT", "Trần Minh", "2026-10-10", "2026-10-24", "da_giai_quyet", "Lý Thị Hằng", "0919000111"],
  ["PA-2610-0120", "Cơ sở kinh doanh không phép", "Văn hóa – Xã hội", "Khu phố 2", "Phòng VH-XH", "Mai Anh Tuấn", "2026-10-05", "2026-10-19", "da_dong", "Phạm Văn Đức", "0987654321"],
  ["PA-2611-0030", "Mất điện kéo dài khu phố 5", "Điện, nước, viễn thông", "Khu phố 5", "—", "—", "2026-11-05", "2026-11-12", "chuyen_co_quan_khac", "Hồ Thị Thu", "0966555444"],
  ["PA-2611-0033", "Thái độ cán bộ tiếp dân", "Phản ánh về cán bộ", "Khu phố 4", "Chủ tịch phường", "Hoàng Văn Nam", "2026-11-05", "2026-11-19", "dang_xu_ly", "Châu Minh Khoa", "0911222333"],
  ["PA-2611-0002", "Tranh chấp ranh giới đất", "Đất đai", "Khu phố 1", "—", "—", "2026-11-01", "2026-11-08", "chuyen_khieu_nai", "Đinh Công Sơn", "0902333444"],
  ["PA-2611-0005", "Phản ánh trùng: rác hẻm chợ", "Môi trường", "Khu phố 1", "—", "—", "2026-11-04", "2026-11-05", "khong_xu_ly", "Tạ Văn Hùng", "0913444555"],
  ["PA-2610-0199", "Biển báo giao thông bị mất", "Hạ tầng – Giao thông", "Khu phố 2", "Phòng KT-HT-ĐT", "Nguyễn Hữu Phúc", "2026-10-29", "2026-11-12", "de_nghi_gia_han", "Lương Thị Kim", "0909777888"],
  ["PA-2611-0040", "Chó thả rông không rọ mõm", "Khác / Không rõ", "Khu phố 4", "—", "—", "2026-11-06", "2026-11-07", "cho_dieu_phoi", "Dương Văn Tú", "0938999000"],
  ["PA-2611-0041", "Trường học thu phí ngoài quy định", "Văn hóa – Xã hội", "Khu phố 5", "Phòng VH-XH", "Mai Anh Tuấn", "2026-11-03", "2026-11-17", "dang_xu_ly", "Kiều Thị Nga", "0918000999"],
  ["PA-2610-0160", "Nước thải xả ra kênh", "Môi trường", "Khu phố 4", "Phòng KT-HT-ĐT", "Trần Minh", "2026-10-12", "2026-10-26", "cho_duyet_ket_qua", "Vương Đình Lộc", "0905444333"],
  ["PA-2611-0044", "Tụ tập đua xe ban đêm", "An ninh – Trật tự", "Khu phố 2", "Công an phường", "—", "2026-11-06", "2026-11-06", "da_giao", "Quách Thị Yến", "0976111000"],
];

function stepsFor(status: CaseStatus, reopened: boolean): ProcessStep[] {
  const advanced = ["cho_duyet_ket_qua", "da_giai_quyet", "da_dong"].includes(status);
  const started = advanced || ["dang_xu_ly", "cho_bo_sung", "de_nghi_gia_han"].includes(status);
  const steps: ProcessStep[] = [
    { name: "Kiểm tra hiện trường", required: true, done: started },
    { name: "Liên hệ người dân", required: false, done: advanced },
    { name: "Phối hợp đơn vị liên quan", required: false, done: false, skippedReason: advanced ? "Không cần phối hợp" : undefined },
    { name: "Kiểm tra lại / kết luận", required: true, done: advanced },
  ];
  if (reopened) steps.push({ name: "Xử lý lại", required: true, done: false });
  return steps;
}

function historyFor(s: Seed): HistoryEntry[] {
  const [, , , , unit, handler, submitted, , status] = s;
  const h: HistoryEntry[] = [{ at: `${submitted} 08:12`, actor: "Hệ thống", action: "Tiếp nhận phản ánh, cấp mã" }];
  if (unit !== "—") h.push({ at: `${submitted} 10:30`, actor: "Phan Thu Hà", action: `Giao ${unit}` });
  if (handler !== "—" && status !== "da_giao") h.push({ at: `${submitted} 14:05`, actor: handler, action: "Nhận xử lý" });
  if (status === "khong_xu_ly") h.push({ at: `${submitted} 11:00`, actor: "Phan Thu Hà", action: "Không xử lý", reason: "Trùng PA-2611-0015" });
  return h;
}

export const MOCK_CASES: CaseRow[] = SEEDS.map((s, i) => {
  const [code, title, topic, ward, unit, handler, submittedAt, dueAt, status, sender, phone] = s;
  const reopened = code === "PA-2610-0187";
  const done = ["da_giai_quyet", "da_dong"].includes(status);
  return {
    code, title, topic, ward, unit, handler, submittedAt, dueAt, status, sender, phone,
    content: `${title}. Người dân phản ánh tình trạng kéo dài, đề nghị phường kiểm tra và xử lý.`,
    consentShowKp: i % 3 === 0,
    address: `Số ${10 + i * 3}, hẻm ${i + 2}, ${ward}`,
    coords: `10.${7700 + i * 13}, 106.${6600 + i * 7}`,
    sensitive: topic === "Phản ánh về cán bộ",
    urgent: topic === "An ninh – Trật tự",
    reopened,
    extensionRound: status === "de_nghi_gia_han" ? (code === "PA-2610-0170" ? 2 : 1) : undefined,
    channel: i % 4 === 0 ? "Gửi hộ" : i % 2 === 0 ? "Web" : "Zalo",
    steps: stepsFor(status, reopened),
    history: historyFor(s),
    photosBefore: 1 + (i % 3),
    photosAfter: done || status === "cho_duyet_ket_qua" ? 2 : 0,
    kpNote: ward === "Khu phố 3" ? { text: "Đã xác minh tại chỗ, đúng như phản ánh.", shared: i % 2 === 0 } : undefined,
    result: done || status === "cho_duyet_ket_qua" ? "Đã khắc phục, kiểm tra lại đạt yêu cầu." : undefined,
    rating: status === "da_dong" ? "hai_long" : undefined,
    closedOnTime: done ? code !== "PA-2610-0150" : undefined,
    receivedMinutesAgo: code === "PA-2611-0041" ? 25 : undefined,
  };
});

export function findCase(code: string): CaseRow | undefined {
  return MOCK_CASES.find((c) => c.code === code);
}
