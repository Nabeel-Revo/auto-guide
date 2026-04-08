interface LockedBlock {
  contextLine: string;
  content: string;
}

export function extractLockedBlocks(code: string): LockedBlock[] {
  const lockRegex = /\/\/ @autoguide-lock\n([\s\S]*?)\/\/ @autoguide-unlock/g;
  const blocks: LockedBlock[] = [];

  let match;
  while ((match = lockRegex.exec(code)) !== null) {
    const beforeLock = code.substring(0, match.index);
    const lastSceneComment = beforeLock.lastIndexOf('// ──');
    const contextLine = lastSceneComment !== -1
      ? beforeLock.substring(lastSceneComment, beforeLock.indexOf('\n', lastSceneComment)).trim()
      : '';

    blocks.push({ contextLine, content: match[1] });
  }

  return blocks;
}

export function preserveLockedBlocks(existingCode: string, generatedCode: string): string {
  const blocks = extractLockedBlocks(existingCode);
  if (blocks.length === 0) return generatedCode;

  let result = generatedCode;

  for (const block of blocks) {
    if (!block.contextLine) continue;

    const contextIndex = result.indexOf(block.contextLine);
    if (contextIndex === -1) continue;

    const afterContext = contextIndex + block.contextLine.length;
    const nextSceneComment = result.indexOf('// ──', afterContext + 1);
    const endPos = nextSceneComment !== -1 ? nextSceneComment : result.length;

    const beforeContent = result.substring(0, afterContext);
    const afterContent = result.substring(endPos);

    result = beforeContent + '\n  // @autoguide-lock\n' + block.content + '// @autoguide-unlock\n' + afterContent;
  }

  return result;
}
