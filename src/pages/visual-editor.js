import React, { useState, useRef, useCallback } from "react";
import Link from "next/link";

// ZPL 요소 타입
const ELEMENT_TYPES = {
  text: { name: "텍스트", icon: "📝", color: "bg-blue-100 border-blue-300" },
  barcode: { name: "바코드", icon: "📊", color: "bg-green-100 border-green-300" },
  qrcode: { name: "QR코드", icon: "🔲", color: "bg-purple-100 border-purple-300" },
  box: { name: "박스", icon: "⬜", color: "bg-gray-100 border-gray-300" },
  line: { name: "라인", icon: "➖", color: "bg-yellow-100 border-yellow-300" },
};

// 라벨 크기 설정 (픽셀 단위)
const LABEL_SIZES = {
  "4x6": { width: 600, height: 400, name: "4\" x 6\"" },
  "3x2": { width: 450, height: 300, name: "3\" x 2\"" },
  "2x1": { width: 300, height: 150, name: "2\" x 1\"" },
};

const VisualEditor = () => {
  const [labelSize, setLabelSize] = useState("4x6");
  const [elements, setElements] = useState([]);
  const [selectedElement, setSelectedElement] = useState(null);
  const [draggedElement, setDraggedElement] = useState(null);
  const [generatedZPL, setGeneratedZPL] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [copyFormat, setCopyFormat] = useState("zpl");
  const canvasRef = useRef(null);

  // 픽셀을 ZPL 좌표로 변환 (대략적인 변환)
  const pixelToZPL = (pixel, axis = "x") => {
    return Math.round(pixel * 2); // 간단한 스케일링
  };

  // 새 요소 추가
  const addElement = (type) => {
    const newElement = {
      id: Date.now(),
      type,
      x: 50,
      y: 50,
      width: type === "text" ? 200 : type === "barcode" ? 300 : type === "qrcode" ? 100 : 200,
      height: type === "text" ? 30 : type === "barcode" ? 60 : type === "qrcode" ? 100 : 100,
      content: type === "text" ? "새 텍스트" : 
               type === "barcode" ? "1234567890" : 
               type === "qrcode" ? "https://example.com" : "",
      fontSize: type === "text" ? 25 : 20,
      fontType: "A0N",
    };
    setElements([...elements, newElement]);
    setSelectedElement(newElement.id);
  };

  // 요소 선택
  const selectElement = (id) => {
    setSelectedElement(id);
  };

  // 요소 삭제
  const deleteElement = (id) => {
    setElements(elements.filter(el => el.id !== id));
    if (selectedElement === id) {
      setSelectedElement(null);
    }
  };

  // 요소 속성 업데이트
  const updateElement = (id, updates) => {
    setElements(elements.map(el => 
      el.id === id ? { ...el, ...updates } : el
    ));
  };

  // 드래그 시작
  const handleDragStart = (e, element) => {
    setDraggedElement(element);
    e.dataTransfer.effectAllowed = "move";
  };

  // 드래그 중
  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  // 드롭 처리
  const handleDrop = (e) => {
    e.preventDefault();
    if (!draggedElement) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    updateElement(draggedElement.id, { x: Math.max(0, x - 50), y: Math.max(0, y - 15) });
    setDraggedElement(null);
  };

  // ZPL 코드 생성
  const generateZPL = () => {
    let zpl = "^XA\n^CI28\n"; // 시작 + UTF-8
    
    elements.forEach(element => {
      const zplX = pixelToZPL(element.x);
      const zplY = pixelToZPL(element.y);
      
      zpl += `^FO${zplX},${zplY}\n`;
      
      if (element.type === "text") {
        zpl += `^${element.fontType},${element.fontSize},${element.fontSize}\n`;
        zpl += `^FD${element.content}^FS\n`;
      } else if (element.type === "barcode") {
        zpl += `^BY2,2,50\n`;
        zpl += `^BCN,${Math.round(element.height)},Y,N,N,A\n`;
        zpl += `^FD${element.content}^FS\n`;
      } else if (element.type === "qrcode") {
        zpl += `^BQN,2,4,H,7\n`;
        zpl += `^FDQA,${element.content}^FS\n`;
      } else if (element.type === "box") {
        zpl += `^GB${Math.round(element.width)},${Math.round(element.height)},3^FS\n`;
      } else if (element.type === "line") {
        zpl += `^GB${Math.round(element.width)},2,2^FS\n`;
      }
      
      zpl += "\n";
    });
    
    zpl += "^XZ";
    return zpl;
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
      await navigator.clipboard.writeText(generatedZPL);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error("Copy failed:", err);
    }
  };

  // 선택된 요소 정보
  const selectedElementData = elements.find(el => el.id === selectedElement);
  const currentSize = LABEL_SIZES[labelSize];

  return (
    <div className="max-w-7xl mx-auto p-6 bg-gray-50 min-h-screen">
      {/* 헤더 */}
      <div className="mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-4xl font-bold text-gray-800 mb-2">비주얼 ZPL 에디터</h1>
            <div className="flex items-center gap-2 text-black text-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>드래그 앤 드롭으로 ZPL 라벨 디자인</span>
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
              href="/"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              🔧 코드 에디터
            </Link>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* 상단 그리드: 도구 상자 + 캔버스 + 속성 패널 */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* 왼쪽: 도구 상자 */}
          <div className="bg-white rounded-lg p-5 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">도구 상자</h2>
            
            {/* 라벨 크기 설정 */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">라벨 크기</label>
              <select 
                value={labelSize}
                onChange={(e) => setLabelSize(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {Object.entries(LABEL_SIZES).map(([key, size]) => (
                  <option key={key} value={key}>{size.name}</option>
                ))}
              </select>
            </div>

            {/* 요소 추가 버튼들 */}
            <div className="space-y-2 mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-3">요소 추가</h3>
              {Object.entries(ELEMENT_TYPES).map(([type, config]) => (
                <button
                  key={type}
                  onClick={() => addElement(type)}
                  className="w-full flex items-center gap-2 px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-md text-sm transition-colors"
                >
                  <span className="text-lg">{config.icon}</span>
                  <span>{config.name}</span>
                </button>
              ))}
            </div>

            {/* ZPL 생성 */}
            <button
              onClick={handleGenerate}
              disabled={isGenerating || elements.length === 0}
              className="w-full px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {isGenerating ? "생성 중..." : "ZPL 생성"}
            </button>
          </div>

          {/* 가운데: 캔버스 */}
          <div className="lg:col-span-2 bg-white rounded-lg p-5 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">
                디자인 캔버스 ({currentSize.name})
              </h2>
              <div className="text-sm text-gray-500">
                {currentSize.width} x {currentSize.height}px
              </div>
            </div>

            {/* 캔버스 */}
            <div className="flex justify-center">
              <div 
                ref={canvasRef}
                className="relative border-2 border-gray-300 bg-white"
                style={{ 
                  width: currentSize.width, 
                  height: currentSize.height,
                  minHeight: '400px'
                }}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                {/* 격자 배경 */}
                <div 
                  className="absolute inset-0 opacity-10"
                  style={{
                    backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)',
                    backgroundSize: '20px 20px'
                  }}
                />

                {/* 요소들 렌더링 */}
                {elements.map(element => (
                  <div
                    key={element.id}
                    className={`absolute border-2 cursor-move ${ELEMENT_TYPES[element.type].color} ${
                      selectedElement === element.id ? 'ring-2 ring-blue-400' : ''
                    }`}
                    style={{
                      left: element.x,
                      top: element.y,
                      width: element.width,
                      height: element.height,
                    }}
                    draggable
                    onDragStart={(e) => handleDragStart(e, element)}
                    onClick={() => selectElement(element.id)}
                  >
                    <div className="flex items-center justify-center h-full text-xs font-medium text-gray-700 p-1 text-center">
                      <span className="mr-1">{ELEMENT_TYPES[element.type].icon}</span>
                      {element.type === "text" ? element.content : 
                       element.type === "barcode" ? "바코드" :
                       element.type === "qrcode" ? "QR" :
                       element.type === "box" ? "박스" : "라인"}
                    </div>

                    {/* 삭제 버튼 */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteElement(element.id);
                      }}
                      className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs hover:bg-red-600"
                    >
                      ×
                    </button>
                  </div>
                ))}

                {/* 빈 캔버스 안내 */}
                {elements.length === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                    <div className="text-center">
                      <div className="text-4xl mb-2">📝</div>
                      <div>왼쪽 도구 상자에서 요소를 추가하세요</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 오른쪽: 속성 패널 */}
          <div className="space-y-6">
            {/* 요소 속성 */}
            {selectedElementData && (
              <div className="bg-white rounded-lg p-5 shadow-sm">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">요소 속성</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {ELEMENT_TYPES[selectedElementData.type].name}
                    </label>
                  </div>

                  {/* 위치 */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">X</label>
                      <input
                        type="number"
                        value={selectedElementData.x}
                        onChange={(e) => updateElement(selectedElementData.id, { x: parseInt(e.target.value) || 0 })}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Y</label>
                      <input
                        type="number"
                        value={selectedElementData.y}
                        onChange={(e) => updateElement(selectedElementData.id, { y: parseInt(e.target.value) || 0 })}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                    </div>
                  </div>

                  {/* 크기 */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">너비</label>
                      <input
                        type="number"
                        value={selectedElementData.width}
                        onChange={(e) => updateElement(selectedElementData.id, { width: parseInt(e.target.value) || 0 })}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">높이</label>
                      <input
                        type="number"
                        value={selectedElementData.height}
                        onChange={(e) => updateElement(selectedElementData.id, { height: parseInt(e.target.value) || 0 })}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                    </div>
                  </div>

                  {/* 내용 */}
                  {selectedElementData.type !== "box" && selectedElementData.type !== "line" && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">내용</label>
                      <input
                        type="text"
                        value={selectedElementData.content}
                        onChange={(e) => updateElement(selectedElementData.id, { content: e.target.value })}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                    </div>
                  )}

                  {/* 텍스트 폰트 크기 */}
                  {selectedElementData.type === "text" && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">폰트 크기</label>
                      <input
                        type="number"
                        value={selectedElementData.fontSize}
                        onChange={(e) => updateElement(selectedElementData.id, { fontSize: parseInt(e.target.value) || 12 })}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ZPL 코드 */}
            {generatedZPL && (
              <div className="bg-white rounded-lg p-5 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-800">ZPL 코드</h2>
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
                <textarea
                  value={generatedZPL}
                  readOnly
                  className="w-full h-40 font-mono text-sm border border-gray-300 rounded-md p-3 bg-gray-50 resize-none"
                />
              </div>
            )}
          </div>
        </div>

        {/* 하단: 큰 미리보기 */}
        {previewUrl && (
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">라벨 미리보기</h2>
            <div className="flex justify-center">
              <div className="border-2 border-gray-300 rounded-lg bg-gray-100 p-8 flex items-center justify-center">
                <img 
                  src={previewUrl} 
                  alt="Label Preview" 
                  className="max-w-full max-h-96 object-contain shadow-lg"
                  style={{ minWidth: '400px', minHeight: '300px' }}
                />
              </div>
            </div>
            <div className="text-center mt-4 text-sm text-gray-600">
              실제 프린터에서 출력될 라벨 모양입니다
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VisualEditor;