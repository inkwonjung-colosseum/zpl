import React, { useState } from "react";
import Link from "next/link";

// ZPL 명령어 카테고리별 정리
const ZPL_COMMANDS = {
  // 기본 명령어
  basic: {
    title: "기본 명령어",
    description: "ZPL 라벨의 시작과 끝을 정의하는 기본 명령어들",
    commands: [
      {
        command: "^XA",
        description: "라벨 시작 (ZPL 시작)",
        example: "^XA\n^FO100,100\n^FDHello World^FS\n^XZ",
        notes: "모든 ZPL 코드는 이 명령어로 시작해야 합니다."
      },
      {
        command: "^XZ",
        description: "라벨 끝 (ZPL 종료)",
        example: "^XA\n^FO100,100\n^FDHello World^FS\n^XZ",
        notes: "라벨 정의를 완료하고 인쇄를 준비합니다."
      },
      {
        command: "^CI28",
        description: "UTF-8 인코딩 설정 (한국어 지원)",
        example: "^XA\n^CI28\n^FO100,100\n^FD안녕하세요^FS\n^XZ",
        notes: "한국어 등 유니코드 문자를 사용할 때 필요합니다."
      }
    ]
  },

  // 위치 및 필드 명령어
  positioning: {
    title: "위치 및 필드 명령어",
    description: "텍스트와 그래픽의 위치를 지정하고 필드를 정의하는 명령어들",
    commands: [
      {
        command: "^FOx,y",
        description: "필드 오리진 (Field Origin) - x,y 좌표 설정",
        example: "^FO100,100\n^FDHello^FS",
        notes: "x,y는 픽셀 단위입니다. (0,0)은 좌상단입니다."
      },
      {
        command: "^FDtext^FS",
        description: "필드 데이터 (Field Data) - 텍스트 표시",
        example: "^FO100,100\n^FDHello World^FS",
        notes: "^FD와 ^FS 사이에 표시할 텍스트를 입력합니다."
      },
      {
        command: "^GBwidth,height,thickness",
        description: "그래픽 박스 (Graphic Box) - 사각형 그리기",
        example: "^FO100,100\n^GB200,100,3^FS",
        notes: "width: 너비, height: 높이, thickness: 선 두께"
      },
      {
        command: "^GCwidth,height",
        description: "그래픽 서클 (Graphic Circle) - 원 그리기",
        example: "^FO100,100\n^GC100,100^FS",
        notes: "width와 height가 같으면 완벽한 원이 됩니다."
      }
    ]
  },

  // 폰트 및 텍스트 명령어
  fonts: {
    title: "폰트 및 텍스트 명령어",
    description: "텍스트의 폰트, 크기, 스타일을 설정하는 명령어들",
    commands: [
      {
        command: "^Afont,height,width",
        description: "폰트 설정 (Font)",
        example: "^FO100,100\n^A0N,50,50\n^FDHello^FS",
        notes: "font: 폰트 타입(0-9), height: 높이, width: 너비"
      },
      {
        command: "^AfontN,height,width",
        description: "폰트 설정 (Normal)",
        example: "^FO100,100\n^A0N,50,50\n^FDHello^FS",
        notes: "N은 Normal을 의미합니다. R(Reverse), I(Italic)도 가능"
      },
      {
        command: "^AfontR,height,width",
        description: "폰트 설정 (Reverse)",
        example: "^FO100,100\n^A0R,50,50\n^FDHello^FS",
        notes: "R은 Reverse를 의미합니다. 흰색 텍스트에 검은색 배경"
      },
      {
        command: "^AfontI,height,width",
        description: "폰트 설정 (Italic)",
        example: "^FO100,100\n^A0I,50,50\n^FDHello^FS",
        notes: "I는 Italic을 의미합니다. 기울어진 텍스트"
      }
    ]
  },

  // 바코드 명령어
  barcodes: {
    title: "바코드 명령어",
    description: "다양한 종류의 바코드를 생성하는 명령어들",
    commands: [
      {
        command: "^BCheight,human_readable,orientation,check_digit,print_check_digit,check_digit_above",
        description: "Code 128 바코드",
        example: "^FO100,100\n^BCN,100,Y,N,N,A\n^FD1234567890^FS",
        notes: "가장 일반적인 바코드 타입입니다."
      },
      {
        command: "^B3height,human_readable,orientation,check_digit,print_check_digit,check_digit_above",
        description: "Code 39 바코드",
        example: "^FO100,100\n^B3N,100,Y,N,N,A\n^FD1234567890^FS",
        notes: "숫자와 대문자만 지원합니다."
      },
      {
        command: "^B8height,human_readable,orientation,check_digit,print_check_digit,check_digit_above",
        description: "EAN-8 바코드",
        example: "^FO100,100\n^B8N,100,Y,N,N,A\n^FD1234567^FS",
        notes: "8자리 숫자만 지원합니다."
      },
      {
        command: "^BEN,height,human_readable,orientation,check_digit,print_check_digit,check_digit_above",
        description: "EAN-13 바코드",
        example: "^FO100,100\n^BEN,100,Y,N,N,A\n^FD1234567890123^FS",
        notes: "13자리 숫자만 지원합니다."
      }
    ]
  },

  // QR코드 명령어
  qrcodes: {
    title: "QR코드 명령어",
    description: "QR코드를 생성하는 명령어들",
    commands: [
      {
        command: "^BQorientation,model,error_correction,magnification",
        description: "QR코드 생성",
        example: "^FO100,100\n^BQN,2,4,H,7\n^FDQA,https://example.com^FS",
        notes: "orientation: 방향, model: 모델, error_correction: 오류 수정 레벨"
      },
      {
        command: "^BQorientation,model,error_correction,magnification,separator,data",
        description: "QR코드 데이터 포함",
        example: "^FO100,100\n^BQN,2,4,H,7\n^FDQA,Hello World^FS",
        notes: "QA는 QR코드 타입을 의미합니다."
      }
    ]
  },

  // 이미지 및 그래픽 명령어
  graphics: {
    title: "이미지 및 그래픽 명령어",
    description: "이미지와 그래픽을 처리하는 명령어들",
    commands: [
      {
        command: "^IMfilename",
        description: "이미지 포함 (Include Image)",
        example: "^FO100,100\n^IMlogo.png^FS",
        notes: "프린터에 저장된 이미지 파일을 포함합니다."
      },
      {
        command: "^ILfilename",
        description: "이미지 로드 (Load Image)",
        example: "^ILlogo.png^FS",
        notes: "이미지를 프린터 메모리에 로드합니다."
      },
      {
        command: "^ISfilename",
        description: "이미지 저장 (Store Image)",
        example: "^ISlogo.png^FS",
        notes: "이미지를 프린터 메모리에 저장합니다."
      }
    ]
  },

  // 프린터 설정 명령어
  printer: {
    title: "프린터 설정 명령어",
    description: "프린터의 동작을 제어하는 명령어들",
    commands: [
      {
        command: "^MMmode",
        description: "프린터 모드 설정",
        example: "^MMT^FS",
        notes: "T: Tear-off, C: Cutter, R: Rewinder"
      },
      {
        command: "^POn",
        description: "인쇄 속도 설정",
        example: "^PO2^FS",
        notes: "0: 최고 속도, 1: 고속, 2: 중속, 3: 저속"
      },
      {
        command: "^JMn",
        description: "인쇄 방향 설정",
        example: "^JM0^FS",
        notes: "0: 정상, 1: 90도 회전, 2: 180도 회전, 3: 270도 회전"
      }
    ]
  },

  // 고급 기능 명령어
  advanced: {
    title: "고급 기능 명령어",
    description: "고급 기능을 제공하는 명령어들",
    commands: [
      {
        command: "^BYwidth,ratio,height",
        description: "바코드 기본 설정",
        example: "^BY3,3,80\n^BCN,100,Y,N,N,A\n^FD1234567890^FS",
        notes: "바코드의 기본 너비, 비율, 높이를 설정합니다."
      },
      {
        command: "^FWorientation",
        description: "필드 방향 설정",
        example: "^FWN\n^FO100,100\n^FDHello^FS",
        notes: "N: Normal, R: Right, I: Inverted, B: Bottom"
      },
      {
        command: "^FTx,y",
        description: "필드 텍스트 위치",
        example: "^FT100,100\n^FDHello^FS",
        notes: "텍스트 필드의 기준점을 설정합니다."
      }
    ]
  }
};

