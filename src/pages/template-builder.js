import React, { useState, useRef } from "react";
import Link from "next/link";

// 업종별 템플릿 패턴
const INDUSTRY_TEMPLATES = {
  logistics: {
    name: "물류/배송",
    templates: {
      shipping: {
        name: "배송 라벨",
        fields: [
          { type: "text", label: "받는 사람", key: "recipient", required: true },
          { type: "text", label: "주소", key: "address", required: true },
          { type: "text", label: "전화번호", key: "phone", required: false },
          { type: "barcode", label: "운송장 번호", key: "trackingNumber", required: true },
          { type: "text", label: "발송일", key: "shipDate", required: false },
        ]
      },
      warehouse: {
        name: "창고 재고",
        fields: [
          { type: "text", label: "제품명", key: "productName", required: true },
          { type: "text", label: "SKU", key: "sku", required: true },
          { type: "barcode", label: "제품 코드", key: "productCode", required: true },
          { type: "text", label: "입고일", key: "stockDate", required: false },
          { type: "text", label: "수량", key: "quantity", required: false },
        ]
      }
    }
  },
  retail: {
    name: "소매/판매",
    templates: {
      product: {
        name: "상품 라벨",
        fields: [
          { type: "text", label: "상품명", key: "productName", required: true },
          { type: "text", label: "가격", key: "price", required: true },
          { type: "barcode", label: "바코드", key: "barcode", required: true },
          { type: "text", label: "브랜드", key: "brand", required: false },
          { type: "qrcode", label: "제품 정보 QR", key: "productUrl", required: false },
        ]
      },
      promotion: {
        name: "프로모션 라벨",
        fields: [
          { type: "text", label: "할인가", key: "discountPrice", required: true },
          { type: "text", label: "원가", key: "originalPrice", required: true },
          { type: "text", label: "할인율", key: "discountRate", required: false },
          { type: "text", label: "프로모션 기간", key: "promotionPeriod", required: false },
        ]
      }
    }
  },
  manufacturing: {
    name: "제조/생산",
    templates: {
      asset: {
        name: "자산 관리",
        fields: [
          { type: "text", label: "자산명", key: "assetName", required: true },
          { type: "text", label: "자산 번호", key: "assetNumber", required: true },
          { type: "qrcode", label: "자산 코드", key: "assetCode", required: true },
          { type: "text", label: "관리 부서", key: "department", required: false },
          { type: "text", label: "점검일", key: "inspectionDate", required: false },
        ]
      },
      quality: {
        name: "품질 관리",
        fields: [
          { type: "text", label: "제품명", key: "productName", required: true },
          { type: "text", label: "배치 번호", key: "batchNumber", required: true },
          { type: "text", label: "검사일", key: "inspectionDate", required: true },
          { type: "text", label: "검사자", key: "inspector", required: false },
          { type: "qrcode", label: "품질 인증", key: "qualityCode", required: false },
        ]
      }
    }
  }
};

