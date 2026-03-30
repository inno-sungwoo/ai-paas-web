export interface SecurityWarning {
  severity: 'error' | 'warning' | 'info';
  message: string;
  fix?: string;
  line?: number;
}

export function checkYamlSecurity(yamlContent: string): SecurityWarning[] {
  const warnings: SecurityWarning[] = [];
  const lines = yamlContent.split('\n');

  const hasGpuLimit = lines.some((l) => !l.trim().startsWith('#') && l.includes('nvidia.com/gpu'));
  if (!hasGpuLimit) {
    warnings.push({
      severity: 'warning',
      message:
        'GPU 리소스 제한이 설정되지 않았습니다. resources.limits에 nvidia.com/gpu를 추가하세요.',
      fix: '기존 resources: 블록을 찾아서 아래처럼 수정하세요:\n\nresources:\n  limits:\n    nvidia.com/gpu: "1"\n    cpu: 500m\n    memory: 512Mi',
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

  // ingress enabled: true일 때만 인증 경고 (enabled: false면 Ingress 미사용이므로 무시)
  const hasIngressEnabled = lines.some(
    (l) => !l.trim().startsWith('#') && /enabled:\s*true/i.test(l.trim())
  );
  const hasAuth = lines.some(
    (l) =>
      !l.trim().startsWith('#') &&
      (l.includes('auth-type') ||
        l.includes('auth-url') ||
        l.includes('auth-secret') ||
        l.includes('nginx.ingress.kubernetes.io/auth'))
  );
  if (hasIngressEnabled && !hasAuth) {
    warnings.push({
      severity: 'warning',
      message: 'Ingress가 활성화되어 있지만 인증 설정이 없습니다.',
      fix: '기존 ingress: 블록에 annotations를 추가하고, K8s Secret도 생성하세요:\n\ningress:\n  enabled: true\n  annotations:\n    nginx.ingress.kubernetes.io/auth-type: basic\n    nginx.ingress.kubernetes.io/auth-secret: basic-auth\n\n# Secret 생성: kubectl create secret generic basic-auth --from-file=auth -n ai-pass3',
    });
  }

  return warnings;
}

/** 보안 경고 항목을 자동 수정한 YAML을 반환 */
export function autoFixYaml(yamlContent: string): string {
  let lines = yamlContent.split('\n');

  // 1. privileged: true → privileged: false
  lines = lines.map((line) => {
    if (!line.trim().startsWith('#') && /privileged:\s*(true|True|TRUE)/.test(line)) {
      return line.replace(/privileged:\s*(true|True|TRUE)/, 'privileged: false');
    }
    return line;
  });

  // 2. GPU limits 없으면 resources 블록에 추가
  const hasGpuLimit = lines.some((l) => !l.trim().startsWith('#') && l.includes('nvidia.com/gpu'));
  if (!hasGpuLimit) {
    const resourceIdx = lines.findIndex((l) => /^\s*resources:/.test(l));
    if (resourceIdx >= 0) {
      // 기존 resources 블록 뒤에 limits 추가
      const indent = lines[resourceIdx].match(/^(\s*)/)?.[1] ?? '';
      const limitsIdx = lines.findIndex((l, i) => i > resourceIdx && /^\s*limits:/.test(l));
      if (limitsIdx >= 0) {
        // limits 블록이 이미 있으면 그 안에 추가
        lines.splice(limitsIdx + 1, 0, `${indent}      nvidia.com/gpu: "1"`);
      } else {
        // limits 블록이 없으면 새로 추가
        lines.splice(resourceIdx + 1, 0, `${indent}  limits:`, `${indent}    nvidia.com/gpu: "1"`);
      }
    } else {
      // resources 블록 자체가 없으면 끝에 추가
      lines.push('resources:', '  limits:', '    nvidia.com/gpu: "1"');
    }
  }

  return lines.join('\n');
}