// 실제 사용 예제
const PRACTICAL_EXAMPLES = [
  {
    title: "기본 배송 라벨",
    description: "받는 사람 정보와 주문번호가 포함된 기본 배송 라벨",
    code: `^XA
^FO50,50
^A0N,40,40
^FD배송 라벨^FS

^FO50,120
^A0N,25,25
^FD받는 분: 홍길동^FS
^FO50,160
^A0N,25,25
^FD주소: 서울시 강남구 테헤란로 123^FS
^FO50,200
^A0N,25,25
^FD연락처: 010-1234-5678^FS

^FO50,260
^BY2,2,50
^BCN,100,Y,N,N,A
^FDORD-2024-001^FS

^FO50,400
^A0N,20,20
^FD주문번호: ORD-2024-001^FS
^FO50,430
^A0N,20,20
^FD발송일: 2024-08-27^FS
^XZ`,
    explanation: "이 예제는 배송 라벨의 기본 구조를 보여줍니다. ^FO로 위치를 지정하고, ^A0N으로 폰트를 설정하며, ^BCN으로 Code 128 바코드를 생성합니다."
  },
  {
    title: "상품 정보 라벨",
    description: "상품명, 가격, 바코드가 포함된 상품 라벨",
    code: `^XA
^FO100,50
^A0N,30,30
^FD상품 정보^FS

^FO100,120
^BY3,3,80
^BCN,100,Y,N,N,A
^FD1234567890^FS

^FO100,250
^A0N,25,25
^FD상품명: 테스트 상품 A^FS
^FO100,290
^A0N,20,20
^FD가격: 10,000원^FS
^FO100,330
^A0N,20,20
^FD제조사: 샘플 제조사^FS

^FO100,380
^GB200,2,3^FS
^FO100,400
^A0N,15,15
^FDMade in Korea^FS
^XZ`,
    explanation: "상품 라벨에는 상품의 기본 정보와 바코드가 포함됩니다. ^GB로 구분선을 그리고, 다양한 폰트 크기를 사용하여 정보의 계층을 표현합니다."
  },
  {
    title: "QR코드 라벨",
    description: "QR코드와 상품 정보가 포함된 현대적인 라벨",
    code: `^XA
^FO50,50
^A0N,30,30
^FDQR코드 라벨^FS

^FO50,120
^BQN,2,4,H,7
^FDQA,https://example.com/product/123^FS

^FO300,120
^A0N,25,25
^FD상품 정보^FS
^FO300,160
^A0N,20,20
^FD제품명: 샘플 제품 1^FS
^FO300,190
^A0N,20,20
^FD모델번호: SP-001^FS
^FO300,220
^A0N,20,20
^FD시리얼번호: SN-2024-001^FS

^FO50,350
^GB400,2,3^FS
^FO50,370
^A0N,15,15
^FD스캔하여 더 많은 정보 확인^FS
^XZ`,
    explanation: "QR코드 라벨은 모바일 기기로 스캔할 수 있어 현대적인 라벨링에 적합합니다. ^BQN으로 QR코드를 생성하고, URL이나 텍스트 정보를 포함할 수 있습니다."
  },
  {
    title: "한국어 UTF-8 라벨",
    description: "한국어를 지원하는 UTF-8 인코딩 라벨",
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
    explanation: "한국어를 사용하려면 ^CI28 명령어로 UTF-8 인코딩을 설정해야 합니다. 이 명령어는 라벨 시작 부분에 위치해야 합니다."
  }
];

