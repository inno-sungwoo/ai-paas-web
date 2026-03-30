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
      fix: 'resources.limits에 추가:\n  nvidia.com/gpu: "1"',
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
        fix: `${i + 1}행: privileged: false 로 변경`,
        line: i + 1,
      });
    }
  });

  // image.tag: latest 사용 시 경고 (버전 고정 안 됨 → 재현성 없음)
  const hasLatestTag = lines.some(
    (l) => !l.trim().startsWith('#') && /tag:\s*["']?latest["']?\s*$/.test(l.trim())
  );
  if (hasLatestTag) {
    warnings.push({
      severity: 'warning',
      message:
        '이미지 태그가 latest입니다. 버전을 고정하지 않으면 배포 재현성이 보장되지 않습니다.',
      fix: 'tag: latest → 특정 버전으로 변경',
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

  // 2. tag: latest → tag: stable
  lines = lines.map((line) => {
    if (!line.trim().startsWith('#') && /tag:\s*["']?latest["']?\s*$/.test(line.trim())) {
      return line.replace(/tag:\s*["']?latest["']?/, 'tag: stable');
    }
    return line;
  });

  // 3. GPU limits 없으면 resources 블록에 추가
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
