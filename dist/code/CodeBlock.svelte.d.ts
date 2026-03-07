type $$ComponentProps = {
    code: string;
    language?: string;
    filename?: string;
    label?: string;
    showLineNumbers?: boolean;
    shell?: boolean;
    maxHeight?: string;
};
declare const CodeBlock: import("svelte").Component<$$ComponentProps, {}, "">;
type CodeBlock = ReturnType<typeof CodeBlock>;
export default CodeBlock;
