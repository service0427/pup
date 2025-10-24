import { useState } from 'react';
import { Settings, DollarSign, Info } from 'lucide-react';
import { ContentPricingSettings } from '../components/ContentPricingSettings';

export function SystemSettingsPage() {
  const [activeTab, setActiveTab] = useState<'pricing' | 'general'>('pricing');

  const tabs = [
    { key: 'pricing', label: '컨텐츠 가격', icon: DollarSign },
    { key: 'general', label: '일반 설정', icon: Settings }
  ];

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">시스템 설정</h1>
        <p className="text-gray-600">관리자 전용 시스템 설정을 관리할 수 있습니다.</p>
      </div>

      {/* 탭 메뉴 */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;

              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as 'pricing' | 'general')}
                  className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${
                    isActive
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* 탭 컨텐츠 */}
      <div className="space-y-6">
        {activeTab === 'pricing' && (
          <div>
            <ContentPricingSettings />
          </div>
        )}

        {activeTab === 'general' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <Info className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">일반 설정</h3>
                <p className="text-sm text-gray-600">시스템 전반적인 설정을 관리합니다.</p>
              </div>
            </div>

            <div className="text-center py-12 text-gray-500">
              <Settings className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>일반 설정은 추후 추가될 예정입니다.</p>
              <p className="text-sm mt-1">현재는 컨텐츠 가격 설정만 사용 가능합니다.</p>
            </div>
          </div>
        )}
      </div>

      {/* 하단 안내 */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="w-5 h-5 text-blue-600 mt-0.5">ℹ️</div>
          <div className="text-sm text-blue-800">
            <p className="font-medium">시스템 설정 안내</p>
            <ul className="mt-1 space-y-1 text-xs">
              <li>• 설정 변경은 관리자 및 개발자만 가능합니다.</li>
              <li>• 모든 변경 사항은 즉시 적용되며 시스템에 기록됩니다.</li>
              <li>• 중요한 설정 변경 시에는 사전에 백업을 권장합니다.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}