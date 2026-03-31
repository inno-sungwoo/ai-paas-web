import { useState } from 'react';
import Editor from 'react-simple-code-editor';
import { highlight, languages } from 'prismjs';
import 'prismjs/components/prism-yaml';
import 'prismjs/themes/prism.css';
import { useGetChartValues, useDeployChart } from '@/hooks/service/catalog';
import { checkYamlSecurity, autoFixYaml } from '@/util/checkYamlSecurity';
import { SecurityCheckPopup } from './SecurityCheckPopup';
import { DeploymentEstimateModal } from '../cost/DeploymentEstimateModal';
import { useToast } from '@/components/ui/toast';

interface DeployCatalogModalProps {
  repoName: string;
  chartName: string;
  chartVersion: string;
  onClose: () => void;
  onSuccess: () => void;
}

type Step = 'form' | 'security' | 'estimate';

export const DeployCatalogModal = ({
  repoName,
  chartName,
  chartVersion,
  onClose,
  onSuccess,
}: DeployCatalogModalProps) => {
  const [releaseName, setReleaseName] = useState('');
  const [namespace, setNamespace] = useState('ai-pass3');
  const [clusterId, setClusterId] = useState('innogrid-aikube');
  const [version] = useState(chartVersion);
  const [step, setStep] = useState<Step>('form');
  const { addToast } = useToast();

  // version 파라미터 없이 호출 — 최신 버전 values를 가져옴 (version 지정 시 캐시 미스 방지)
  const { chartValues, isPending: valuesLoading } = useGetChartValues(repoName, chartName);
  const [valuesContent, setValuesContent] = useState('');
  const [valuesLoaded, setValuesLoaded] = useState(false);

  if (chartValues?.valuesContent && !valuesLoaded) {
    // helm show values 결과에 WARNING 라인이 포함될 수 있으므로 제거
    const cleanValues = chartValues.valuesContent
      .split('\n')
      .filter((line) => !line.startsWith('WARNING:') && !line.startsWith('Repository '))
      .join('\n')
      .trimStart();
    setValuesContent(cleanValues);
    setValuesLoaded(true);
  }

  const deployMutation = useDeployChart();
  const securityWarnings = step !== 'form' ? checkYamlSecurity(valuesContent) : [];

  const handleDeploy = () => {
    const warnings = checkYamlSecurity(valuesContent);
    if (warnings.length > 0) {
      setStep('security');
    } else {
      setStep('estimate');
    }
  };

  const [deployError, setDeployError] = useState('');

  const handleConfirmDeploy = () => {
    setDeployError('');
    deployMutation.mutate(
      { repoName, chartName, releaseName, clusterId, namespace, version, valuesContent },
      {
        onSuccess: () => {
          addToast('success', `"${releaseName}" 배포가 시작되었습니다.`);
          onSuccess();
          onClose();
        },
        onError: async (error: any) => {
          try {
            const body = await error.response?.json?.();
            const msg = body?.message || '';
            if (msg.includes('already exists')) {
              setDeployError(
                `릴리즈 이름 "${releaseName}"이(가) 이미 존재합니다. 다른 이름을 사용하세요.`
              );
            } else if (msg.includes('Quota') || msg.includes('exceeded')) {
              setDeployError('GPU Quota를 초과했습니다. GPU가 반납되면 다시 시도하세요.');
            } else if (msg.includes('no chart version found') || msg.includes('not found in')) {
              setDeployError('차트 버전을 찾을 수 없습니다. 버전을 확인해주세요.');
            } else if (msg.includes('YAML') || msg.includes('parse')) {
              setDeployError('values.yaml 형식이 올바르지 않습니다. YAML 문법을 확인해주세요.');
            } else if (msg.includes('connect') || msg.includes('timeout')) {
              setDeployError('클러스터에 연결할 수 없습니다. 네트워크를 확인해주세요.');
            } else {
              setDeployError(msg || '배포에 실패했습니다. 다시 시도해주세요.');
            }
          } catch {
            setDeployError('배포에 실패했습니다. 다시 시도해주세요.');
          }
          setStep('form');
        },
      }
    );
  };

  if (step === 'security') {
    return (
      <SecurityCheckPopup
        warnings={securityWarnings}
        onEdit={() => setStep('form')}
        onAutoFix={() => {
          setValuesContent(autoFixYaml(valuesContent));
          setStep('form');
        }}
        onProceed={() => setStep('estimate')}
      />
    );
  }

  if (step === 'estimate') {
    return (
      <DeploymentEstimateModal
        onClose={() => setStep('form')}
        onConfirm={handleConfirmDeploy}
        confirmLabel="배포"
        isConfirming={deployMutation.isPending}
        releaseName={releaseName}
        namespace={namespace}
        clusterId={clusterId}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-[640px] rounded-lg bg-white p-6 shadow-xl">
        <h3 className="mb-4 text-lg font-semibold text-[#1a1a1a]">차트 배포 - {chartName}</h3>
        <div className="mb-4 space-y-3">
          <div>
            <label className="mb-1 block text-xs text-[#525252]">릴리즈 이름</label>
            <input
              type="text"
              value={releaseName}
              onChange={(e) => setReleaseName(e.target.value)}
              placeholder="my-release"
              className="w-full rounded border border-[#e8e8e8] px-3 py-2 text-sm"
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="mb-1 block text-xs text-[#525252]">클러스터</label>
              <select
                value={clusterId}
                onChange={(e) => setClusterId(e.target.value)}
                className="w-full rounded border border-[#e8e8e8] px-3 py-2 text-sm"
              >
                <option value="innogrid-aikube">innogrid-aikube</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-[#525252]">네임스페이스</label>
              <input
                type="text"
                value={namespace}
                onChange={(e) => setNamespace(e.target.value)}
                className="w-full rounded border border-[#e8e8e8] px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-[#525252]">버전</label>
              <input
                type="text"
                value={version}
                readOnly
                className="w-full rounded border border-[#e8e8e8] bg-[#f5f5f5] px-3 py-2 text-sm text-[#999]"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs text-[#525252]">
              values.yaml
              {valuesLoading && <span className="ml-2 text-[#999]">(로딩 중...)</span>}
            </label>
            <div className="max-h-[320px] overflow-auto rounded border border-[#e8e8e8]">
              <Editor
                value={valuesContent}
                onValueChange={setValuesContent}
                highlight={(code) => highlight(code, languages.yaml, 'yaml')}
                padding={12}
                style={{
                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                  fontSize: 12,
                  lineHeight: 1.5,
                  minHeight: 280,
                }}
                placeholder={
                  valuesLoading
                    ? 'values.yaml을 불러오는 중입니다...'
                    : '# values.yaml 내용을 입력하세요. 비워두면 기본값으로 배포됩니다.'
                }
              />
            </div>
          </div>
        </div>
        {deployError && (
          <div className="mb-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {deployError}
          </div>
        )}
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded border border-[#e8e8e8] px-4 py-2 text-sm text-[#525252] hover:bg-[#f5f5f5]"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleDeploy}
            disabled={!releaseName || !namespace}
            className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
          >
            배포
          </button>
        </div>
      </div>
    </div>
  );
};
