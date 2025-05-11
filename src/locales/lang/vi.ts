/*
 * Copyright (c) 2025 michioxd
 * Released under MIT license. See LICENSE for more details.
 * Repository: https://github.com/michioxd/nyaadenwa
 */

import type { LocaleResourcesType } from "@/locales/list";

/**
 * @description Vietnamese translation (Tiếng Việt)
 * @author michioxd
 */
const Locale: LocaleResourcesType = {
    translation: {
        add_device: "Thêm thiết bị",
        settings: "Cài đặt",
        change_language: "Thay đổi ngôn ngữ",
        about_nyaadenwa: "Giới thiệu nyaadenwa",
        no_device_connected: "Không có thiết bị nào được kết nối",
        forget: "Quên",
        forget_device: "Quên thiết bị",
        device_forgot: "Thiết bị đã bị quên. Vui lòng tải lại trang để kết nối lại.",
        forget_device_description:
            "Bạn có chắc chắn muốn quên thiết bị này không? ({{device}}) Sau khi thực hiện, nếu bạn muốn kết nối lại, bạn cần tải lại trang này.",
        open: "Mở",
        welcome_title: "Chào mừng đến với nyaadenwa",
        welcome_description: "Quản lý điện thoại của bạn trực tiếp trên trình duyệt của bạn :D",
        welcome_manual: "Nhấn nút <0>+</0> để bắt đầu",
        fork_github: "Fork nyaadenwa trên GitHub",
        github_repo: "Kho lưu trữ trên GitHub",
        released_under_mit_license: "Được phát hành dưới Giấy phép MIT",
        ok: "OK",
        cancel: "Hủy",
        confirm: "Xác nhận",
        close: "Đóng",
        commit: "Commit",
        commit_date: "Ngày commit",
        translation_authors: "Tác giả bản dịch",
        all_contributors: "Tất cả người đóng góp",
        device_disconnected: "Thiết bị đã bị ngắt kết nối",
        device_disconnected_description: "Các thiết bị sau đã bị ngắt kết nối:",
        device_access_denied: "Không có quyền truy cập thiết bị",
        device_access_denied_description:
            "{{device}} không cho phép truy cập vào thiết bị. Hãy chắc chắn rằng bạn đã chọn chế độ Truyền tệp trong cài đặt kết nối USB hoặc bạn đã bật tùy chọn Phát triển trên thiết bị và USB debugging.",
        device_busy: "Thiết bị đang bận",
        device_busy_description:
            '{{device}} đang được sử dụng bởi phần mềm khác. Vui lòng đóng phần mềm đấy và thử lại. Bạn có thể thử tắt ADB đang chạy trên máy bằng cách gõ lệnh "adb kill-server" trong terminal.',
        cannot_connect_device: "Không thể kết nối thiết bị",
        cannot_connect_device_description:
            "Đã xảy ra lỗi khi kết nối đến thiết bị. Vui lòng thử lại. Kiểm tra console để biết thêm thông tin chi tiết.",
        CONNECTING: "Đang kết nối",
        DISCONNECTED: "Đã ngắt kết nối",
        CONNECTED: "Đã kết nối",
        device_attached: "Thiết bị đã được kết nối",
        connecting_to_device: "Đang kết nối đến thiết bị...",
        waiting_for_device: "Đang chờ thiết bị...",
    },
};

export default Locale;