const ZPLReferencePage = () => {
  const [selectedCategory, setSelectedCategory] = useState("basic");
  const [selectedExample, setSelectedExample] = useState(0);

  return (
    <div className="max-w-7xl mx-auto p-6 bg-gray-50 min-h-screen">
      {/* 헤더 */}
      <div className="mb-8">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-4xl font-bold text-gray-800 mb-2">ZPL 문법 참조 가이드</h1>
            <p className="text-gray-600 text-lg">
              Zebra Programming Language (ZPL)의 모든 명령어와 사용법을 예제와 함께 정리했습니다.
            </p>
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
              href="/"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              🔧 코드 에디터
            </Link>
          </div>
        </div>
      </div>

      {/* 카테고리 네비게이션 */}
      <div className="bg-white rounded-lg p-6 shadow-sm mb-8">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">명령어 카테고리</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Object.entries(ZPL_COMMANDS).map(([key, category]) => (
            <button
              key={key}
              className={`p-3 rounded-lg border text-sm font-medium transition-colors ${
                selectedCategory === key
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-blue-500'
              }`}
              onClick={() => setSelectedCategory(key)}
            >
              {category.title}
            </button>
          ))}
        </div>
      </div>

      {/* 선택된 카테고리의 명령어들 */}
      <div className="bg-white rounded-lg p-6 shadow-sm mb-8">
        <h2 className="text-2xl font-semibold text-gray-800 mb-2">
          {ZPL_COMMANDS[selectedCategory].title}
        </h2>
        <p className="text-gray-600 mb-6">
          {ZPL_COMMANDS[selectedCategory].description}
        </p>
        
        <div className="space-y-6">
          {ZPL_COMMANDS[selectedCategory].commands.map((cmd, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start gap-4">
                <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded font-mono text-sm font-bold min-w-fit">
                  {cmd.command}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800 mb-2">{cmd.description}</h3>
                  <div className="bg-gray-50 p-3 rounded font-mono text-sm mb-2">
                    {cmd.example}
                  </div>
                  <p className="text-sm text-gray-600">{cmd.notes}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 실제 사용 예제 */}
      <div className="bg-white rounded-lg p-6 shadow-sm mb-8">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">실제 사용 예제</h2>
        
        {/* 예제 선택 탭 */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          {PRACTICAL_EXAMPLES.map((example, index) => (
            <button
              key={index}
              className={`px-4 py-2 rounded-lg border text-sm font-medium whitespace-nowrap transition-colors ${
                selectedExample === index
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-blue-500'
              }`}
              onClick={() => setSelectedExample(index)}
            >
              {example.title}
            </button>
          ))}
        </div>

        {/* 선택된 예제 표시 */}
        <div className="border border-gray-200 rounded-lg p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            {PRACTICAL_EXAMPLES[selectedExample].title}
          </h3>
          <p className="text-gray-600 mb-4">
            {PRACTICAL_EXAMPLES[selectedExample].description}
          </p>
          
          <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm overflow-x-auto">
            <pre>{PRACTICAL_EXAMPLES[selectedExample].code}</pre>
          </div>
          
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-semibold text-blue-800 mb-2">💡 설명</h4>
            <p className="text-blue-700 text-sm">
              {PRACTICAL_EXAMPLES[selectedExample].explanation}
            </p>
          </div>
        </div>
      </div>

      {/* ZPL 작성 팁 */}
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">ZPL 작성 팁</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">기본 구조</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• 모든 ZPL 코드는 <code className="bg-gray-100 px-1 rounded">^XA</code>로 시작하고 <code className="bg-gray-100 px-1 rounded">^XZ</code>로 끝나야 합니다</li>
              <li>• 위치 지정은 <code className="bg-gray-100 px-1 rounded">^FOx,y</code>로 먼저 설정합니다</li>
              <li>• 텍스트는 <code className="bg-gray-100 px-1 rounded">^FD</code>와 <code className="bg-gray-100 px-1 rounded">^FS</code> 사이에 입력합니다</li>
              <li>• 한국어 사용 시 <code className="bg-gray-100 px-1 rounded">^CI28</code>을 맨 앞에 추가합니다</li>
            </ul>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">좌표 시스템</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• 좌표는 (0,0)이 좌상단입니다</li>
              <li>• x축은 오른쪽으로, y축은 아래쪽으로 증가합니다</li>
              <li>• 단위는 프린터 해상도에 따라 다릅니다 (dpmm)</li>
              <li>• 8dpmm = 203dpi, 12dpmm = 300dpi</li>
            </ul>
          </div>
        </div>
      </div>

      {/* 링크 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-800 mb-3">🔗 추가 리소스</h3>
        <div className="text-sm text-blue-700 space-y-2">
          <p>• <strong>ZPL II Programming Guide</strong> - Zebra 공식 문서</p>
          <p>• <strong>Labelary Online ZPL Viewer</strong> - 온라인 ZPL 미리보기 도구</p>
          <p>• <strong>ZPL Command Reference</strong> - 모든 ZPL 명령어 목록</p>
        </div>
      </div>
    </div>
  );
};

export default ZPLReferencePage;
