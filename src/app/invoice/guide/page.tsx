import { FileText, Link, Info } from 'lucide-react'

export const metadata = {
  title: '견적서 조회 시스템',
  description: '노션 기반 견적서 관리 시스템',
}

export default function InvoiceGuidePage() {
  return (
    <main className="min-h-screen bg-gray-950 flex flex-col items-center justify-center px-4 py-16">
      {/* 페이지 제목 */}
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-white mb-3">견적서 조회 시스템</h1>
        <p className="text-gray-400">노션 기반 견적서 관리 시스템에 오신 것을 환영합니다</p>
      </div>

      {/* 안내 카드 목록 */}
      <div className="w-full max-w-2xl space-y-4">

        {/* 카드 1: 조회 방법 */}
        <div className="bg-gray-800/60 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5 text-gray-300" />
            <h2 className="text-white font-semibold">견적서 조회 방법</h2>
          </div>
          <ol className="space-y-3 text-sm">
            <li>
              <p className="text-white font-medium">1. 견적서 링크 받기</p>
              <p className="text-gray-400 mt-1">발행자로부터 이메일이나 메신저를 통해 견적서 고유 링크를 받습니다.</p>
            </li>
            <li>
              <p className="text-white font-medium">2. 견적서 확인</p>
              <p className="text-gray-400 mt-1">링크를 클릭하면 견적서 내용을 웹에서 바로 확인할 수 있습니다.</p>
            </li>
            <li>
              <p className="text-white font-medium">3. PDF 다운로드</p>
              <p className="text-gray-400 mt-1">견적서 페이지에서 &apos;PDF 다운로드&apos; 버튼을 클릭하여 파일로 저장하거나 인쇄할 수 있습니다.</p>
            </li>
          </ol>
        </div>

        {/* 카드 2: URL 예시 */}
        <div className="bg-gray-800/60 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center gap-2 mb-4">
            <Link className="w-5 h-5 text-gray-300" />
            <h2 className="text-white font-semibold">견적서 URL 예시</h2>
          </div>
          <code className="block bg-gray-900 text-gray-300 text-sm rounded-lg px-4 py-3 mb-3">
            https://yourdomain.com/invoice/[견적서ID]
          </code>
          <p className="text-gray-400 text-sm">
            발행자가 보낸 링크의 [견적서ID] 부분은 각 견적서마다 고유한 값입니다.
          </p>
        </div>

        {/* 카드 3: 문제 안내 */}
        <div className="bg-gray-800/60 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center gap-2 mb-3">
            <Info className="w-5 h-5 text-gray-300" />
            <h2 className="text-white font-semibold">문제가 있나요?</h2>
          </div>
          <p className="text-gray-400 text-sm">
            견적서를 찾을 수 없거나 문제가 발생한 경우, 견적서를 발행한 담당자에게 올바른 링크를 다시 요청해 주세요.
          </p>
        </div>
      </div>

      {/* 푸터 */}
      <footer className="mt-12 text-gray-600 text-sm">
        © 2025 견적서 시스템. All rights reserved.
      </footer>
    </main>
  )
}
