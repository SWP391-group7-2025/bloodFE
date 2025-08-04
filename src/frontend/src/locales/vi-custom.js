import { vi } from 'date-fns/locale';

const viCustom = { ...vi };

// Tùy chỉnh các chuỗi định dạng cho tên ngày trong tuần
// 'dd' (day of week) là viết tắt cho các ngày trong tuần.
// Các giá trị trong mảng tương ứng với: Chủ Nhật, Thứ 2, Thứ 3, Thứ 4, Thứ 5, Thứ 6, Thứ 7
viCustom.localize.day = (n) => {
    const days = [
        'CN', // Chủ Nhật
        'T2', // Thứ 2
        'T3', // Thứ 3
        'T4', // Thứ 4
        'T5', // Thứ 5
        'T6', // Thứ 6
        'T7'  // Thứ 7
    ];
    return days[n];
};

export default viCustom;