// Dữ liệu cấu hình giả cho màn Quản trị. Quản trị không xem nội dung phản ánh.

export const TOPICS: { name: string; unit: string; flag?: string }[] = [
  { name: "Đô thị – Xây dựng", unit: "Phòng KT-HT-ĐT" },
  { name: "Đất đai", unit: "Phòng KT-HT-ĐT", flag: "Dễ là khiếu nại" },
  { name: "Môi trường", unit: "Phòng KT-HT-ĐT" },
  { name: "Hạ tầng – Giao thông", unit: "Phòng KT-HT-ĐT" },
  { name: "An ninh – Trật tự", unit: "Công an phường", flag: "Khẩn: hiện số gọi" },
  { name: "Văn hóa – Xã hội", unit: "Phòng VH-XH" },
  { name: "Hành chính – Thủ tục", unit: "Văn phòng HĐND-UBND" },
  { name: "Điện, nước, viễn thông", unit: "Ngoài phường", flag: "Chuyển ngoài" },
  { name: "Phản ánh về cán bộ", unit: "Chủ tịch phường", flag: "Luồng kín" },
  { name: "Khác / Không rõ", unit: "Hàng chờ điều phối" },
];

export const WARDS: { name: string; head: string }[] = [
  { name: "Khu phố 1", head: "Ngô Văn Bình" },
  { name: "Khu phố 2", head: "Trương Thị Hạnh" },
  { name: "Khu phố 3", head: "Đỗ Thị Lan" },
  { name: "Khu phố 4", head: "Lâm Văn Phát" },
  { name: "Khu phố 5", head: "Huỳnh Thị Mỹ" },
];

export const USERS: { name: string; role: string; unit: string; active: boolean }[] = [
  { name: "Phan Thu Hà", role: "Điều phối viên", unit: "Văn phòng HĐND-UBND", active: true },
  { name: "Lê Quang Huy", role: "Trưởng phòng", unit: "Phòng KT-HT-ĐT", active: true },
  { name: "Trần Minh", role: "Cán bộ chuyên môn", unit: "Phòng KT-HT-ĐT", active: true },
  { name: "Nguyễn Hữu Phúc", role: "Cán bộ chuyên môn", unit: "Phòng KT-HT-ĐT", active: true },
  { name: "Mai Anh Tuấn", role: "Cán bộ chuyên môn", unit: "Phòng VH-XH", active: true },
  { name: "Võ Hải", role: "Cán bộ chuyên môn", unit: "Công an phường", active: true },
  { name: "Vũ Đức Thắng", role: "Phó Chủ tịch", unit: "UBND phường", active: true },
  { name: "Hoàng Văn Nam", role: "Chủ tịch", unit: "UBND phường", active: true },
  { name: "Đỗ Thị Lan", role: "Trưởng khu phố", unit: "Khu phố 3", active: true },
];

export const ASSIGNMENTS: { user: string; unit: string; topic: string; ward: string; from: string; to: string }[] = [
  { user: "Trần Minh", unit: "Phòng KT-HT-ĐT", topic: "Hạ tầng – Giao thông", ward: "Toàn phường", from: "2026-01-01", to: "—" },
  { user: "Trần Minh", unit: "Phòng KT-HT-ĐT", topic: "Môi trường", ward: "Toàn phường", from: "2026-01-01", to: "—" },
  { user: "Nguyễn Hữu Phúc", unit: "Phòng KT-HT-ĐT", topic: "Đô thị – Xây dựng", ward: "Toàn phường", from: "2026-03-01", to: "—" },
  { user: "Mai Anh Tuấn", unit: "Phòng VH-XH", topic: "Văn hóa – Xã hội", ward: "Toàn phường", from: "2026-01-01", to: "—" },
];

export const DELEGATIONS: { from: string; to: string; start: string; end: string }[] = [
  { from: "Lê Quang Huy", to: "Nguyễn Hữu Phúc", start: "2026-11-10", end: "2026-11-14" },
];

export const HOLIDAY_LIST: { date: string; name: string }[] = [
  { date: "2026-01-01", name: "Tết Dương lịch" },
  { date: "2026-04-30", name: "Giải phóng miền Nam" },
  { date: "2026-05-01", name: "Quốc tế Lao động" },
  { date: "2026-09-02", name: "Quốc khánh" },
];
