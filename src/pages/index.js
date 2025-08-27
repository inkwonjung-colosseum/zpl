import React, { useState, useEffect } from "react";
import Link from "next/link";

// ZPL 템플릿 샘플들
const ZPL_TEMPLATES = {
  basic: {
    name: "Basic Label",
    code: `^XA
^FO100,100
^A0N,50,50
^FDHello ZPL!^FS
^FO100,200
^A0N,30,30
^FDBasic Label Template^FS
^XZ`,
  },
  shipping: {
    name: "Shipping Label",
    code: `^XA
^FO50,50
^A0N,40,40
^FDShipping Label^FS

^FO50,120
^A0N,25,25
^FDTo: John Doe^FS
^FO50,160
^A0N,25,25
^FDAddress: 123 Main St, New York, NY^FS
^FO50,200
^A0N,25,25
^FDPhone: (555) 123-4567^FS

^FO50,260
^BY2,2,50
^BCN,100,Y,N,N,A
^FDORD-2024-001^FS

^FO50,400
^A0N,20,20
^FDOrder No: ORD-2024-001^FS
^FO50,430
^A0N,20,20
^FDShip Date: 2024-08-27^FS
^XZ`,
  },
  barcode: {
    name: "Barcode Label",
    code: `^XA
^FO100,50
^A0N,30,30
^FDProduct Barcode^FS

^FO100,120
^BY3,3,80
^BCN,100,Y,N,N,A
^FD1234567890^FS

^FO100,250
^A0N,25,25
^FDProduct: Test Product A^FS
^FO100,290
^A0N,20,20
^FDPrice: $10.00^FS
^XZ`,
  },
  qrcode: {
    name: "QR Code Label",
    code: `^XA
^FO100,50
^A0N,30,30
^FDQR Code Label^FS

^FO100,120
^BQN,2,4,H,7
^FDQA,https://example.com/product/123^FS

^FO300,120
^A0N,25,25
^FDProduct Info^FS
^FO300,160
^A0N,20,20
^FDProduct Name: Sample Product 1^FS
^FO300,190
^A0N,20,20
^FDModel No: SP-001^FS
^XZ`,
  },
  korean: {
    name: "Korean UTF-8",
    code: `^XA
^CI28
^FO50,50
^A0N,40,40
^FD안녕하세요^FS

^FO50,120
^A0N,30,30
^FD제품명: 한글 테스트 제품^FS
^FO50,170
^A0N,25,25
^FD가격: 25,000원^FS

^FO50,220
^BY2,2,50
^BCN,80,Y,N,N,A
^FD1234567890^FS

^FO50,340
^A0N,20,20
^FD인쇄일: 2024-08-27^FS
^FO50,370
^A0N,20,20
^FD제조사: 한국제조업체^FS

^FO50,420
^GB300,2,3^FS
^FO50,440
^A0N,15,15
^FDMade in Korea^FS
^XZ`,
  },
};

