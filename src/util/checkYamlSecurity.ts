export interface SecurityWarning {
  severity: 'error' | 'warning' | 'info';
  message: string;
  fix?: string;
  line?: number;
}

export function checkYamlSecurity(yamlContent: string): SecurityWarning[] {
  const warnings: SecurityWarning[] = [];
  const lines = yamlContent.split('\n');

  const hasGpuLimit = lines.some(
    (l) => !l.trim().startsWith('#') && l.includes('nvidia.com/gpu'),
  );
  if (!hasGpuLimit) {
    warnings.push({
      severity: 'warning',
      message:
        'GPU 리소스 제한이 설정되지 않았습니다. resources.limits에 nvidia.com/gpu를 추가하세요.',
      fix: 'resources:\n  limits:\n    nvidia.com/gpu: "1"',
    });
  }

  lines.forEach((line, i) => {
    const trimmed = line.trim();
    if (trimmed.startsWith('#')) return;
    if (
      /runAsRoot:\s*(true|True|TRUE)/.test(trimmed) ||
      /privileged:\s*(true|True|TRUE)/.test(trimmed)
    ) {
      warnings.push({
        severity: 'error',
        message: `루트 권한 컨테이너가 감지되었습니다 (${i + 1}행)`,
        fix: `${i + 1}행을 아래로 변경:\nprivileged: false`,
        line: i + 1,
      });
    }
  });

  const hasIngress = lines.some((l) => !l.trim().startsWith('#') && l.includes('ingress:'));
  const hasAuth = lines.some(
    (l) =>
      !l.trim().startsWith('#') &&
      (l.includes('auth-type') ||
        l.includes('auth-url') ||
        l.includes('nginx.ingress.kubernetes.io/auth')),
  );
  if (hasIngress && !hasAuth) {
    warnings.push({
      severity: 'warning',
      message: 'Ingress에 인증 설정이 없습니다.',
      fix: 'ingress:\n  annotations:\n    nginx.ingress.kubernetes.io/auth-type: basic\n    nginx.ingress.kubernetes.io/auth-url: "https://auth.example.com"',
    });
  }

  return warnings;
}
