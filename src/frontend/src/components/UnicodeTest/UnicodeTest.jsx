// Test component để kiểm tra Unicode support
import React, { useState } from 'react';

const UnicodeTest = () => {
  const [testData, setTestData] = useState({
    full_name: 'Nguyễn Văn Hồng',
    address: '123 Đường Lê Lợi, Phường Bến Nghé, Quận 1, TP.HCM'
  });
  const [result, setResult] = useState('');

  // Function để fix encoding như trong PartnerHistory
  const fixVietnameseEncoding = (text) => {
    if (!text) return '';
    
    // Nếu text đã hiển thị đúng (có ký tự tiếng Việt), return luôn
    if (/[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđĐ]/.test(text)) {
      return text;
    }
    
    // Nếu có dấu ? trong text, có thể bị lỗi encoding
    if (text.includes('?')) {
      return text
        .replace(/Nguy.n/gi, 'Nguyễn')
        .replace(/H.ng/gi, 'Hồng')
        .replace(/Tr.n/gi, 'Trần')
        .replace(/Th.nh/gi, 'Thành')
        .replace(/L./gi, 'Lê')
        .replace(/Ph.m/gi, 'Phạm')
        .replace(/Ho.ng/gi, 'Hoàng')
        .replace(/Hu.nh/gi, 'Huỳnh')
        .replace(/V./gi, 'Vũ')
        .replace(/\?.ng/gi, 'ường')
        .replace(/\?.i/gi, 'ời')
        .replace(/\?.u/gi, 'ều')
        .replace(/\?/g, ''); // Xóa dấu ? còn lại
    }
    
    return text;
  };

  const testFixEncoding = () => {
    const testCases = [
      'Nguy?n H?ng',
      'Tr?n Th.nh', 
      'L? V?n Minh',
      'Ph?m Th? Hu?ng',
      'Ho.ng V?n ??c'
    ];
    
    const results = testCases.map(testCase => ({
      original: testCase,
      fixed: fixVietnameseEncoding(testCase)
    }));
    
    setResult(results.map(r => `"${r.original}" → "${r.fixed}"`).join('\n'));
  };

  const testUnicode = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const testRequest = {
        full_name: testData.full_name,
        email: 'test@example.com',
        phone: '0123456789',
        gender: 'Nam',
        date_of_birth: '1990-01-01',
        address: testData.address,
        blood_group_id: 1,
        component_id: 1,
        request_date: new Date().toISOString().split('T')[0]
      };

      console.log('Test data being sent:', testRequest);

      const response = await fetch('http://localhost:3001/api/partner/emergency-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        },
        body: JSON.stringify(testRequest)
      });

      const data = await response.json();
      
      if (response.ok) {
        setResult(`✅ Tạo thành công! Request ID: ${data.request_id}\n\nĐang kiểm tra dữ liệu trả về...`);
        
        // Test fetch lại để kiểm tra encoding
        setTimeout(async () => {
          const fetchResponse = await fetch('http://localhost:3001/api/partner/my-requests', {
            headers: { 
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/json; charset=utf-8'
            }
          });
          
          if (fetchResponse.ok) {
            const requests = await fetchResponse.json();
            const latestRequest = requests[0];
            
            let testResults = `✅ Tạo thành công! Request ID: ${data.request_id}\n\n`;
            testResults += `📥 Dữ liệu gửi:\n`;
            testResults += `   Tên: "${testRequest.full_name}"\n`;
            testResults += `   Địa chỉ: "${testRequest.address}"\n\n`;
            testResults += `📤 Dữ liệu nhận từ DB:\n`;
            testResults += `   Tên: "${latestRequest.full_name}"\n`;
            testResults += `   Địa chỉ: "${latestRequest.address}"\n\n`;
            
            if (latestRequest.full_name.includes('?')) {
              testResults += `⚠️  Phát hiện lỗi encoding!\n`;
              testResults += `🔧 Sau khi fix: "${fixVietnameseEncoding(latestRequest.full_name)}"\n`;
            } else if (latestRequest.full_name === testRequest.full_name) {
              testResults += `✅ Unicode hoạt động hoàn hảo!`;
            } else {
              testResults += `❓ Có sự khác biệt nhưng không phải lỗi encoding`;
            }
            
            setResult(testResults);
          }
        }, 1000);
        
      } else {
        setResult(`❌ Lỗi: ${data.error}`);
      }
    } catch (error) {
      setResult(`❌ Lỗi: ${error.message}`);
      console.error('Test error:', error);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ border: '1px solid #ccc', borderRadius: '8px', padding: '20px', marginBottom: '20px' }}>
        <h3>🧪 Test Unicode Support</h3>
        
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Tên (tiếng Việt):
          </label>
          <input 
            value={testData.full_name}
            onChange={(e) => setTestData(prev => ({ ...prev, full_name: e.target.value }))}
            style={{ 
              width: '100%', 
              padding: '8px', 
              border: '1px solid #ddd', 
              borderRadius: '4px',
              fontSize: '14px'
            }}
            placeholder="VD: Nguyễn Văn Hồng, Trần Thị Hương"
          />
        </div>
        
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Địa chỉ (tiếng Việt):
          </label>
          <input 
            value={testData.address}
            onChange={(e) => setTestData(prev => ({ ...prev, address: e.target.value }))}
            style={{ 
              width: '100%', 
              padding: '8px', 
              border: '1px solid #ddd', 
              borderRadius: '4px',
              fontSize: '14px'
            }}
            placeholder="VD: 123 Đường Lê Lợi, Quận 1, TP.HCM"
          />
        </div>
        
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button 
            onClick={testUnicode} 
            style={{ 
              padding: '10px 20px', 
              backgroundColor: '#dc2626', 
              color: 'white', 
              border: 'none', 
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            🚀 Test Gửi & Nhận Data
          </button>
          
          <button 
            onClick={testFixEncoding} 
            style={{ 
              padding: '10px 20px', 
              backgroundColor: '#16a34a', 
              color: 'white', 
              border: 'none', 
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            🔧 Test Fix Encoding
          </button>
        </div>
      </div>
      
      {result && (
        <div style={{ 
          padding: '15px', 
          backgroundColor: '#f8f9fa', 
          border: '1px solid #dee2e6',
          borderRadius: '5px',
          whiteSpace: 'pre-line',
          fontFamily: 'monospace',
          fontSize: '13px',
          lineHeight: '1.5'
        }}>
          {result}
        </div>
      )}
      
      <div style={{ 
        marginTop: '20px', 
        padding: '15px', 
        backgroundColor: '#e3f2fd', 
        borderRadius: '5px',
        fontSize: '12px'
      }}>
        <strong>🔍 Test Cases Cần Kiểm Tra:</strong>
        <ul style={{ margin: '10px 0', paddingLeft: '20px' }}>
          <li><strong>Tên:</strong> Nguyễn Văn Hồng, Trần Thành, Lê Minh Khang</li>
          <li><strong>Địa chỉ:</strong> Đường Lê Lợi, Phường Bến Nghé</li>
          <li><strong>Lỗi encoding:</strong> Nguy?n H?ng, Tr?n Th.nh</li>
        </ul>
        <p><strong>🎯 Mục tiêu:</strong> Dữ liệu gửi đi và nhận về phải giống hệt nhau!</p>
      </div>
    </div>
  );
};

export default UnicodeTest;