const ZPLPreviewPage = () => {
  const [zplCode, setZplCode] = useState(ZPL_TEMPLATES.basic.code);
  const [previewUrl, setPreviewUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasChanges, setHasChanges] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState("basic");
  
  // 프린터 설정 상태
  const [printerSettings, setPrinterSettings] = useState({
    resolution: "8dpmm",
    labelSize: "4x6",
  });

  // Labelary API를 사용한 ZPL 미리보기 생성
  const generatePreview = async (code) => {
    if (!code.trim()) return;

    setIsLoading(true);
    setError("");

    try {
      // 프린터 설정에 따른 API URL 생성
      const { resolution, labelSize } = printerSettings;
      const apiUrl = `http://api.labelary.com/v1/printers/${resolution}/labels/${labelSize}/0/`;
      
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          Accept: "image/png",
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: code,
      });

      if (response.ok) {
        const blob = await response.blob();
        const imageUrl = URL.createObjectURL(blob);
        setPreviewUrl(imageUrl);
        setHasChanges(false);
      } else {
        setError("ZPL 코드 미리보기 생성에 실패했습니다.");
      }
    } catch (err) {
      setError("미리보기 서비스 연결에 실패했습니다. (CORS 제한)");
      console.error("Preview generation error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCodeChange = (e) => {
    const newCode = e.target.value;
    setZplCode(newCode);
    setHasChanges(true);
  };

  const handleTemplateSelect = (template, key) => {
    setZplCode(template.code);
    setSelectedTemplate(key);
    setHasChanges(false);
  };

  const handleManualPreview = () => {
    generatePreview(zplCode);
  };

  const handlePrinterSettingChange = (setting, value) => {
    setPrinterSettings(prev => ({ ...prev, [setting]: value }));
    if (previewUrl) {
      setPreviewUrl("");
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 bg-gray-50 min-h-screen">
      {/* 헤더 */}
      <div className="mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-4xl font-bold text-gray-800 mb-2">ZPL 코드 미리보기 도구</h1>
            <div className="flex items-center gap-2 text-black text-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>개발 전용 페이지 - ZPL 코드 테스트 및 미리보기</span>
            </div>
          </div>
          <div className="flex gap-2">
            <Link 
              href="/template-builder"
              className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
            >
              🚀 스마트 빌더
            </Link>
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
              📚 ZPL 문법 참조
            </Link>
          </div>
        </div>
      </div>

      {/* 에러 알림 */}
      {error && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-4 rounded-lg mb-6">
          {error}
          <br />
          <div className="mt-2 text-xs">
            💡 해결 방법: 브라우저 CORS 확장 프로그램을 사용하거나, 서버에서 프록시를 설정하여
            Labelary API에 접근할 수 있습니다.
          </div>
        </div>
      )}

      {/* 프린터 설정 */}
      <div className="bg-white rounded-lg p-5 shadow-sm mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">프린터 설정</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-gray-700">해상도</label>
            <select 
              className="px-3 py-2 border border-gray-300 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={printerSettings.resolution}
              onChange={(e) => handlePrinterSettingChange('resolution', e.target.value)}
            >
              <option value="6dpmm">6dpmm (152dpi)</option>
              <option value="8dpmm">8dpmm (203dpi)</option>
              <option value="12dpmm">12dpmm (300dpi)</option>
              <option value="24dpmm">24dpmm (600dpi)</option>
            </select>
          </div>
          
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-gray-700">라벨 크기</label>
            <select 
              className="px-3 py-2 border border-gray-300 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={printerSettings.labelSize}
              onChange={(e) => handlePrinterSettingChange('labelSize', e.target.value)}
            >
              <option value="4x6">4" x 6" (101.6 x 152.4mm)</option>
              <option value="3x2">3" x 2" (76.2 x 50.8mm)</option>
              <option value="2x1">2" x 1" (50.8 x 25.4mm)</option>
            </select>
          </div>
          

        </div>
      </div>

      {/* API 호출 상태 */}
      <div className="bg-white rounded-lg p-5 shadow-sm mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">API 호출 상태</h2>
        
        {/* API 사용 제한 정보 */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
          <h4 className="font-semibold text-blue-800 mb-3">📊 Labelary API 사용 제한 정보</h4>
          <div className="text-sm text-blue-700 space-y-2">
            <div>• <strong>무료 계정:</strong> 분당 약 10-15회 호출 제한</div>
            <div>• <strong>연속 호출:</strong> 5-10회 연속 호출 시 일시적 차단 (1-5분)</div>
            <div>• <strong>CORS 정책:</strong> 브라우저에서 직접 호출 시 제한</div>
            <div>• <strong>해결 방법:</strong> API 키 발급 또는 서버 프록시 사용</div>
            <div>• <strong>권장사항:</strong> 미리보기 생성 간격을 3-5초 이상 두기</div>
          </div>
          
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <div className="text-sm text-yellow-800">
              <strong>💡 현재 상황:</strong> API 호출이 실패하면 위의 제한 사항 중 하나에 해당할 가능성이 높습니다.
              <br />
              <strong>🔧 해결책:</strong> 브라우저 CORS 확장 프로그램 사용 또는 잠시 후 다시 시도해보세요.
            </div>
          </div>
        </div>
      </div>

      {/* 메인 그리드 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* 왼쪽: ZPL 코드 에디터 */}
        <div className="bg-white rounded-lg p-5 shadow-sm h-[600px] flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">ZPL 코드 에디터</h2>
            <button 
              className={`px-4 py-2 rounded-md text-sm font-medium text-white ${
                hasChanges 
                  ? 'bg-orange-500 hover:bg-orange-600' 
                  : 'bg-blue-600 hover:bg-blue-700'
              } disabled:bg-gray-300 disabled:cursor-not-allowed`}
              onClick={handleManualPreview} 
              disabled={isLoading}
            >
              {isLoading ? "생성 중..." : hasChanges ? "미리보기 업데이트" : "미리보기 생성"}
            </button>
          </div>

          <div className="flex-1 relative border border-gray-300 rounded-md overflow-hidden">
            <textarea
              className={`w-full h-full font-mono text-sm border-none p-3 resize-none outline-none leading-6 ${
                hasChanges ? 'border-orange-500 bg-orange-50' : ''
              }`}
              value={zplCode}
              onChange={handleCodeChange}
              placeholder="ZPL 코드를 입력하세요..."
              spellCheck={false}
            />
          </div>
          
          {hasChanges && (
            <div className="flex items-center gap-2 text-xs text-orange-600 mt-2">
              <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-blink"></div>
              <span>코드가 변경되었습니다. "미리보기 업데이트" 버튼을 클릭하여 적용하세요.</span>
            </div>
          )}
        </div>

        {/* 오른쪽: 미리보기 */}
        <div className="bg-white rounded-lg p-5 shadow-sm h-[600px] flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">라벨 미리보기</h2>
          </div>

          <div className="flex-1 border border-gray-300 rounded-md bg-gray-100 overflow-auto flex items-center justify-center flex-col text-center">
            {isLoading ? (
              <div className="text-black text-sm">미리보기 생성 중...</div>
            ) : previewUrl ? (
              <img src={previewUrl} alt="ZPL Preview" className="max-w-full max-h-full object-contain" />
            ) : (
              <div className="text-black text-sm">
                <div>ZPL 코드를 입력하면 여기에 미리보기가 표시됩니다</div>
                <div className="text-xs mt-2 text-black">
                  코드 수정 후 "미리보기 생성" 버튼을 클릭하세요
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <hr className="border-none border-t border-gray-300 my-8" />

      {/* 템플릿 섹션 */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">샘플 템플릿</h2>
        <div className="flex gap-2 flex-wrap mb-4">
          {Object.entries(ZPL_TEMPLATES).map(([key, template]) => (
            <button
              key={key}
              className={`px-4 py-2 rounded-md text-sm border cursor-pointer transition-colors ${
                selectedTemplate === key
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-blue-500'
              }`}
              onClick={() => handleTemplateSelect(template, key)}
            >
              {template.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ZPLPreviewPage;
