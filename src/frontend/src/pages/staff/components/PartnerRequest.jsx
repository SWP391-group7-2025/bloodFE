import React from "react";

// Đây là component mẫu cho PartnerRequest. Bạn có thể chỉnh sửa lại theo nhu cầu thực tế.
function PartnerRequest({ partnerRequest }) {
  return (
    <div style={{ border: "1px solid #ccc", borderRadius: 8, padding: 16, marginBottom: 16 }}>
      <div><b>Mã yêu cầu:</b> {partnerRequest?.id || "N/A"}</div>
      <div><b>Tên đối tác:</b> {partnerRequest?.partnerName || "N/A"}</div>
      <div><b>Trạng thái:</b> {partnerRequest?.status || "N/A"}</div>
      {/* Thêm các trường khác nếu cần */}
    </div>
  );
}

export default PartnerRequest;
