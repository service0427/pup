import { useState } from 'react';
import { X, ChevronDown, ChevronUp } from 'lucide-react';

interface SignupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToLogin: () => void;
}

export function SignupModal({ isOpen, onClose, onSwitchToLogin }: SignupModalProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [referrer, setReferrer] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // 유효성 검사
    if (username.length < 3) {
      setError('아이디는 최소 3자 이상 입력해주세요.');
      return;
    }

    if (/[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(username)) {
      setError('아이디에는 한글이 들어갈 수 없습니다.');
      return;
    }

    if (/[~!@#$%^&*()_+|<>?:{}]/.test(username)) {
      setError('아이디에는 특수문자가 들어갈 수 없습니다.');
      return;
    }

    if (password.length < 4 || password.length > 20) {
      setError('비밀번호는 4~20자리로 입력해주세요.');
      return;
    }

    if (password !== passwordConfirm) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

    if (!termsAccepted) {
      setError('이용약관과 개인정보 처리방침에 동의해주세요.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('http://localhost:3001/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          password,
          referrer: referrer || undefined,
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert('회원가입이 완료되었습니다. 로그인해주세요.');
        onClose();
        onSwitchToLogin();
      } else {
        setError(data.message || '회원가입에 실패했습니다.');
      }
    } catch (error) {
      setError('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 배경 오버레이 */}
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />

      {/* 모달 */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold">회원가입</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* 폼 영역 */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 아이디 */}
            <div>
              <input
                type="text"
                placeholder="아이디"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {/* 비밀번호 */}
            <div>
              <input
                type="password"
                placeholder="비밀번호"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {/* 비밀번호 확인 */}
            <div>
              <input
                type="password"
                placeholder="비밀번호 확인"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {/* 추천인 */}
            <div>
              <input
                type="text"
                placeholder="추천인(선택)"
                value={referrer}
                onChange={(e) => setReferrer(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* 약관 섹션 */}
            <div className="space-y-3">
              {/* 이용약관 */}
              <div className="border border-gray-200 rounded-lg">
                <button
                  type="button"
                  onClick={() => setShowTerms(!showTerms)}
                  className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50"
                >
                  <span className="font-medium">이용약관</span>
                  {showTerms ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </button>
                {showTerms && (
                  <div className="px-4 py-3 border-t max-h-40 overflow-y-auto text-sm text-gray-600">
                    <h3 className="font-bold mb-2">제1장 총칙</h3>
                    <p className="mb-2">
                      <strong>제1조 (목적)</strong><br />
                      본 약관은 서비스 이용자가 Place-UP 시스템(이하 "회사"라 합니다)가 제공하는 온라인상의 인터넷 서비스를
                      이용함에 있어 회사와 회원의 권리 의무 및 책임사항을 규정함을 목적으로 합니다.
                    </p>
                    <p className="mb-2">
                      <strong>제2조 (약관의 명시, 효력 및 개정)</strong><br />
                      ① "회사"는 이 약관의 내용을 회원이 쉽게 알 수 있도록 서비스 초기 화면에 게시합니다.<br />
                      ② "회사"는 관련법을 위배하지 않는 범위에서 이 약관을 개정할 수 있습니다.
                    </p>
                    <h3 className="font-bold mb-2 mt-4">제2장 회원의 가입 및 관리</h3>
                    <p className="mb-2">
                      <strong>제3조 (회원가입절차)</strong><br />
                      ① 서비스 이용자가 본 약관을 읽고 "동의" 버튼을 누르거나 체크하는 방법을 취한 경우
                      본 약관에 동의한 것으로 간주합니다.
                    </p>
                    <p className="mb-2">
                      <strong>제4조 (회원등록의 성립과 유보 및 거절)</strong><br />
                      ① 회원등록은 서비스 이용자의 회원가입 신청과 회사의 회원등록 승낙에 의하여 성립합니다.
                    </p>
                    {/* 더 많은 약관 내용... */}
                  </div>
                )}
              </div>

              {/* 개인정보처리방침 */}
              <div className="border border-gray-200 rounded-lg">
                <button
                  type="button"
                  onClick={() => setShowPrivacy(!showPrivacy)}
                  className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50"
                >
                  <span className="font-medium">개인정보처리방침</span>
                  {showPrivacy ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </button>
                {showPrivacy && (
                  <div className="px-4 py-3 border-t max-h-40 overflow-y-auto text-sm text-gray-600">
                    <h3 className="font-bold mb-2 text-center">Place-UP 개인정보처리방침</h3>
                    <p className="text-right text-xs mb-3">ver.2025.01.01</p>
                    <p className="mb-2">
                      Place-UP 시스템(이하 '회사')는 회원님의 개인정보를 중요시하며, 개인정보의 보호와 관련하여
                      「정보통신망 이용촉진 및 정보보호 등에 관한 법률」 등 관련법 상의 개인정보 보호 규정을 준수하고 있습니다.
                    </p>
                    <p className="mb-2">
                      <strong>1. 수집하는 개인정보 항목 및 수집방법</strong><br />
                      회사는 회원가입, 상담, 서비스 신청 및 제공 등을 위해 다음과 같은 개인정보를 수집하고 있습니다.<br />
                      - 필수 수집항목: 아이디, 비밀번호<br />
                      - 선택 수집항목: 이메일, 연락처
                    </p>
                    <p className="mb-2">
                      <strong>2. 개인정보의 수집 및 이용목적</strong><br />
                      - 서비스 제공에 관한 계약 이행 및 서비스 제공에 따른 요금정산<br />
                      - 회원 관리: 회원제 서비스 이용에 따른 본인확인, 개인 식별
                    </p>
                    <p className="mb-2">
                      <strong>3. 개인정보의 보유 및 이용기간</strong><br />
                      회사는 원칙적으로 개인정보 수집 및 이용목적이 달성된 후에는 해당 개인정보를 지체 없이 파기합니다.
                    </p>
                    {/* 더 많은 개인정보처리방침 내용... */}
                  </div>
                )}
              </div>
            </div>

            {/* 동의 체크박스 */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="terms-accept"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="terms-accept" className="ml-2 text-sm text-gray-700">
                이용약관과 개인정보 처리방침에 동의합니다.
              </label>
            </div>

            {/* 에러 메시지 */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            {/* 버튼 */}
            <div className="space-y-3">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium disabled:opacity-50"
              >
                {loading ? '처리 중...' : '회원가입'}
              </button>
              <button
                type="button"
                onClick={onSwitchToLogin}
                className="w-full py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium"
              >
                로그인
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}