const TemplateBuilder = () => {
  const [selectedIndustry, setSelectedIndustry] = useState("logistics");
  const [selectedTemplate, setSelectedTemplate] = useState("shipping");
  const [formData, setFormData] = useState({});
  const [generatedZPL, setGeneratedZPL] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [copyFormat, setCopyFormat] = useState("zpl"); // "zpl", "js", "optimized"
  const [useVariables, setUseVariables] = useState(false);

  // 현재 선택된 템플릿 정보
  const currentTemplate = INDUSTRY_TEMPLATES[selectedIndustry].templates[selectedTemplate];

  // 폼 데이터 업데이트
  const handleFormChange = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  // ZPL 코드 최적화 (공백/주석 제거)
  const optimizeZPL = (zplCode) => {
    return zplCode
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('//'))
      .join('\n');
  };

  // 변수 템플릿으로 변환
  const convertToVariableTemplate = (zplCode, data) => {
    let variableZPL = zplCode;
    Object.entries(data).forEach(([key, value]) => {
      if (value) {
        const regex = new RegExp(value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
        variableZPL = variableZPL.replace(regex, `{{${key}}}`);
      }
    });
    return variableZPL;
  };

  // JavaScript 포맷으로 변환
  const formatAsJavaScript = (zplCode) => {
    const optimized = optimizeZPL(zplCode);
    return `const zplCode = \`${optimized.replace(/`/g, '\\`')}\`;

// 프린터 연결 예제
// 1. 웹 브라우저에서 직접 프린터 연결
if (navigator.usb) {
  // WebUSB API 사용
  const printer = await navigator.usb.requestDevice({
    filters: [{ vendorId: 0x0a5f }] // Zebra
  });
  // printer.print(zplCode);
}

// 2. Node.js 환경에서 직렬 포트 연결
// npm install serialport
// const SerialPort = require('serialport');
// const port = new SerialPort('/dev/ttyUSB0', { baudRate: 9600 });
// port.write(zplCode);

// 3. 네트워크 프린터 연결 (IP)
// fetch('http://192.168.1.100:9100', {
//   method: 'POST',
//   body: zplCode
// });`;
  };

  // ZPL 코드 생성 함수
  const generateZPL = () => {
    let zplCode = "^XA\n^CI28\n"; // 시작 + UTF-8 설정
    
    // 템플릿에 따른 ZPL 생성
    if (selectedTemplate === "shipping") {
      zplCode += generateShippingZPL(formData);
    } else if (selectedTemplate === "warehouse") {
      zplCode += generateWarehouseZPL(formData);
    } else if (selectedTemplate === "product") {
      zplCode += generateProductZPL(formData);
    } else if (selectedTemplate === "promotion") {
      zplCode += generatePromotionZPL(formData);
    } else if (selectedTemplate === "asset") {
      zplCode += generateAssetZPL(formData);
    } else if (selectedTemplate === "quality") {
      zplCode += generateQualityZPL(formData);
    }
    
    zplCode += "^XZ"; // 종료
    return zplCode;
  };

  // 배송 라벨 ZPL 생성
  const generateShippingZPL = (data) => {
    return `^FO50,50
^A0N,40,40
^FD배송 라벨^FS

^FO50,120
^A0N,25,25
^FD받는 사람: ${data.recipient || ""}^FS
^FO50,160
^A0N,25,25
^FD주소: ${data.address || ""}^FS
${data.phone ? `^FO50,200\n^A0N,25,25\n^FD전화번호: ${data.phone}^FS\n` : ""}

^FO50,260
^BY2,2,50
^BCN,100,Y,N,N,A
^FD${data.trackingNumber || "1234567890"}^FS

${data.shipDate ? `^FO50,400\n^A0N,20,20\n^FD발송일: ${data.shipDate}^FS\n` : ""}
`;
  };

  // 창고 재고 ZPL 생성
  const generateWarehouseZPL = (data) => {
    return `^FO50,50
^A0N,35,35
^FD창고 재고^FS

^FO50,120
^A0N,25,25
^FD제품명: ${data.productName || ""}^FS
^FO50,160
^A0N,25,25
^FDSKU: ${data.sku || ""}^FS

^FO50,220
^BY2,2,50
^BCN,80,Y,N,N,A
^FD${data.productCode || "1234567890"}^FS

${data.stockDate ? `^FO50,340\n^A0N,20,20\n^FD입고일: ${data.stockDate}^FS\n` : ""}
${data.quantity ? `^FO50,370\n^A0N,20,20\n^FD수량: ${data.quantity}^FS\n` : ""}
`;
  };

  // 상품 라벨 ZPL 생성
  const generateProductZPL = (data) => {
    return `^FO50,50
^A0N,30,30
^FD${data.productName || "상품명"}^FS

^FO50,100
^A0N,35,35
^FD₩ ${data.price || "0"}^FS

${data.brand ? `^FO50,150\n^A0N,20,20\n^FD${data.brand}^FS\n` : ""}

^FO50,200
^BY2,2,50
^BCN,80,Y,N,N,A
^FD${data.barcode || "1234567890"}^FS

${data.productUrl ? `^FO300,200\n^BQN,2,4,H,7\n^FDQA,${data.productUrl}^FS\n` : ""}
`;
  };

  // 프로모션 라벨 ZPL 생성
  const generatePromotionZPL = (data) => {
    return `^FO50,50
^A0N,40,40
^FD특가 세일!^FS

^FO50,120
^A0N,50,50
^FD₩ ${data.discountPrice || "0"}^FS

${data.originalPrice ? `^FO50,180\n^A0N,25,25\n^FD정가: ₩${data.originalPrice}^FS\n` : ""}
${data.discountRate ? `^FO200,180\n^A0N,30,30\n^FD${data.discountRate}% 할인^FS\n` : ""}

${data.promotionPeriod ? `^FO50,240\n^A0N,20,20\n^FD기간: ${data.promotionPeriod}^FS\n` : ""}
`;
  };

  // 자산 관리 ZPL 생성
  const generateAssetZPL = (data) => {
    return `^FO50,50
^A0N,30,30
^FD자산 관리^FS

^FO50,100
^A0N,25,25
^FD자산명: ${data.assetName || ""}^FS
^FO50,140
^A0N,25,25
^FD자산번호: ${data.assetNumber || ""}^FS

^FO50,200
^BQN,2,4,H,7
^FDQA,${data.assetCode || "ASSET001"}^FS

${data.department ? `^FO200,200\n^A0N,20,20\n^FD부서: ${data.department}^FS\n` : ""}
${data.inspectionDate ? `^FO200,230\n^A0N,20,20\n^FD점검일: ${data.inspectionDate}^FS\n` : ""}
`;
  };

  // 품질 관리 ZPL 생성
  const generateQualityZPL = (data) => {
    return `^FO50,50
^A0N,30,30
^FD품질 관리^FS

^FO50,100
^A0N,25,25
^FD제품명: ${data.productName || ""}^FS
^FO50,140
^A0N,25,25
^FD배치번호: ${data.batchNumber || ""}^FS
^FO50,180
^A0N,25,25
^FD검사일: ${data.inspectionDate || ""}^FS

${data.inspector ? `^FO50,220\n^A0N,20,20\n^FD검사자: ${data.inspector}^FS\n` : ""}

${data.qualityCode ? `^FO50,280\n^BQN,2,4,H,7\n^FDQA,${data.qualityCode}^FS\n` : ""}
`;
  };

  // ZPL 생성 및 미리보기
  const handleGenerate = async () => {
    setIsGenerating(true);
    const zpl = generateZPL();
    setGeneratedZPL(zpl);

    // 미리보기 생성
    try {
      const response = await fetch("http://api.labelary.com/v1/printers/8dpmm/labels/4x6/0/", {
        method: "POST",
        headers: {
          Accept: "image/png",
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: zpl,
      });

      if (response.ok) {
        const blob = await response.blob();
        const imageUrl = URL.createObjectURL(blob);
        setPreviewUrl(imageUrl);
      }
    } catch (err) {
      console.error("Preview generation error:", err);
    }

    setIsGenerating(false);
  };

  // 클립보드에 복사
  const copyToClipboard = async () => {
    try {
      let textToCopy = generatedZPL;
      
      if (copyFormat === "optimized") {
        textToCopy = optimizeZPL(generatedZPL);
      } else if (copyFormat === "js") {
        textToCopy = formatAsJavaScript(generatedZPL);
      } else if (copyFormat === "variables") {
        textToCopy = convertToVariableTemplate(generatedZPL, formData);
      }
      
      await navigator.clipboard.writeText(textToCopy);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error("Copy failed:", err);
    }
  };

  // 템플릿 변경 시 폼 데이터 초기화
  const handleTemplateChange = (industry, template) => {
    setSelectedIndustry(industry);
    setSelectedTemplate(template);
    setFormData({});
    setGeneratedZPL("");
    setPreviewUrl("");
  };

  return (
    <div className="max-w-7xl mx-auto p-6 bg-gray-50 min-h-screen">
      {/* 헤더 */}
      <div className="mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-4xl font-bold text-gray-800 mb-2">스마트 템플릿 빌더</h1>
            <div className="flex items-center gap-2 text-black text-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>폼 입력으로 ZPL 코드 자동 생성</span>
            </div>
          </div>
          <div className="flex gap-2">
            <Link 
              href="/visual-editor"
              className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
            >
              🎨 비주얼 에디터
            </Link>
            <Link 
              href="/zpl-reference"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              📚 ZPL 참조
            </Link>
            <Link 
              href="/"
              className="px-4 py-2 bg-gray-600 text-white rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors"
            >
              🔧 코드 에디터
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 왼쪽: 템플릿 선택 */}
        <div className="bg-white rounded-lg p-5 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">템플릿 선택</h2>
          
          {Object.entries(INDUSTRY_TEMPLATES).map(([industryKey, industry]) => (
            <div key={industryKey} className="mb-4">
              <h3 className="font-semibold text-gray-700 mb-2">{industry.name}</h3>
              {Object.entries(industry.templates).map(([templateKey, template]) => (
                <button
                  key={templateKey}
                  onClick={() => handleTemplateChange(industryKey, templateKey)}
                  className={`block w-full text-left px-3 py-2 rounded-md text-sm mb-2 transition-colors ${
                    selectedIndustry === industryKey && selectedTemplate === templateKey
                      ? 'bg-blue-100 text-blue-700 border-blue-200'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {template.name}
                </button>
              ))}
            </div>
          ))}
        </div>

        {/* 가운데: 폼 입력 */}
        <div className="bg-white rounded-lg p-5 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">
              {currentTemplate.name} 정보 입력
            </h2>
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {isGenerating ? "생성 중..." : "ZPL 생성"}
            </button>
          </div>

          <div className="space-y-4">
            {currentTemplate.fields.map((field) => (
              <div key={field.key}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </label>
                <input
                  type="text"
                  value={formData[field.key] || ""}
                  onChange={(e) => handleFormChange(field.key, e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={`${field.label}을(를) 입력하세요`}
                />
                {field.type === "barcode" && (
                  <p className="text-xs text-gray-500 mt-1">바코드로 표시됩니다</p>
                )}
                {field.type === "qrcode" && (
                  <p className="text-xs text-gray-500 mt-1">QR코드로 표시됩니다</p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 오른쪽: 미리보기 및 결과 */}
        <div className="bg-white rounded-lg p-5 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">미리보기 & ZPL 코드</h2>
          
          {/* 미리보기 */}
          {previewUrl && (
            <div className="mb-4">
              <h3 className="font-medium text-gray-700 mb-2">미리보기</h3>
              <div className="border border-gray-300 rounded-md bg-gray-100 p-4 flex items-center justify-center">
                <img src={previewUrl} alt="Label Preview" className="max-w-full max-h-48 object-contain" />
              </div>
            </div>
          )}

          {/* 생성된 ZPL 코드 */}
          {generatedZPL && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-medium text-gray-700">생성된 코드</h3>
                <div className="flex gap-2 items-center">
                  {/* 복사 포맷 선택 */}
                  <select
                    value={copyFormat}
                    onChange={(e) => setCopyFormat(e.target.value)}
                    className="px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="zpl">원본 ZPL</option>
                    <option value="optimized">최적화된 ZPL</option>
                    <option value="js">JavaScript 코드</option>
                    <option value="variables">변수 템플릿</option>
                  </select>
                  
                  <button
                    onClick={copyToClipboard}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      copySuccess 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                    }`}
                  >
                    {copySuccess ? "복사됨!" : "복사"}
                  </button>
                </div>
              </div>

              {/* 복사 포맷 설명 */}
              <div className="mb-3">
                {copyFormat === "zpl" && (
                  <p className="text-xs text-gray-600">📄 원본 ZPL 코드 - 프린터에 바로 전송</p>
                )}
                {copyFormat === "optimized" && (
                  <p className="text-xs text-gray-600">⚡ 최적화된 코드 - 불필요한 공백과 주석 제거</p>
                )}
                {copyFormat === "js" && (
                  <p className="text-xs text-gray-600">💻 JavaScript 코드 - 프린터 연결 예제 포함</p>
                )}
                {copyFormat === "variables" && (
                  <p className="text-xs text-gray-600">🔄 변수 템플릿 - {{name}}, {{address}} 형태로 변환</p>
                )}
              </div>

              <textarea
                value={
                  copyFormat === "optimized" ? optimizeZPL(generatedZPL) :
                  copyFormat === "js" ? formatAsJavaScript(generatedZPL) :
                  copyFormat === "variables" ? convertToVariableTemplate(generatedZPL, formData) :
                  generatedZPL
                }
                readOnly
                className="w-full h-64 font-mono text-xs border border-gray-300 rounded-md p-3 bg-gray-50 resize-none"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TemplateBuilder;